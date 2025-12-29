#!/bin/bash
# =============================================================================
# CronMonitor - Bash Wrapper with Error Handling
# 
# Usage: ./with-error-handling.sh
# 
# Features:
# - Proper error handling
# - Logging to file
# - Exit code capture
# =============================================================================

PING_URL="https://cronmonitor.app/ping/YOUR_TOKEN"
LOG_FILE="/var/log/myjob.log"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "=========================================="
log "Job starting"
log "=========================================="

# =============================================================================
# YOUR JOB HERE
# =============================================================================

run_job() {
    # Replace this with your actual job
    echo "Executing main task..."
    
    # Example commands:
    # mysqldump -u root mydatabase > /backups/mydatabase.sql
    # rsync -av /source/ /destination/
    # /path/to/your-script.sh
    
    # Simulate work (remove this)
    sleep 1
    
    echo "Main task completed"
}

# =============================================================================
# EXECUTION
# =============================================================================

# Run job and capture result
if run_job >> "$LOG_FILE" 2>&1; then
    log "Job completed successfully"
    
    # Ping CronMonitor
    if curl -fsS --retry 3 -m 10 "$PING_URL" > /dev/null 2>&1; then
        log "Ping sent to CronMonitor"
    else
        log "WARNING: Failed to ping CronMonitor (job still succeeded)"
    fi
    
    log "=========================================="
    log "Job finished"
    log "==========================================\n"
    exit 0
else
    EXIT_CODE=$?
    log "ERROR: Job FAILED with exit code: $EXIT_CODE"
    log "=========================================="
    log "Job failed - NO PING SENT"
    log "==========================================\n"
    
    # No ping = CronMonitor will alert you
    exit $EXIT_CODE
fi
