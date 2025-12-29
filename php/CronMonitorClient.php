<?php
/**
 * CronMonitor PHP Client
 * 
 * A reusable client class for CronMonitor integration.
 * 
 * Usage:
 *   $monitor = new CronMonitorClient('YOUR_TOKEN');
 *   
 *   // Option 1: Manual ping
 *   try {
 *       doWork();
 *       $monitor->ping();
 *   } catch (Exception $e) {
 *       exit(1);
 *   }
 *   
 *   // Option 2: Wrap your job
 *   $monitor->wrap(function() {
 *       return doWork();
 *   });
 */

declare(strict_types=1);

class CronMonitorClient
{
    private const BASE_URL = 'https://cronmonitor.app';
    
    private string $token;
    private int $timeout;
    private int $retries;
    private bool $verbose;
    
    /**
     * @param string $token   Your CronMonitor ping token
     * @param int    $timeout Request timeout in seconds
     * @param int    $retries Number of retry attempts
     * @param bool   $verbose Whether to output status messages
     */
    public function __construct(
        string $token,
        int $timeout = 10,
        int $retries = 3,
        bool $verbose = false
    ) {
        $this->token = $token;
        $this->timeout = $timeout;
        $this->retries = $retries;
        $this->verbose = $verbose;
    }
    
    /**
     * Send a success ping to CronMonitor
     * 
     * @return bool True if ping was successful
     */
    public function ping(): bool
    {
        return $this->sendRequest("/ping/{$this->token}");
    }
    
    /**
     * Wrap a callable and automatically ping on success
     * 
     * If the job throws an exception, no ping is sent and the exception is re-thrown.
     * 
     * @param callable $job The job to execute
     * @return mixed The return value of the job
     * @throws \Throwable Re-throws any exception from the job
     */
    public function wrap(callable $job): mixed
    {
        $this->log("Starting wrapped job...");
        
        $result = $job();
        
        $this->log("Job completed, sending ping...");
        
        if ($this->ping()) {
            $this->log("Ping sent successfully");
        } else {
            $this->log("Warning: Failed to send ping");
        }
        
        return $result;
    }
    
    /**
     * Send HTTP request to CronMonitor
     */
    private function sendRequest(string $endpoint): bool
    {
        $url = self::BASE_URL . $endpoint;
        
        // Use cURL if available (preferred)
        if (function_exists('curl_init')) {
            return $this->sendCurlRequest($url);
        }
        
        // Fallback to file_get_contents
        return $this->sendFileGetContentsRequest($url);
    }
    
    /**
     * Send request using cURL
     */
    private function sendCurlRequest(string $url): bool
    {
        $attempt = 0;
        
        while ($attempt < $this->retries) {
            $attempt++;
            $this->log("Ping attempt {$attempt}/{$this->retries}");
            
            $ch = curl_init($url);
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => $this->timeout,
                CURLOPT_CONNECTTIMEOUT => 5,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_MAXREDIRS => 3,
                CURLOPT_HTTPHEADER => [
                    'User-Agent: CronMonitor-PHP/1.0',
                ],
            ]);
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $error = curl_error($ch);
            curl_close($ch);
            
            if ($httpCode === 200) {
                return true;
            }
            
            $this->log("Attempt {$attempt} failed: HTTP {$httpCode}" . ($error ? " - {$error}" : ""));
            
            // Wait before retry (exponential backoff)
            if ($attempt < $this->retries) {
                usleep(500000 * $attempt); // 0.5s, 1s, 1.5s...
            }
        }
        
        $this->log("All ping attempts failed");
        return false;
    }
    
    /**
     * Send request using file_get_contents (fallback)
     */
    private function sendFileGetContentsRequest(string $url): bool
    {
        $context = stream_context_create([
            'http' => [
                'method' => 'GET',
                'timeout' => $this->timeout,
                'ignore_errors' => true,
                'header' => [
                    'User-Agent: CronMonitor-PHP/1.0',
                ],
            ],
        ]);
        
        $attempt = 0;
        
        while ($attempt < $this->retries) {
            $attempt++;
            
            $response = @file_get_contents($url, false, $context);
            
            // Check HTTP response code
            if (isset($http_response_header[0])) {
                if (strpos($http_response_header[0], '200') !== false) {
                    return true;
                }
            }
            
            if ($attempt < $this->retries) {
                usleep(500000 * $attempt);
            }
        }
        
        return false;
    }
    
    /**
     * Log message if verbose mode is enabled
     */
    private function log(string $message): void
    {
        if ($this->verbose) {
            echo "[CronMonitor] {$message}\n";
        }
    }
}

// =============================================================================
// EXAMPLE USAGE
// =============================================================================

if (basename(__FILE__) === basename($_SERVER['SCRIPT_NAME'] ?? '')) {
    // This code only runs when the file is executed directly
    
    $monitor = new CronMonitorClient(
        token: 'YOUR_TOKEN',
        timeout: 10,
        retries: 3,
        verbose: true
    );
    
    try {
        echo "Starting example job...\n";
        
        // Simulate some work
        sleep(1);
        
        // Optionally: simulate failure
        // throw new RuntimeException('Something went wrong!');
        
        echo "Job completed!\n";
        
        // Send ping
        $monitor->ping();
        
        exit(0);
    } catch (Throwable $e) {
        echo "ERROR: " . $e->getMessage() . "\n";
        exit(1);
    }
}
