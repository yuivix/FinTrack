# FinTrack
Personal finance tracking for your spending across categories like food, shopping, and entertainment. 

# Prereqs

- [Node.js] (v18+)
- [PostgresSQL] (v14+)

## Database Setup

```bash
brew services start postgresql@14
psql postgres
```
```sql
CREATE DATABASE fintrack;
\q
```

Then create the tables:

```bash
cd server
npm run migrate
```

## Environment Variables

Create `server/.env`:

```
PORT=5000
DATABASE_URL=postgresql://localhost/fintrack
JWT_SECRET=your_secret_key_here
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_sandbox_secret
PLAID_ENV=sandbox
```

Plaid keys are free at [dashboard.plaid.com](https://dashboard.plaid.com/signup).

## Running Fintrack

**Terminal 1 — Backend:**
```bash
cd server
npm install
node index.js
```

**Terminal 2 — Frontend:**
```bash
cd client
npm install
npm run dev
```
Runs on `http://localhost:5173`

## Deployment (AWS)

1. **RDS:** create a PostgreSQL 14 instance with public access off. Allow port 5432 from the EC2 security group.
2. **EC2:** launch an Ubuntu instance. Allow SSH from your IP only and port 5000 for the API. Install Node, clone the repo, create `server/.env` with the RDS `DATABASE_URL`, and run `npm run migrate`.
3. **Process management:** `pm2 start index.js --name fintrack-server`, then `pm2 startup` and `pm2 save` so it restarts on reboot.
4. **Frontend:** set `VITE_API_URL` in `client/.env.production` to the EC2 address, run `npm run build`, and upload the contents of `client/dist` to an S3 bucket with static website hosting enabled.
