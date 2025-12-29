#!/usr/bin/env node
/**
 * CronMonitor Client for Node.js
 * 
 * A reusable client class for CronMonitor integration.
 * No external dependencies - uses built-in https module.
 * 
 * Usage:
 *   const { CronMonitor } = require('./cronmonitor');
 *   
 *   const monitor = new CronMonitor('YOUR_TOKEN');
 *   
 *   // Option 1: Manual ping
 *   try {
 *       await doWork();
 *       await monitor.ping();
 *   } catch (error) {
 *       process.exit(1);
 *   }
 *   
 *   // Option 2: Wrap your function
 *   await monitor.wrap(async () => {
 *       await doWork();
 *   });
 */

const https = require('https');

class CronMonitor {
    /**
     * Create a CronMonitor client
     * 
     * @param {string} token - Your CronMonitor ping token
     * @param {Object} options - Configuration options
     * @param {number} options.timeout - Request timeout in milliseconds (default: 10000)
     * @param {number} options.retries - Number of retry attempts (default: 3)
     * @param {boolean} options.verbose - Whether to log status messages (default: false)
     */
    constructor(token, options = {}) {
        this.token = token;
        this.timeout = options.timeout || 10000;
        this.retries = options.retries || 3;
        this.verbose = options.verbose || false;
        this.baseUrl = 'cronmonitor.app';
        this.pingPath = `/ping/${token}`;
    }
    
    /**
     * Log message if verbose mode is enabled
     * @private
     */
    _log(message) {
        if (this.verbose) {
            const timestamp = new Date().toISOString();
            console.log(`[${timestamp}] [CronMonitor] ${message}`);
        }
    }
    
    /**
     * Sleep for specified milliseconds
     * @private
     */
    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Send a single ping request
     * @private
     */
    _sendRequest() {
        return new Promise((resolve) => {
            const options = {
                hostname: this.baseUrl,
                port: 443,
                path: this.pingPath,
                method: 'GET',
                timeout: this.timeout,
                headers: {
                    'User-Agent': 'CronMonitor-Node/1.0'
                }
            };
            
            const req = https.request(options, (res) => {
                resolve({
                    success: res.statusCode === 200,
                    statusCode: res.statusCode
                });
            });
            
            req.on('error', (err) => {
                resolve({
                    success: false,
                    error: err.message
                });
            });
            
            req.on('timeout', () => {
                req.destroy();
                resolve({
                    success: false,
                    error: 'Request timeout'
                });
            });
            
            req.end();
        });
    }
    
    /**
     * Send success ping to CronMonitor
     * 
     * @returns {Promise<boolean>} True if ping was successful
     */
    async ping() {
        for (let attempt = 1; attempt <= this.retries; attempt++) {
            this._log(`Ping attempt ${attempt}/${this.retries}`);
            
            const result = await this._sendRequest();
            
            if (result.success) {
                this._log('Ping sent successfully');
                return true;
            }
            
            this._log(`Attempt ${attempt} failed: ${result.error || `HTTP ${result.statusCode}`}`);
            
            // Wait before retry (exponential backoff)
            if (attempt < this.retries) {
                const delay = 500 * attempt;
                this._log(`Waiting ${delay}ms before retry...`);
                await this._sleep(delay);
            }
        }
        
        this._log('All ping attempts failed');
        return false;
    }
    
    /**
     * Wrap an async function and ping on success
     * 
     * If the function throws an error, no ping is sent.
     * 
     * @param {Function} fn - Async function to wrap
     * @returns {Promise<any>} - Result of the wrapped function
     */
    async wrap(fn) {
        this._log('Starting wrapped function');
        
        const result = await fn();
        
        this._log('Function completed, sending ping...');
        await this.ping();
        
        return result;
    }
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Quick ping function for simple use cases
 * 
 * @param {string} token - Your CronMonitor token
 * @param {number} timeout - Request timeout in milliseconds
 * @returns {Promise<boolean>}
 */
async function ping(token, timeout = 10000) {
    const monitor = new CronMonitor(token, { timeout });
    return monitor.ping();
}

/**
 * Wrap a function with CronMonitor ping
 * 
 * @param {string} token - Your CronMonitor token
 * @param {Function} fn - Async function to wrap
 * @returns {Promise<any>}
 */
async function withCronMonitor(token, fn) {
    const monitor = new CronMonitor(token);
    return monitor.wrap(fn);
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
    CronMonitor,
    ping,
    withCronMonitor
};

// =============================================================================
// EXAMPLE USAGE (runs when executed directly)
// =============================================================================

if (require.main === module) {
    async function exampleJob() {
        console.log('Doing some work...');
        await new Promise(r => setTimeout(r, 1000));
        console.log('Work completed!');
        return { success: true };
    }
    
    async function main() {
        // Create client with verbose logging
        const monitor = new CronMonitor('YOUR_TOKEN', {
            timeout: 10000,
            retries: 3,
            verbose: true
        });
        
        console.log('\n=== Example 1: Manual ping ===');
        try {
            await exampleJob();
            await monitor.ping();
        } catch (error) {
            console.error('Job failed:', error.message);
        }
        
        console.log('\n=== Example 2: Wrap function ===');
        try {
            const result = await monitor.wrap(exampleJob);
            console.log('Result:', result);
        } catch (error) {
            console.error('Job failed:', error.message);
        }
        
        console.log('\n=== Examples completed ===');
    }
    
    main().catch(console.error);
}
