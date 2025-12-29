# Python Examples

Integrate CronMonitor with your Python applications and scripts.

## Quick Start

```python
import urllib.request

PING_URL = "https://cronmonitor.app/ping/YOUR_TOKEN"

try:
    # Your job here
    perform_backup()
    
    # Ping on success
    urllib.request.urlopen(PING_URL, timeout=10)
except Exception as e:
    # No ping = CronMonitor will alert
    print(f"Job failed: {e}")
    exit(1)
```

## Examples

### 1. Simple Script (`simple.py`)

Basic integration using standard library only:

```python
#!/usr/bin/env python3
"""
CronMonitor - Simple Python Integration

Usage: python simple.py
"""

import urllib.request
import urllib.error
import sys
from datetime import datetime

PING_URL = "https://cronmonitor.app/ping/YOUR_TOKEN"

def log(message: str) -> None:
    print(f"[{datetime.now():%Y-%m-%d %H:%M:%S}] {message}")

def ping_cronmonitor() -> bool:
    """Send ping to CronMonitor"""
    try:
        urllib.request.urlopen(PING_URL, timeout=10)
        return True
    except urllib.error.URLError as e:
        log(f"Warning: Failed to ping CronMonitor: {e}")
        return False

def main() -> int:
    try:
        log("Starting job...")
        
        # === YOUR JOB HERE ===
        # perform_backup()
        # process_data()
        # send_reports()
        # =====================
        
        log("Job completed successfully!")
        
        # Ping CronMonitor
        ping_cronmonitor()
        
        return 0
        
    except Exception as e:
        log(f"ERROR: {e}")
        # No ping = CronMonitor will alert
        return 1

if __name__ == "__main__":
    sys.exit(main())
```

### 2. With Requests Library (`with-requests.py`)

Using the popular `requests` library:

```python
#!/usr/bin/env python3
"""
CronMonitor - Python Integration with Requests

Requirements: pip install requests
Usage: python with-requests.py
"""

import requests
import sys
from datetime import datetime

PING_URL = "https://cronmonitor.app/ping/YOUR_TOKEN"

def log(message: str) -> None:
    print(f"[{datetime.now():%Y-%m-%d %H:%M:%S}] {message}")

def ping_cronmonitor(retries: int = 3) -> bool:
    """Send ping with retry logic"""
    for attempt in range(1, retries + 1):
        try:
            response = requests.get(PING_URL, timeout=10)
            if response.status_code == 200:
                log("Ping sent to CronMonitor")
                return True
        except requests.RequestException as e:
            log(f"Ping attempt {attempt}/{retries} failed: {e}")
    
    log("Warning: All ping attempts failed")
    return False

def main() -> int:
    try:
        log("Starting job...")
        
        # === YOUR JOB HERE ===
        # your_job_function()
        # =====================
        
        log("Job completed successfully!")
        ping_cronmonitor()
        return 0
        
    except Exception as e:
        log(f"ERROR: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
```

### 3. As a Decorator (`decorator.py`)

Elegant way to wrap any function:

```python
#!/usr/bin/env python3
"""
CronMonitor - Decorator Pattern

Usage:
    @cronmonitor("YOUR_TOKEN")
    def my_job():
        do_something()
"""

import urllib.request
import functools
from typing import Callable, Any

def cronmonitor(token: str, timeout: int = 10) -> Callable:
    """
    Decorator that pings CronMonitor after successful execution.
    
    Usage:
        @cronmonitor("YOUR_TOKEN")
        def my_scheduled_job():
            # your code here
            pass
    """
    ping_url = f"https://cronmonitor.app/ping/{token}"
    
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            # Run the actual function
            result = func(*args, **kwargs)
            
            # Ping on success
            try:
                urllib.request.urlopen(ping_url, timeout=timeout)
            except Exception as e:
                print(f"Warning: Failed to ping CronMonitor: {e}")
            
            return result
        
        return wrapper
    return decorator

# =============================================================================
# Example Usage
# =============================================================================

@cronmonitor("YOUR_TOKEN")
def backup_database():
    """This function will ping CronMonitor after successful completion"""
    print("Backing up database...")
    # Your backup logic here
    print("Backup completed!")

@cronmonitor("ANOTHER_TOKEN")
def send_daily_report():
    """Each job can have its own monitor token"""
    print("Generating report...")
    # Report logic here
    print("Report sent!")

if __name__ == "__main__":
    try:
        backup_database()
    except Exception as e:
        print(f"Job failed: {e}")
        exit(1)
```

### 4. Context Manager (`context_manager.py`)

Use with `with` statement:

```python
#!/usr/bin/env python3
"""
CronMonitor - Context Manager Pattern

Usage:
    with CronMonitor("YOUR_TOKEN"):
        do_something()
"""

import urllib.request
from typing import Optional

class CronMonitor:
    """
    Context manager that pings CronMonitor on successful exit.
    
    Usage:
        with CronMonitor("YOUR_TOKEN"):
            perform_backup()
    
    If an exception is raised, no ping is sent.
    """
    
    BASE_URL = "https://cronmonitor.app"
    
    def __init__(self, token: str, timeout: int = 10):
        self.ping_url = f"{self.BASE_URL}/ping/{token}"
        self.timeout = timeout
    
    def __enter__(self) -> "CronMonitor":
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb) -> bool:
        # Only ping if no exception occurred
        if exc_type is None:
            self._ping()
        
        # Don't suppress exceptions
        return False
    
    def _ping(self) -> bool:
        try:
            urllib.request.urlopen(self.ping_url, timeout=self.timeout)
            print("Ping sent to CronMonitor")
            return True
        except Exception as e:
            print(f"Warning: Failed to ping CronMonitor: {e}")
            return False

# =============================================================================
# Example Usage
# =============================================================================

if __name__ == "__main__":
    import sys
    
    try:
        with CronMonitor("YOUR_TOKEN"):
            print("Starting job...")
            
            # Your job code here
            # If this raises an exception, no ping is sent
            
            print("Job completed!")
        
        sys.exit(0)
        
    except Exception as e:
        print(f"ERROR: {e}")
        sys.exit(1)
```

### 5. Async Version (`async_example.py`)

For async Python applications:

```python
#!/usr/bin/env python3
"""
CronMonitor - Async Python Integration

Requirements: pip install aiohttp
Usage: python async_example.py
"""

import asyncio
import aiohttp
import sys
from datetime import datetime

PING_URL = "https://cronmonitor.app/ping/YOUR_TOKEN"

def log(message: str) -> None:
    print(f"[{datetime.now():%Y-%m-%d %H:%M:%S}] {message}")

async def ping_cronmonitor(retries: int = 3) -> bool:
    """Async ping with retry"""
    async with aiohttp.ClientSession() as session:
        for attempt in range(1, retries + 1):
            try:
                async with session.get(PING_URL, timeout=10) as response:
                    if response.status == 200:
                        log("Ping sent to CronMonitor")
                        return True
            except Exception as e:
                log(f"Ping attempt {attempt}/{retries} failed: {e}")
                if attempt < retries:
                    await asyncio.sleep(0.5 * attempt)
    
    log("Warning: All ping attempts failed")
    return False

async def main() -> int:
    try:
        log("Starting async job...")
        
        # === YOUR ASYNC JOB HERE ===
        # await some_async_task()
        await asyncio.sleep(1)  # Simulate work
        # ===========================
        
        log("Job completed successfully!")
        await ping_cronmonitor()
        return 0
        
    except Exception as e:
        log(f"ERROR: {e}")
        return 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
```

## Usage in Crontab

```bash
# Using system Python
0 2 * * * /usr/bin/python3 /path/to/script.py >> /var/log/myjob.log 2>&1

# Using virtual environment
0 2 * * * /path/to/venv/bin/python /path/to/script.py >> /var/log/myjob.log 2>&1
```

## Best Practices

1. **Always use try-except** - catch all exceptions at the top level
2. **Use proper exit codes** - `sys.exit(1)` on failure, `sys.exit(0)` on success
3. **Don't fail on ping errors** - ping failure shouldn't cause job to fail
4. **Use timeouts** - prevent hanging on network issues
