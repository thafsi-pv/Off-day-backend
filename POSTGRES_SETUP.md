# PostgreSQL Setup Guide

## Installation

### macOS
```bash
# Install PostgreSQL
brew install postgresql@14

# Start PostgreSQL service
brew services start postgresql@14

# Or run manually
pg_ctl -D /opt/homebrew/var/postgresql@14 start
```

### Linux (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Windows
Download and install from [postgresql.org](https://www.postgresql.org/download/windows/)

## Create Database

```bash
# Connect to PostgreSQL (default user is usually 'postgres')
psql postgres

# Or if you have a specific user:
psql -U postgres
```

In the PostgreSQL prompt:
```sql
-- Create database
CREATE DATABASE offday;

-- (Optional) Create a dedicated user
CREATE USER offday_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE offday TO offday_user;

-- Exit
\q
```

## Configure Connection String

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` and update the `DATABASE_URL`:
```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/offday?schema=public"
```

Replace:
- `postgres` with your PostgreSQL username
- `your_password` with your PostgreSQL password
- `localhost:5432` if your PostgreSQL is on a different host/port
- `offday` with your database name if different

## Run Migrations

After setting up your database and environment variables:

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate
```

The migration will create all necessary tables and seed initial data.

## Verify Setup

You can verify the connection by:

1. Opening Prisma Studio:
```bash
npm run prisma:studio
```

2. Or connecting directly:
```bash
psql -U postgres -d offday
```

## Troubleshooting

### Connection Refused
- Ensure PostgreSQL is running: `brew services list` (macOS) or `sudo systemctl status postgresql` (Linux)
- Check if PostgreSQL is listening on the correct port (default: 5432)

### Authentication Failed
- Verify username and password in `DATABASE_URL`
- Check PostgreSQL authentication settings in `pg_hba.conf`

### Database Does Not Exist
- Ensure you created the database: `CREATE DATABASE offday;`
- Verify database name in `DATABASE_URL` matches the created database

### Permission Denied
- Ensure the user has proper permissions on the database
- Check user privileges: `\du` in psql







