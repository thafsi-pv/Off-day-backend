# OffDay Backend

NestJS backend for the OffDay roster management system.

## Prerequisites

- PostgreSQL (v12 or higher)
- Node.js (v18 or higher)

## Setup

1. Install PostgreSQL if you haven't already:
   - **macOS**: `brew install postgresql@14` then `brew services start postgresql@14`
   - **Linux**: `sudo apt-get install postgresql postgresql-contrib`
   - **Windows**: Download from [postgresql.org](https://www.postgresql.org/download/windows/)

2. Create a PostgreSQL database:
```bash
# Connect to PostgreSQL
psql postgres

# Create database
CREATE DATABASE offday;

# Exit psql
\q
```

3. Set up environment variables:
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and update the following:
# - DATABASE_URL: Your PostgreSQL connection string
#   Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
# - PORT: Backend server port (default: 3000)
# - CORS_ORIGIN: Frontend URLs allowed to access API (default: http://localhost:5173)
```

4. Install dependencies:
```bash
npm install
```

5. Generate Prisma client:
```bash
npm run prisma:generate
```

6. Run database migrations:
```bash
npm run prisma:migrate
```

## Development

Run the backend in development mode:
```bash
npm run start:dev
```

The backend will run on `http://localhost:3000` by default.

## API Endpoints

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/users` - Get all users (admin only)
- `PATCH /api/users/:id/status` - Update user status (admin only)
- `GET /api/config` - Get configuration
- `PUT /api/config` - Update configuration (admin only)
- `GET /api/leaves` - Get all leaves (admin only)
- `GET /api/leaves/user/:userId` - Get leaves for a specific user
- `POST /api/leaves` - Create a leave request
- `PATCH /api/leaves/:id/status` - Update leave status (admin only)
- `PATCH /api/leaves/status/bulk` - Bulk update leave statuses (admin only)
- `DELETE /api/leaves/:id` - Cancel a pending leave request
- `GET /api/leaves/slots/date/:date` - Get slot information for a date
- `GET /api/leaves/slots/range` - Get slot information for a date range

## Database

This project uses PostgreSQL with Prisma ORM.

**Connection String Format:**
```
postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
```

**Example for local development:**
```
postgresql://postgres:postgres@localhost:5432/offday?schema=public
```

**For production**, consider using connection pooling:
```
postgresql://user:password@host:5432/database?schema=public&connection_limit=5&pool_timeout=0
```

To open Prisma Studio:
```bash
npm run prisma:studio
```

To reset the database (WARNING: This will delete all data):
```bash
npm run prisma:migrate reset
```

## Default Users

After running migrations, the following test users are available:
- Email: `user@test.com`, Password: `password` (USER role)
- Email: `admin@test.com`, Password: `password` (ADMIN role)
- Email: `user2@test.com`, Password: `password` (USER role)

# Off-day-backend
