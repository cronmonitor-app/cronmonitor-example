<?php
/**
 * CronMonitor - Simple PHP Integration
 * 
 * Usage: php simple.php
 * 
 * This script demonstrates basic CronMonitor integration.
 * Ping is only sent when the job completes successfully.
 */

declare(strict_types=1);

// Configuration
$pingUrl = 'https://cronmonitor.app/ping/YOUR_TOKEN';

try {
    echo "[" . date('Y-m-d H:i:s') . "] Starting job...\n";
    
    // =========================================================================
    // YOUR JOB HERE - Replace this section with your actual code
    // =========================================================================
    
    // Example: Database backup
    // $pdo = new PDO('mysql:host=localhost;dbname=mydb', 'user', 'pass');
    // $stmt = $pdo->query('SELECT * FROM important_table');
    // file_put_contents('/backups/data.json', json_encode($stmt->fetchAll()));
    
    // Example: File processing
    // $files = glob('/incoming/*.csv');
    // foreach ($files as $file) {
    //     processFile($file);
    // }
    
    // Example: API call
    // $response = file_get_contents('https://api.example.com/sync');
    // if ($response === false) {
    //     throw new RuntimeException('API call failed');
    // }
    
    // Simulated work (remove this)
    echo "Processing...\n";
    sleep(1);
    
    // =========================================================================
    // END OF YOUR JOB
    // =========================================================================
    
    echo "[" . date('Y-m-d H:i:s') . "] Job completed successfully!\n";
    
    // Ping CronMonitor (only reached if job succeeded)
    echo "Sending ping to CronMonitor...\n";
    
    $context = stream_context_create([
        'http' => [
            'timeout' => 10,
            'ignore_errors' => true,
        ]
    ]);
    
    $result = @file_get_contents($pingUrl, false, $context);
    
    if ($result !== false) {
        echo "Ping sent successfully!\n";
    } else {
        echo "Warning: Failed to send ping (job still succeeded)\n";
    }
    
    exit(0);
    
} catch (Throwable $e) {
    // Job failed - NO ping will be sent
    echo "[" . date('Y-m-d H:i:s') . "] ERROR: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . ":" . $e->getLine() . "\n";
    
    // Log to error log as well
    error_log("CronJob failed: " . $e->getMessage());
    
    // Exit with error code - CronMonitor will alert because no ping was sent
    exit(1);
}
