# Node.js Examples

Integrate CronMonitor with your Node.js applications and scripts.

## Quick Start

```javascript
const https = require('https');

const PING_URL = 'https://cronmonitor.app/ping/YOUR_TOKEN';

async function main() {
    try {
        // Your job here
        await performBackup();
        
        // Ping on success
        await ping(PING_URL);
    } catch (error) {
        // No ping = CronMonitor will alert
        console.error('Job failed:', error);
        process.exit(1);
    }
}

function ping(url) {
    return new Promise((resolve) => {
        https.get(url, (res) => resolve(res.statusCode === 200))
            .on('error', () => resolve(false));
    });
}

main();
```

## Examples

### 1. Simple Script (`simple.js`)

Basic integration using only built-in `https` module:

```javascript
#!/usr/bin/env node
/**
 * CronMonitor - Simple Node.js Integration
 * 
 * Usage: node simple.js
 * 
 * No dependencies required - uses built-in https module.
 */

const https = require('https');

const PING_URL = 'https://cronmonitor.app/ping/YOUR_TOKEN';

function log(message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
}

function ping() {
    return new Promise((resolve) => {
        const req = https.get(PING_URL, { timeout: 10000 }, (res) => {
            resolve(res.statusCode === 200);
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

async function runJob() {
    log('Starting job...');
    
    // === YOUR JOB HERE ===
    // await someAsyncWork();
    // processData();
    // =====================
    
    log('Job completed!');
}

async function main() {
    try {
        await runJob();
        
        // Ping CronMonitor on success
        log('Sending ping...');
        const success = await ping();
        if (success) {
            log('Ping sent successfully');
        }
        
        process.exit(0);
    } catch (error) {
        log(`ERROR: ${error.message}`);
        // No ping = CronMonitor will alert
        process.exit(1);
    }
}

main();
```

### 2. With Fetch API (`with-fetch.mjs`)

Modern approach using native fetch (Node.js 18+):

```javascript
#!/usr/bin/env node
/**
 * CronMonitor - Node.js with Fetch API
 * 
 * Requires Node.js 18+ for native fetch
 * Usage: node with-fetch.mjs
 */

const PING_URL = 'https://cronmonitor.app/ping/YOUR_TOKEN';

function log(message) {
    console.log(`[${new Date().toISOString()}] ${message}`);
}

async function ping(retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await fetch(PING_URL, {
                method: 'GET',
                signal: AbortSignal.timeout(10000)
            });
            
            if (response.ok) {
                log('Ping sent successfully');
                return true;
            }
        } catch (error) {
            log(`Ping attempt ${attempt}/${retries} failed: ${error.message}`);
            
            if (attempt < retries) {
                await new Promise(r => setTimeout(r, 500 * attempt));
            }
        }
    }
    
    log('Warning: All ping attempts failed');
    return false;
}

async function main() {
    try {
        log('Starting job...');
        
        // === YOUR JOB HERE ===
        // await yourAsyncJob();
        // =====================
        
        log('Job completed!');
        await ping();
        
        process.exit(0);
    } catch (error) {
        log(`ERROR: ${error.message}`);
        process.exit(1);
    }
}

main();
```

### 3. With Axios (`with-axios.js`)

Using popular axios library:

```javascript
#!/usr/bin/env node
/**
 * CronMonitor - Node.js with Axios
 * 
 * Requirements: npm install axios
 * Usage: node with-axios.js
 */

const axios = require('axios');

const PING_URL = 'https://cronmonitor.app/ping/YOUR_TOKEN';

function log(message) {
    console.log(`[${new Date().toISOString()}] ${message}`);
}

async function ping(retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await axios.get(PING_URL, { timeout: 10000 });
            
            if (response.status === 200) {
                log('Ping sent successfully');
                return true;
            }
        } catch (error) {
            log(`Ping attempt ${attempt}/${retries} failed: ${error.message}`);
            
            if (attempt < retries) {
                await new Promise(r => setTimeout(r, 500 * attempt));
            }
        }
    }
    
    return false;
}

async function main() {
    try {
        log('Starting job...');
        
        // Your job here
        
        log('Job completed!');
        await ping();
        
        process.exit(0);
    } catch (error) {
        log(`ERROR: ${error.message}`);
        process.exit(1);
    }
}

main();
```

### 4. Wrapper Function (`wrapper.js`)

Reusable wrapper for any async function:

```javascript
#!/usr/bin/env node
/**
 * CronMonitor - Wrapper Pattern
 * 
 * Usage:
 *   const result = await withCronMonitor('TOKEN', async () => {
 *       return await doWork();
 *   });
 */

const https = require('https');

/**
 * Wrap an async function with CronMonitor ping on success
 * 
 * @param {string} token - Your CronMonitor token
 * @param {Function} fn - Async function to wrap
 * @returns {Promise<any>} - Result of the wrapped function
 */
async function withCronMonitor(token, fn) {
    const result = await fn();
    await ping(token);
    return result;
}

function ping(token, retries = 3) {
    const url = `https://cronmonitor.app/ping/${token}`;
    
    return new Promise((resolve) => {
        let attempts = 0;
        
        const tryPing = () => {
            attempts++;
            
            const req = https.get(url, { timeout: 10000 }, (res) => {
                if (res.statusCode === 200) {
                    resolve(true);
                } else if (attempts < retries) {
                    setTimeout(tryPing, 500 * attempts);
                } else {
                    resolve(false);
                }
            });
            
            req.on('error', () => {
                if (attempts < retries) {
                    setTimeout(tryPing, 500 * attempts);
                } else {
                    resolve(false);
                }
            });
        };
        
        tryPing();
    });
}

// =============================================================================
// Example Usage
// =============================================================================

async function myJob() {
    console.log('Doing work...');
    await new Promise(r => setTimeout(r, 1000));
    console.log('Work done!');
    return { success: true };
}

async function main() {
    try {
        const result = await withCronMonitor('YOUR_TOKEN', myJob);
        console.log('Result:', result);
        process.exit(0);
    } catch (error) {
        console.error('Job failed:', error.message);
        process.exit(1);
    }
}

main();

module.exports = { withCronMonitor, ping };
```

### 5. ES Module Class (`CronMonitor.mjs`)

Full-featured client as ES module:

```javascript
/**
 * CronMonitor Client for Node.js
 * 
 * Usage:
 *   import { CronMonitor } from './CronMonitor.mjs';
 *   
 *   const monitor = new CronMonitor('YOUR_TOKEN');
 *   await monitor.wrap(async () => {
 *       await doWork();
 *   });
 */

export class CronMonitor {
    constructor(token, options = {}) {
        this.token = token;
        this.timeout = options.timeout || 10000;
        this.retries = options.retries || 3;
        this.verbose = options.verbose || false;
        this.pingUrl = `https://cronmonitor.app/ping/${token}`;
    }
    
    log(message) {
        if (this.verbose) {
            console.log(`[CronMonitor] ${message}`);
        }
    }
    
    async ping() {
        for (let attempt = 1; attempt <= this.retries; attempt++) {
            try {
                this.log(`Ping attempt ${attempt}/${this.retries}`);
                
                const response = await fetch(this.pingUrl, {
                    method: 'GET',
                    signal: AbortSignal.timeout(this.timeout),
                    headers: {
                        'User-Agent': 'CronMonitor-Node/1.0'
                    }
                });
                
                if (response.ok) {
                    this.log('Ping successful');
                    return true;
                }
            } catch (error) {
                this.log(`Attempt ${attempt} failed: ${error.message}`);
                
                if (attempt < this.retries) {
                    await new Promise(r => setTimeout(r, 500 * attempt));
                }
            }
        }
        
        this.log('All ping attempts failed');
        return false;
    }
    
    async wrap(fn) {
        this.log('Starting wrapped function');
        const result = await fn();
        this.log('Function completed, sending ping');
        await this.ping();
        return result;
    }
}

export default CronMonitor;
```

## Usage in Crontab

```bash
# Using node directly
0 2 * * * /usr/bin/node /path/to/script.js >> /var/log/myjob.log 2>&1

# Using npm script
0 2 * * * cd /path/to/project && npm run cron-job >> /var/log/myjob.log 2>&1
```

## Best Practices

1. **Always use try-catch** - wrap your entire job in try-catch
2. **Use proper exit codes** - `process.exit(1)` on failure, `process.exit(0)` on success
3. **Don't fail on ping errors** - ping failure shouldn't cause job to fail
4. **Use async/await** - cleaner error handling than callbacks
5. **Set timeouts** - prevent hanging on network issues
