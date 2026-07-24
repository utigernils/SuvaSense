# Firmware Naming Convention

Files are prefixed by the OS layer they belong to.

## `sys_` — System Core

System-level services: boot state, storage, scheduling, and other kernel-like functionality.

## `hal_` — Hardware Abstraction Layer

All hardware drivers: sensors, actuators, on-board peripherals, and internal diagnostics.

## `net_` — Networking

All communication protocols and connectivity (WiFi, MQTT, etc.).
