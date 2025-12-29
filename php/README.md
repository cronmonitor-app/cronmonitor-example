# PHP Examples

Integrate CronMonitor with your PHP applications and CLI scripts.

## Quick Start

```php
<?php
// Ping only after successful execution
try {
    performYourJob();
    
    // Success - ping CronMonitor
    file_get_contents('https://cronmonitor.app/ping/YOUR_TOKEN');
} catch (Exception $e) {
    // Failure - no ping sent, CronMonitor will alert
    error_log($e->getMessage());
    exit(1);
}
```

## Examples

### 1. Simple Script (`simple.php`)

Basic integration for CLI scripts:

```php
<?php
declare(strict_types=1);

$pingUrl = 'https://cronmonitor.app/ping/YOUR_TOKEN';

try {
    // === YOUR JOB HERE ===
    echo "Starting job...\n";
    
    // Your code here
    // e.g., processData(), runBackup(), sendEmails()
    
    echo "Job completed!\n";
    // =====================
    
    // Ping CronMonitor on success
    $result = @file_get_contents($pingUrl);
    if ($result === false) {
        echo "Warning: Failed to ping CronMonitor\n";
    } else {
        echo "Ping sent to CronMonitor\n";
    }
    
    exit(0);
} catch (Throwable $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    // No ping = CronMonitor will alert
    exit(1);
}
```

### 2. With cURL (`with-curl.php`)

More robust with proper timeout and retry:

```php
<?php
declare(strict_types=1);

class CronMonitor
{
    private string $pingUrl;
    private int $timeout;
    private int $retries;
    
    public function __construct(
        string $token,
        int $timeout = 10,
        int $retries = 3
    ) {
        $this->pingUrl = "https://cronmonitor.app/ping/{$token}";
        $this->timeout = $timeout;
        $this->retries = $retries;
    }
    
    public function ping(): bool
    {
        $attempt = 0;
        
        while ($attempt < $this->retries) {
            $attempt++;
            
            $ch = curl_init($this->pingUrl);
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => $this->timeout,
                CURLOPT_CONNECTTIMEOUT => 5,
                CURLOPT_FOLLOWLOCATION => true,
            ]);
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $error = curl_error($ch);
            curl_close($ch);
            
            if ($httpCode === 200) {
                return true;
            }
            
            // Wait before retry
            if ($attempt < $this->retries) {
                sleep(1);
            }
        }
        
        return false;
    }
}

// Usage
$monitor = new CronMonitor('YOUR_TOKEN');

try {
    // === YOUR JOB HERE ===
    performBackup();
    // =====================
    
    // Ping on success
    if ($monitor->ping()) {
        echo "Ping sent\n";
    } else {
        echo "Warning: Ping failed\n";
    }
    
    exit(0);
} catch (Throwable $e) {
    error_log("Job failed: " . $e->getMessage());
    exit(1);
}
```

### 3. Symfony Command (`SymfonyCommand.php`)

For Symfony applications:

```php
<?php
declare(strict_types=1);

namespace App\Command;

use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;

#[AsCommand(
    name: 'app:my-cron-job',
    description: 'My scheduled job with CronMonitor integration',
)]
class MyCronJobCommand extends Command
{
    private const CRONMONITOR_TOKEN = 'YOUR_TOKEN';
    
    public function __construct(
        private readonly HttpClientInterface $httpClient,
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        try {
            $output->writeln('Starting job...');
            
            // === YOUR JOB HERE ===
            $this->performJob();
            // =====================
            
            $output->writeln('Job completed successfully');
            
            // Ping CronMonitor
            $this->pingCronMonitor($output);
            
            return Command::SUCCESS;
            
        } catch (\Throwable $e) {
            $output->writeln('<error>Job failed: ' . $e->getMessage() . '</error>');
            // No ping = CronMonitor will alert
            return Command::FAILURE;
        }
    }
    
    private function performJob(): void
    {
        // Your job logic here
    }
    
    private function pingCronMonitor(OutputInterface $output): void
    {
        try {
            $response = $this->httpClient->request(
                'GET',
                'https://cronmonitor.app/ping/' . self::CRONMONITOR_TOKEN,
                ['timeout' => 10]
            );
            
            if ($response->getStatusCode() === 200) {
                $output->writeln('Ping sent to CronMonitor');
            }
        } catch (\Throwable $e) {
            $output->writeln('<comment>Warning: Failed to ping CronMonitor</comment>');
        }
    }
}
```

### 4. Laravel Command (`LaravelCommand.php`)

For Laravel applications:

```php
<?php
declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

class MyCronJob extends Command
{
    protected $signature = 'app:my-cron-job';
    protected $description = 'My scheduled job with CronMonitor integration';
    
    private const CRONMONITOR_TOKEN = 'YOUR_TOKEN';

    public function handle(): int
    {
        try {
            $this->info('Starting job...');
            
            // === YOUR JOB HERE ===
            $this->performJob();
            // =====================
            
            $this->info('Job completed successfully');
            
            // Ping CronMonitor
            $this->pingCronMonitor();
            
            return self::SUCCESS;
            
        } catch (\Throwable $e) {
            $this->error('Job failed: ' . $e->getMessage());
            // No ping = CronMonitor will alert
            return self::FAILURE;
        }
    }
    
    private function performJob(): void
    {
        // Your job logic here
    }
    
    private function pingCronMonitor(): void
    {
        try {
            $response = Http::timeout(10)
                ->retry(3, 1000)
                ->get('https://cronmonitor.app/ping/' . self::CRONMONITOR_TOKEN);
            
            if ($response->successful()) {
                $this->info('Ping sent to CronMonitor');
            }
        } catch (\Throwable $e) {
            $this->warn('Warning: Failed to ping CronMonitor');
        }
    }
}
```

### 5. Standalone Class (`CronMonitorClient.php`)

Reusable client class:

```php
<?php
declare(strict_types=1);

class CronMonitorClient
{
    private string $baseUrl = 'https://cronmonitor.app';
    private string $token;
    private int $timeout;
    private int $retries;
    
    public function __construct(
        string $token,
        int $timeout = 10,
        int $retries = 3
    ) {
        $this->token = $token;
        $this->timeout = $timeout;
        $this->retries = $retries;
    }
    
    /**
     * Send success ping
     */
    public function ping(): bool
    {
        return $this->sendRequest("/ping/{$this->token}");
    }
    
    /**
     * Wrap a callable and ping on success
     * 
     * @throws \Throwable Re-throws any exception from the job
     */
    public function wrap(callable $job): mixed
    {
        $result = $job();
        $this->ping();
        return $result;
    }
    
    private function sendRequest(string $endpoint): bool
    {
        $url = $this->baseUrl . $endpoint;
        $attempt = 0;
        
        while ($attempt < $this->retries) {
            $attempt++;
            
            $ch = curl_init($url);
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => $this->timeout,
                CURLOPT_CONNECTTIMEOUT => 5,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_HTTPHEADER => [
                    'User-Agent: CronMonitor-PHP/1.0',
                ],
            ]);
            
            curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            
            if ($httpCode === 200) {
                return true;
            }
            
            if ($attempt < $this->retries) {
                usleep(500000); // 0.5s
            }
        }
        
        return false;
    }
}

// =============================================================================
// Usage Examples
// =============================================================================

// Example 1: Manual ping
$monitor = new CronMonitorClient('YOUR_TOKEN');

try {
    doSomething();
    $monitor->ping();
} catch (Throwable $e) {
    exit(1);
}

// Example 2: Wrap a function
$monitor->wrap(function() {
    return performBackup();
});

// Example 3: Wrap with return value
$result = $monitor->wrap(fn() => processData());
```

## Usage in Crontab

```bash
# Run PHP script
* * * * * php /path/to/simple.php >> /var/log/myjob.log 2>&1

# Or with full path to PHP
* * * * * /usr/bin/php /path/to/simple.php >> /var/log/myjob.log 2>&1
```

## Error Handling Best Practices

1. **Always use try-catch** - wrap your entire job in try-catch
2. **Exit with proper code** - use `exit(1)` on failure, `exit(0)` on success
3. **Log errors** - use `error_log()` for debugging
4. **Don't catch ping errors as job failures** - ping failure shouldn't affect job status
