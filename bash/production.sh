#!/bin/bash
# =============================================================================
# CronMonitor - Production Wrapper Script
# 
# Full-featured cron job wrapper with:
# - Lock file (prevent duplicate runs)
# - Timeout protection
# - Log rotation
# - Proper error handling
# - Detailed logging
# 
# Usage: ./production.sh
# =============================================================================

set -o pipefail  # Catch errors in pipes

# =============================================================================
# CONFIGURATION - Edit these values
# =============================================================================

PING_URL="https://cronmonitor.app/ping/YOUR_TOKEN"
JOB_NAME="my-backup-job"
LOG_DIR="/var/log/cronjobs"
LOCK_FILE="/tmp/${JOB_NAME}.lock"
TIMEOUT_SECONDS=3600      # 1 hour max runtime
MAX_LOG_SIZE_MB=100       # Rotate log when exceeds this size

# =============================================================================
# FUNCTIONS
# =============================================================================

# Ensure log directory exists
mkdir -p "$LOG_DIR"
LOG_FILE="${LOG_DIR}/${JOB_NAME}.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [$JOB_NAME] $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [$JOB_NAME] ERROR: $1" | tee -a "$LOG_FILE" >&2
}

# Rotate log if too large
rotate_log() {
    if [ -f "$LOG_FILE" ]; then
        LOG_SIZE=$(du -m "$LOG_FILE" 2>/dev/null | cut -f1)
        if [ "${LOG_SIZE:-0}" -gt "$MAX_LOG_SIZE_MB" ]; then
            mv "$LOG_FILE" "${LOG_FILE}.$(date '+%Y%m%d_%H%M%S').old"
            log "Log rotated (was ${LOG_SIZE}MB)"
        fi
    fi
}

# Lock management
acquire_lock() {
    if [ -f "$LOCK_FILE" ]; then
        PID=$(cat "$LOCK_FILE" 2>/dev/null)
        if [ -n "$PID" ] && ps -p "$PID" > /dev/null 2>&1; then
            log_error "Job already running (PID: $PID)"
            log_error "If this is wrong, delete: $LOCK_FILE"
            exit 0  # Exit cleanly - not a failure
        fi
        log "Removing stale lock file"
        rm -f "$LOCK_FILE"
    fi
    echo $$ > "$LOCK_FILE"
    trap cleanup EXIT INT TERM
}

cleanup() {
    rm -f "$LOCK_FILE"
}

# Ping CronMonitor
ping_cronmonitor() {
    log "Sending ping to CronMonitor..."
    if curl -fsS --retry 3 -m 10 "$PING_URL" > /dev/null 2>&1; then
        log "Ping sent successfully"
        return 0
    else
        log "WARNING: Failed to ping CronMonitor (job still succeeded)"
        return 1
    fi
}

# =============================================================================
# YOUR JOB - Replace this function with your actual work
# =============================================================================

run_job() {
    # Example 1: Database backup
    # mysqldump -u root --all-databases | gzip > /backups/all-databases-$(date +%Y%m%d).sql.gz
    
    # Example 2: File sync
    # rsync -avz --delete /source/ /destination/
    
    # Example 3: Run another script
    # /path/to/your-script.sh
    
    # Example 4: Multiple commands
    # ./step1.sh
    # ./step2.sh
    # ./step3.sh
    
    # Placeholder - remove this and add your commands
    echo "Running job..."
    sleep 2
    echo "Job work completed"
}

# =============================================================================
# MAIN EXECUTION
# =============================================================================

# Setup
rotate_log
log "============================================================"
log "JOB STARTING"
log "============================================================"
log "Timeout: ${TIMEOUT_SECONDS}s"

# Acquire lock
acquire_lock
log "Lock acquired (PID: $$)"

# Run job with timeout
START_TIME=$(date +%s)
log "Executing job..."

if timeout "$TIMEOUT_SECONDS" bash -c "$(declare -f run_job); run_job" >> "$LOG_FILE" 2>&1; then
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    
    log "Job completed successfully in ${DURATION}s"
    ping_cronmonitor
    
    log "============================================================"
    log "JOB FINISHED SUCCESSFULLY"
    log "============================================================"
    echo "" >> "$LOG_FILE"
    
    exit 0
else
    EXIT_CODE=$?
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    
    if [ "$EXIT_CODE" -eq 124 ]; then
        log_error "Job TIMEOUT after ${TIMEOUT_SECONDS}s"
    else
        log_error "Job FAILED with exit code: $EXIT_CODE after ${DURATION}s"
    fi
    
    log "============================================================"
    log "JOB FAILED - NO PING SENT"
    log "============================================================"
    echo "" >> "$LOG_FILE"
    
    # No ping = CronMonitor will alert
    exit $EXIT_CODE
fi
