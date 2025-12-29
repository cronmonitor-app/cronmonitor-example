# Curl / Crontab Examples

The simplest way to integrate with CronMonitor - perfect for crontab one-liners.

## Basic Usage

### Ping After Successful Command

```bash
# The && ensures ping only fires if the command succeeds
0 2 * * * /path/to/backup.sh && curl -fsS https://cronmonitor.app/ping/YOUR_TOKEN > /dev/null 2>&1
```

### Curl Flags Explained

| Flag | Purpose |
|------|---------|
| `-f` | Fail silently on HTTP errors (don't output error page) |
| `-s` | Silent mode (no progress meter) |
| `-S` | Show errors even in silent mode |
| `--retry 3` | Retry up to 3 times on failure |
| `-m 10` | Timeout after 10 seconds |

**Recommended combination:** `-fsS --retry 3 -m 10`

## Examples

### Simple Backup Job

```bash
# Daily backup at 2 AM
0 2 * * * /usr/local/bin/backup.sh && curl -fsS https://cronmonitor.app/ping/YOUR_TOKEN > /dev/null 2>&1
```

### Database Dump

```bash
# MySQL dump every 6 hours
0 */6 * * * mysqldump -u root mydb > /backups/mydb.sql && curl -fsS https://cronmonitor.app/ping/YOUR_TOKEN > /dev/null 2>&1
```

### With Retry and Timeout

```bash
# More robust ping with retry
0 3 * * * /path/to/job.sh && curl -fsS --retry 3 -m 10 https://cronmonitor.app/ping/YOUR_TOKEN > /dev/null 2>&1
```

### Multiple Commands

```bash
# All commands must succeed for ping to fire
0 4 * * * (cd /app && ./cleanup.sh && ./optimize.sh) && curl -fsS https://cronmonitor.app/ping/YOUR_TOKEN > /dev/null 2>&1
```

### Log Output, Then Ping

```bash
# Capture output to log, then ping
0 5 * * * /path/to/job.sh >> /var/log/myjob.log 2>&1 && curl -fsS https://cronmonitor.app/ping/YOUR_TOKEN > /dev/null 2>&1
```

## Common Mistakes

### ❌ Wrong: Using Semicolon

```bash
# BAD: Ping fires even if backup fails!
0 2 * * * /path/to/backup.sh; curl -fsS https://cronmonitor.app/ping/YOUR_TOKEN
```

### ❌ Wrong: Ping Before Job

```bash
# BAD: Ping fires before job completes!
0 2 * * * curl -fsS https://cronmonitor.app/ping/YOUR_TOKEN && /path/to/backup.sh
```

### ✅ Correct: Using &&

```bash
# GOOD: Ping only fires if backup succeeds
0 2 * * * /path/to/backup.sh && curl -fsS https://cronmonitor.app/ping/YOUR_TOKEN
```

## Operators Cheat Sheet

| Operator | Meaning | Use Case |
|----------|---------|----------|
| `&&` | Run next only if previous **succeeded** | ✅ Use this for ping |
| `;` | Run next **always** | ❌ Don't use for ping |
| `\|\|` | Run next only if previous **failed** | Could use for fail notification |

## Testing

Test your ping URL manually:

```bash
# Should return: {"message":"OK"}
curl -v https://cronmonitor.app/ping/YOUR_TOKEN
```
