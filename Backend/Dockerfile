FROM golang:alpine AS builder

WORKDIR /src

COPY go.mod ./
RUN go mod download

COPY . .
RUN go mod tidy
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /out/suvasense-backend ./main.go

FROM alpine:latest
RUN adduser -D -H appuser
WORKDIR /app

COPY --from=builder /out/suvasense-backend /app/suvasense-backend
COPY schema.sql /app/schema.sql

USER appuser
EXPOSE 8080

CMD ["/app/suvasense-backend"]
