# FinTrack
Personal finance tracking for your spending across categories like food, shopping, and entertainment. 

# Prereqs

- [Node.js] (v18+)
- [PostgresSQL] (v14+)

## Database Setup

1. Start PostgreSQL:
```bash
   brew services start postgresql@14
```

2. Create the database:
```bash
   psql postgres
```
```sql
   CREATE DATABASE fintrack;
   \q
```

3. Run migrations to create all tables automatically:
```bash
   cd server
   npm run migrate
```

## Environment Variables

Create a `.env` file inside the `server/` folder:

## Running Fintrack

**Terminal 1 — Backend:**
```bash
cd server
npm install
node index.js
```
Runs on `http://localhost:5000`

**Terminal 2 — Frontend:**
```bash
cd client
npm install
npm run dev
```
Runs on `http://localhost:5173`
