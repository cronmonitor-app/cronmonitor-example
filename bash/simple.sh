#!/bin/bash
# =============================================================================
# CronMonitor - Simple Bash Wrapper
# 
# Usage: ./simple.sh
# 
# This script wraps your cron job and only pings CronMonitor on success.
# =============================================================================

set -e  # Exit immediately if any command fails

PING_URL="https://cronmonitor.app/ping/YOUR_TOKEN"

# =============================================================================
# YOUR JOB HERE - Replace this section with your actual commands
# =============================================================================

echo "Starting job at $(date)"

# Example: Database backup
# mysqldump -u root mydatabase > /backups/mydatabase.sql

# Example: File sync
# rsync -av /source/ /destination/

# Example: Run another script
# /path/to/your-script.sh

echo "Job completed at $(date)"

# =============================================================================
# END OF YOUR JOB
# =============================================================================

# Ping CronMonitor (only reached if job succeeded)
curl -fsS --retry 3 -m 10 "$PING_URL" > /dev/null 2>&1

echo "Ping sent to CronMonitor"
