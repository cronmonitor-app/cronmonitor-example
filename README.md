# CronMonitor Integration Examples

Official integration examples for [CronMonitor.app](https://cronmonitor.app) – simple cron job monitoring.

## ⚠️ Important: Ping Only On Success!

Basic rule: A monitoring ping should only be sent after the job completes successfully.

If a script is run via CRON but any errors occur, the script will not execute correctly, and a ping is sent, CronMonitor will not know that the job was not completed correctly!

```bash
# ✅ CORRECT - ping only when backup succeeds
/path/to/backup.sh && curl -fsS https://cronmonitor.app/ping/YOUR_TOKEN

# ❌ WRONG - ping fires even if backup fails!
/path/to/backup.sh; curl -fsS https://cronmonitor.app/ping/YOUR_TOKEN
```

## Quick Start 

Choose your language/method:


| Method               | Best For                          | Example                       |
| -------------------- | --------------------------------- | ----------------------------- |
| [Curl](./curl/)      | Simple crontab one-liners         | `&& curl -fsS .../ping/TOKEN` |
| [Bash](./bash/)      | Shell scripts with error handling | Wrapper scripts               |
| [PHP](./php/)        | PHP applications & scripts        | Laravel, Symfony, CLI         |
| [Python](./python/)  | Python scripts & apps             | Django, FastAPI, CLI          |
| [Node.js](./nodejs/) | Node applications                 | Express, CLI scripts          |

## How It Works

1. Create a monitor at [cronmonitor.app](https://cronmonitor.app)
2. Copy your unique ping URL
3. Add the ping to your script/cron job
4. You'll receive a notyfication when the job fails

## Ping URL Format

```
https://cronmonitor.app/ping/YOUR_UNIQUE_TOKEN
```

Accepted request method is `GET`

## Examples Overview

### Simplest (Crontab + Curl)

```bash
# Ping after successful backup
0 2 * * * /usr/local/bin/backup.sh && curl -fsS https://cronmonitor.app/ping/YOUR_TOKEN > /dev/null 2>&1
```

### With Error Handling (Bash)

```bash
#!/bin/bash
set -e

# Your job here
/path/to/your-script.sh

# Only reached if above succeeded
curl -fsS https://cronmonitor.app/ping/YOUR_TOKEN
```

### In Application Code (PHP)

```php
try {
    $result = performBackup();
  
    // Ping only on success
    file_get_contents('https://cronmonitor.app/ping/YOUR_TOKEN');
} catch (Exception $e) {
    // No ping sent = CronMonitor will alert you
    error_log($e->getMessage());
    exit(1);
}
```

## Support

- 📖 [Documentation](https://cronmonitor.app/docs)
- 💬 [Reddit Community](https://reddit.com/r/cronmonitor)
- 🐛 [Report Issues](https://github.com/cronmonitor-app/cronmonitor-examples/issues)

## License

MIT License - see [LICENSE](LICENSE) for details.
