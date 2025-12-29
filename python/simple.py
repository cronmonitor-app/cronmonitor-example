#!/usr/bin/env python3
"""
CronMonitor - Simple Python Integration

Usage: python simple.py

This script demonstrates basic CronMonitor integration.
Ping is only sent when the job completes successfully.
No external dependencies required - uses standard library only.
"""

import urllib.request
import urllib.error
import sys
from datetime import datetime

# =============================================================================
# CONFIGURATION
# =============================================================================

PING_URL = "https://cronmonitor.app/ping/YOUR_TOKEN"
TIMEOUT = 10  # seconds

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def log(message: str) -> None:
    """Print timestamped log message"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] {message}")


def ping_cronmonitor() -> bool:
    """
    Send success ping to CronMonitor.
    Returns True if successful, False otherwise.
    """
    try:
        log("Sending ping to CronMonitor...")
        urllib.request.urlopen(PING_URL, timeout=TIMEOUT)
        log("Ping sent successfully!")
        return True
    except urllib.error.URLError as e:
        log(f"Warning: Failed to ping CronMonitor: {e}")
        return False
    except Exception as e:
        log(f"Warning: Unexpected error pinging CronMonitor: {e}")
        return False


# =============================================================================
# YOUR JOB
# =============================================================================

def run_job() -> None:
    """
    Your actual job logic goes here.
    Raise an exception if something fails.
    """
    log("Starting job...")
    
    # Example: Database backup
    # import subprocess
    # subprocess.run(["mysqldump", "-u", "root", "mydb"], check=True)
    
    # Example: File processing
    # for file in Path("/incoming").glob("*.csv"):
    #     process_file(file)
    
    # Example: API call
    # response = urllib.request.urlopen("https://api.example.com/data")
    # data = response.read()
    
    # Simulated work (remove this in production)
    import time
    time.sleep(1)
    
    log("Job completed successfully!")


# =============================================================================
# MAIN
# =============================================================================

def main() -> int:
    """
    Main entry point.
    Returns 0 on success, 1 on failure.
    """
    try:
        # Run the job
        run_job()
        
        # Job succeeded - ping CronMonitor
        ping_cronmonitor()
        
        return 0
        
    except KeyboardInterrupt:
        log("Job interrupted by user")
        return 1
        
    except Exception as e:
        # Job failed - NO ping sent
        log(f"ERROR: Job failed - {e}")
        
        # Optionally print full traceback for debugging
        import traceback
        traceback.print_exc()
        
        # Exit with error code
        # CronMonitor will alert because no ping was sent
        return 1


if __name__ == "__main__":
    sys.exit(main())
