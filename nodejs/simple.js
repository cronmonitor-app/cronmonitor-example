#!/usr/bin/env node
/**
 * CronMonitor - Simple Node.js Integration
 * 
 * Usage: node simple.js
 * 
 * No external dependencies - uses built-in https module.
 * Ping is only sent when the job completes successfully.
 */

const https = require('https');

// =============================================================================
// CONFIGURATION
// =============================================================================

const PING_URL = 'https://cronmonitor.app/ping/YOUR_TOKEN';
const TIMEOUT = 10000; // 10 seconds

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function log(message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
}

/**
 * Send ping to CronMonitor
 * @returns {Promise<boolean>} True if successful
 */
function pingCronMonitor() {
    return new Promise((resolve) => {
        log('Sending ping to CronMonitor...');
        
        const req = https.get(PING_URL, { timeout: TIMEOUT }, (res) => {
            if (res.statusCode === 200) {
                log('Ping sent successfully!');
                resolve(true);
            } else {
                log(`Warning: Ping returned status ${res.statusCode}`);
                resolve(false);
            }
        });
        
        req.on('error', (err) => {
            log(`Warning: Ping failed - ${err.message}`);
            resolve(false);
        });
        
        req.on('timeout', () => {
            req.destroy();
            log('Warning: Ping timeout');
            resolve(false);
        });
    });
}

// =============================================================================
// YOUR JOB
// =============================================================================

async function runJob() {
    log('Starting job...');
    
    // =========================================================================
    // YOUR JOB HERE - Replace this section with your actual code
    // =========================================================================
    
    // Example: Database backup
    // const { exec } = require('child_process');
    // await new Promise((resolve, reject) => {
    //     exec('mysqldump -u root mydb > backup.sql', (err) => {
    //         if (err) reject(err);
    //         else resolve();
    //     });
    // });
    
    // Example: API call
    // const response = await fetch('https://api.example.com/data');
    // if (!response.ok) throw new Error('API call failed');
    
    // Example: File processing
    // const fs = require('fs').promises;
    // const files = await fs.readdir('/incoming');
    // for (const file of files) {
    //     await processFile(file);
    // }
    
    // Simulated work (remove this in production)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // =========================================================================
    // END OF YOUR JOB
    // =========================================================================
    
    log('Job completed successfully!');
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
    try {
        // Run the job
        await runJob();
        
        // Job succeeded - ping CronMonitor
        await pingCronMonitor();
        
        process.exit(0);
        
    } catch (error) {
        // Job failed - NO ping sent
        log(`ERROR: ${error.message}`);
        
        // Print stack trace for debugging
        console.error(error.stack);
        
        // Exit with error code
        // CronMonitor will alert because no ping was sent
        process.exit(1);
    }
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
    log(`ERROR: Unhandled rejection - ${reason}`);
    process.exit(1);
});

// Run
main();
