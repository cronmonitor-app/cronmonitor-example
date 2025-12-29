# Bash Examples

Bash wrapper scripts for robust cron job monitoring with proper error handling.

## Quick Start

```bash
#!/bin/bash
set -e  # Exit immediately on any error

# Your job here
/path/to/your-script.sh

# Ping only reached if above succeeded
curl -fsS https://cronmonitor.app/ping/YOUR_TOKEN
```

## Examples

### 1. Simple Wrapper (`simple.sh`)

The most basic wrapper - exits on any error:

```bash
#!/bin/bash
set -e

PING_URL="https://cronmonitor.app/ping/YOUR_TOKEN"

# === YOUR JOB HERE ===
echo "Starting backup..."
/usr/local/bin/backup.sh
echo "Backup completed!"
# =====================

# Ping CronMonitor (only reached if job succeeded)
curl -fsS --retry 3 -m 10 "$PING_URL" > /dev/null 2>&1
```

### 2. With Error Handling (`with-error-handling.sh`)

Capture errors and handle them gracefully:

```bash
#!/bin/bash

PING_URL="https://cronmonitor.app/ping/YOUR_TOKEN"
LOG_FILE="/var/log/myjob.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Run job and capture exit code
log "Starting job..."
if /path/to/your-script.sh >> "$LOG_FILE" 2>&1; then
    log "Job completed successfully"
    
    # Ping CronMonitor
    if curl -fsS --retry 3 -m 10 "$PING_URL" > /dev/null 2>&1; then
        log "Ping sent to CronMonitor"
    else
        log "Warning: Failed to ping CronMonitor"
    fi
    
    exit 0
else
    EXIT_CODE=$?
    log "Job FAILED with exit code: $EXIT_CODE"
    # No ping = CronMonitor will alert you
    exit $EXIT_CODE
fi
```

### 3. With Timeout (`with-timeout.sh`)

Kill job if it runs too long:

```bash
#!/bin/bash
set -e

PING_URL="https://cronmonitor.app/ping/YOUR_TOKEN"
TIMEOUT_SECONDS=3600  # 1 hour

echo "Starting job with ${TIMEOUT_SECONDS}s timeout..."

# Run with timeout
timeout "$TIMEOUT_SECONDS" /path/to/long-running-job.sh

echo "Job completed within timeout"

# Ping CronMonitor
curl -fsS --retry 3 -m 10 "$PING_URL" > /dev/null 2>&1
```

### 4. With Lock File (`with-lock.sh`)

Prevent multiple instances running simultaneously:

```bash
#!/bin/bash
set -e

PING_URL="https://cronmonitor.app/ping/YOUR_TOKEN"
LOCK_FILE="/tmp/myjob.lock"

# Check for existing lock
if [ -f "$LOCK_FILE" ]; then
    PID=$(cat "$LOCK_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        echo "Job already running (PID: $PID), exiting"
        exit 0  # Exit cleanly - this is not a failure
    else
        echo "Removing stale lock file"
        rm -f "$LOCK_FILE"
    fi
fi

# Create lock file
echo $$ > "$LOCK_FILE"
trap "rm -f $LOCK_FILE" EXIT

# === YOUR JOB HERE ===
/path/to/your-script.sh
# =====================

# Ping CronMonitor
curl -fsS --retry 3 -m 10 "$PING_URL" > /dev/null 2>&1
```

### 5. Complete Production Script (`production.sh`)

Full-featured wrapper for production use:

```bash
#!/bin/bash

# =============================================================================
# CronMonitor Integration - Production Wrapper
# =============================================================================

set -o pipefail  # Catch errors in pipes

# Configuration
PING_URL="https://cronmonitor.app/ping/YOUR_TOKEN"
JOB_NAME="my-backup-job"
LOG_DIR="/var/log/cronjobs"
LOCK_FILE="/tmp/${JOB_NAME}.lock"
TIMEOUT_SECONDS=3600
MAX_LOG_SIZE_MB=100

# Setup logging
mkdir -p "$LOG_DIR"
LOG_FILE="${LOG_DIR}/${JOB_NAME}.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [$JOB_NAME] $1" | tee -a "$LOG_FILE"
}

# Rotate log if too large
if [ -f "$LOG_FILE" ]; then
    LOG_SIZE=$(du -m "$LOG_FILE" | cut -f1)
    if [ "$LOG_SIZE" -gt "$MAX_LOG_SIZE_MB" ]; then
        mv "$LOG_FILE" "${LOG_FILE}.old"
        log "Log rotated (was ${LOG_SIZE}MB)"
    fi
fi

# Lock handling
acquire_lock() {
    if [ -f "$LOCK_FILE" ]; then
        PID=$(cat "$LOCK_FILE")
        if ps -p "$PID" > /dev/null 2>&1; then
            log "ERROR: Job already running (PID: $PID)"
            exit 0
        fi
        rm -f "$LOCK_FILE"
    fi
    echo $$ > "$LOCK_FILE"
    trap cleanup EXIT
}

cleanup() {
    rm -f "$LOCK_FILE"
}

ping_cronmonitor() {
    if curl -fsS --retry 3 -m 10 "$PING_URL" > /dev/null 2>&1; then
        log "Ping sent to CronMonitor"
    else
        log "WARNING: Failed to ping CronMonitor (job still succeeded)"
    fi
}

# =============================================================================
# MAIN
# =============================================================================

log "========== Job starting =========="

acquire_lock

# Run job with timeout
log "Executing job (timeout: ${TIMEOUT_SECONDS}s)..."

if timeout "$TIMEOUT_SECONDS" /path/to/your-script.sh >> "$LOG_FILE" 2>&1; then
    log "Job completed successfully"
    ping_cronmonitor
    log "========== Job finished ==========\n"
    exit 0
else
    EXIT_CODE=$?
    if [ "$EXIT_CODE" -eq 124 ]; then
        log "ERROR: Job TIMEOUT after ${TIMEOUT_SECONDS}s"
    else
        log "ERROR: Job FAILED with exit code: $EXIT_CODE"
    fi
    log "========== Job failed ==========\n"
    # No ping = CronMonitor will alert
    exit $EXIT_CODE
fi
```

## Usage in Crontab

```bash
# Make script executable
chmod +x /path/to/wrapper.sh

# Add to crontab
0 2 * * * /path/to/wrapper.sh
```

## Key Concepts

### Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Success |
| `1-125` | Various errors |
| `124` | Timeout (from `timeout` command) |
| `126` | Command cannot execute |
| `127` | Command not found |

### `set` Options

| Option | Effect |
|--------|--------|
| `set -e` | Exit on any error |
| `set -u` | Error on undefined variables |
| `set -o pipefail` | Catch errors in pipes |

Combine them: `set -euo pipefail`
