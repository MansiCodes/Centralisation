# Database Backups

## Automated backups (GitHub Actions → S3)

The workflow `.github/workflows/db-backup.yml` runs automatically:

| Schedule | When (IST) |
|---|---|
| Every 2 days | 02:30 IST |
| Every Sunday | 03:00 IST |
| Manual | GitHub → Actions → "Database Backup" → Run workflow |

Backups are stored in S3:
```
s3://<BACKUP_S3_BUCKET>/postgres/YYYY-MM-DD_HH-MM.dump
```
The last **30 backups** are kept; older ones are pruned automatically.

---

## Required GitHub Secrets

Go to: **GitHub repo → Settings → Secrets and variables → Actions → New repository secret**

| Secret name | Value |
|---|---|
| `DATABASE_URL` | Full postgres:// connection string (same as your `.env`) |
| `BACKUP_S3_BUCKET` | S3 bucket name, e.g. `price-master-backups` |
| `BACKUP_AWS_REGION` | AWS region of the bucket, e.g. `ap-south-1` |
| `BACKUP_AWS_KEY` | AWS access key ID (IAM user with S3 permissions below) |
| `BACKUP_AWS_SECRET` | AWS secret access key for the above IAM user |

### Minimum IAM permissions for the backup user

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:ListBucket", "s3:DeleteObject"],
      "Resource": [
        "arn:aws:s3:::price-master-backups",
        "arn:aws:s3:::price-master-backups/*"
      ]
    }
  ]
}
```

---

## Restoring from a backup

### 1. Download the backup file from S3

```bash
aws s3 cp s3://<BACKUP_S3_BUCKET>/postgres/2026-10-27_21-00.dump ./restore.dump
```

### 2. Restore to your database

```bash
pg_restore \
  --no-owner \
  --no-acl \
  --clean \
  --if-exists \
  --dbname "$DATABASE_URL" \
  ./restore.dump
```

> **Warning:** `--clean` drops existing tables before restoring.
> Run this on a fresh/empty DB or when doing a full recovery.

### 3. If restoring to a fresh RDS instance

```bash
# Apply schema first (if pg_restore fails on empty DB)
npx prisma db push

# Then restore data only
pg_restore --data-only --no-owner --no-acl --dbname "$DATABASE_URL" ./restore.dump
```

---

## Manual one-off backup (local)

Run from the project root (requires `pg_dump` installed locally):

```bash
pg_dump "$DATABASE_URL" \
  --no-owner --no-acl \
  --format=custom --compress=9 \
  --file=backups/manual-$(date +%Y-%m-%d).dump
```

---

## Notes

- Backup files are in PostgreSQL custom format (`.dump`) — not plain SQL.
  Use `pg_restore` to apply them, not `psql`.
- `.dump` files are gitignored — never commit them to the repo.
- The backup IAM user should only have S3 access, nothing else.
