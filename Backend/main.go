package main

import (
    "context"
    "errors"
    "fmt"
    "log"
    "net/http"
    "os"
    "os/signal"
    "syscall"
    "time"

    "SuvaSense_Backend/internal/api"
    "SuvaSense_Backend/internal/config"
    "SuvaSense_Backend/internal/db"
    "SuvaSense_Backend/internal/ingest"
    "SuvaSense_Backend/internal/store"
)

func main() {
    if err := run(); err != nil {
        log.Fatalf("backend failed: %v", err)
    }
}

func run() error {
    cfg, err := config.Load()
    if err != nil {
        return err
    }

    ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
    defer cancel()

    pool, err := db.Connect(ctx, cfg.DB.URL)
    if err != nil {
        return err
    }
    defer pool.Close()

    if err := db.EnsureSchema(ctx, pool, cfg.DB.SchemaPath); err != nil {
        return err
    }

    repo := store.NewRepository(pool)

    ingestSvc := ingest.NewService(cfg.MQTT, repo)
    if err := ingestSvc.Start(ctx); err != nil {
        return err
    }

    handler := api.NewHandler(repo, cfg.MQTT.OnlineThresholdSec)
    router := api.NewRouter(handler)

    httpServer := &http.Server{
        Addr:         fmt.Sprintf("%s:%d", cfg.HTTP.Host, cfg.HTTP.Port),
        Handler:      router,
        ReadTimeout:  10 * time.Second,
        WriteTimeout: 20 * time.Second,
        IdleTimeout:  60 * time.Second,
    }

    errCh := make(chan error, 1)
    go func() {
        log.Printf("http listening on %s", httpServer.Addr)
        if err := httpServer.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
            errCh <- err
        }
    }()

    select {
    case <-ctx.Done():
        shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
        defer shutdownCancel()
        return httpServer.Shutdown(shutdownCtx)
    case err := <-errCh:
        return err
    }
}
