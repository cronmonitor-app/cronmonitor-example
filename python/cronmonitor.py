#!/usr/bin/env python3
"""
CronMonitor Python Client

A reusable client class for CronMonitor integration.
No external dependencies - uses standard library only.

Usage:
    from cronmonitor import CronMonitor
    
    monitor = CronMonitor("YOUR_TOKEN")
    
    # Option 1: Manual ping
    try:
        do_work()
        monitor.ping()
    except Exception:
        exit(1)
    
    # Option 2: Decorator
    @monitor.wrap
    def my_job():
        do_work()
    
    # Option 3: Context manager
    with monitor:
        do_work()
"""

import urllib.request
import urllib.error
import functools
import time
from typing import Callable, Any, Optional
from datetime import datetime


class CronMonitor:
    """
    CronMonitor client for Python.
    
    Supports three integration patterns:
    1. Manual: call monitor.ping() after successful job
    2. Decorator: @monitor.wrap decorates your function
    3. Context manager: use with 'with' statement
    """
    
    BASE_URL = "https://cronmonitor.app"
    
    def __init__(
        self,
        token: str,
        timeout: int = 10,
        retries: int = 3,
        verbose: bool = False
    ):
        """
        Initialize CronMonitor client.
        
        Args:
            token: Your CronMonitor ping token
            timeout: Request timeout in seconds
            retries: Number of retry attempts
            verbose: Whether to print status messages
        """
        self.token = token
        self.timeout = timeout
        self.retries = retries
        self.verbose = verbose
        self._ping_url = f"{self.BASE_URL}/ping/{token}"
    
    def _log(self, message: str) -> None:
        """Print message if verbose mode is enabled"""
        if self.verbose:
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            print(f"[{timestamp}] [CronMonitor] {message}")
    
    def ping(self) -> bool:
        """
        Send success ping to CronMonitor.
        
        Returns:
            True if ping was successful, False otherwise
        """
        for attempt in range(1, self.retries + 1):
            try:
                self._log(f"Ping attempt {attempt}/{self.retries}")
                
                request = urllib.request.Request(
                    self._ping_url,
                    headers={"User-Agent": "CronMonitor-Python/1.0"}
                )
                
                response = urllib.request.urlopen(request, timeout=self.timeout)
                
                if response.status == 200:
                    self._log("Ping sent successfully")
                    return True
                    
            except urllib.error.URLError as e:
                self._log(f"Attempt {attempt} failed: {e}")
            except Exception as e:
                self._log(f"Attempt {attempt} failed: {e}")
            
            # Wait before retry (exponential backoff)
            if attempt < self.retries:
                sleep_time = 0.5 * attempt
                self._log(f"Waiting {sleep_time}s before retry...")
                time.sleep(sleep_time)
        
        self._log("All ping attempts failed")
        return False
    
    def wrap(self, func: Callable) -> Callable:
        """
        Decorator that pings CronMonitor after successful execution.
        
        Usage:
            @monitor.wrap
            def my_job():
                do_something()
        """
        @functools.wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            self._log(f"Starting wrapped function: {func.__name__}")
            
            # Run the actual function
            result = func(*args, **kwargs)
            
            # Ping on success
            self._log(f"Function {func.__name__} completed, sending ping...")
            self.ping()
            
            return result
        
        return wrapper
    
    def __enter__(self) -> "CronMonitor":
        """Context manager entry"""
        self._log("Entering CronMonitor context")
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb) -> bool:
        """
        Context manager exit.
        Pings CronMonitor only if no exception occurred.
        """
        if exc_type is None:
            self._log("Context completed successfully, sending ping...")
            self.ping()
        else:
            self._log(f"Context exited with exception: {exc_type.__name__}")
        
        # Don't suppress exceptions
        return False


# =============================================================================
# CONVENIENCE FUNCTIONS
# =============================================================================

def ping(token: str, timeout: int = 10) -> bool:
    """
    Quick ping function for simple use cases.
    
    Usage:
        from cronmonitor import ping
        
        try:
            do_work()
            ping("YOUR_TOKEN")
        except Exception:
            exit(1)
    """
    return CronMonitor(token, timeout=timeout).ping()


def cronmonitor(token: str, timeout: int = 10) -> Callable:
    """
    Decorator factory for quick decoration.
    
    Usage:
        from cronmonitor import cronmonitor
        
        @cronmonitor("YOUR_TOKEN")
        def my_job():
            do_something()
    """
    monitor = CronMonitor(token, timeout=timeout)
    return monitor.wrap


# =============================================================================
# EXAMPLE USAGE
# =============================================================================

if __name__ == "__main__":
    import sys
    
    # Create monitor instance
    monitor = CronMonitor(
        token="YOUR_TOKEN",
        timeout=10,
        retries=3,
        verbose=True
    )
    
    # Example 1: Manual ping
    print("\n=== Example 1: Manual ping ===")
    try:
        print("Doing some work...")
        time.sleep(0.5)
        print("Work completed!")
        monitor.ping()
    except Exception as e:
        print(f"Failed: {e}")
    
    # Example 2: Decorator
    print("\n=== Example 2: Decorator ===")
    
    @monitor.wrap
    def my_decorated_job():
        print("Running decorated job...")
        time.sleep(0.5)
        print("Decorated job done!")
        return "result"
    
    result = my_decorated_job()
    print(f"Got result: {result}")
    
    # Example 3: Context manager
    print("\n=== Example 3: Context manager ===")
    
    with monitor:
        print("Running in context...")
        time.sleep(0.5)
        print("Context work done!")
    
    print("\n=== All examples completed ===")
