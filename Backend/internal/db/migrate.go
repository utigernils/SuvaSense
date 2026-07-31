package db

import (
	"context"
	"fmt"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
)

func EnsureSchema(ctx context.Context, pool *pgxpool.Pool, schemaPath string) error {
	needsInit, err := missingCoreTables(ctx, pool)
	if err != nil {
		return err
	}
	if !needsInit {
		return nil
	}

	schemaBytes, err := os.ReadFile(schemaPath)
	if err != nil {
		return fmt.Errorf("read schema file: %w", err)
	}

	if _, err := pool.Exec(ctx, string(schemaBytes)); err != nil {
		return fmt.Errorf("apply schema: %w", err)
	}

	return nil
}

func missingCoreTables(ctx context.Context, pool *pgxpool.Pool) (bool, error) {
	const q = `
	SELECT
		to_regclass('public.sensors') IS NULL AS missing_sensors,
		to_regclass('public.readings') IS NULL AS missing_readings;
	`

	var missingSensors bool
	var missingReadings bool
	if err := pool.QueryRow(ctx, q).Scan(&missingSensors, &missingReadings); err != nil {
		return false, fmt.Errorf("check existing tables: %w", err)
	}

	return missingSensors || missingReadings, nil
}
