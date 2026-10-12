# Mayden Ecommerce

A full-stack starter storefront inspired by the provided Mayden reference image. It includes a React + TypeScript + Vite frontend, an Express + TypeScript backend, Prisma schema for PostgreSQL, JWT auth scaffolding, product/category APIs, and a persistent cart API.

## Requirements
- Node.js 20+
- PostgreSQL 15+ (or compatible)
- npm

## Quick start

### 1. Configure the database
Create a PostgreSQL database and user, or use an existing local PostgreSQL account.

```sql
CREATE ROLE ecommerce_app WITH LOGIN PASSWORD 'replace-with-a-strong-password';
CREATE DATABASE ecommerce_db OWNER ecommerce_app;
GRANT ALL PRIVILEGES ON DATABASE ecommerce_db TO ecommerce_app;
```

### 2. Configure backend
```powershell
cd backend
Copy-Item .env.example .env
```
Edit `backend/.env` and set `DATABASE_URL` to your local database credentials. Generate strong secrets for `JWT_SECRET` and `JWT_REFRESH_SECRET`.

### 3. Install and migrate
```powershell
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run seed
npm run dev
```
Backend runs at `http://localhost:5000`.

### 4. Start frontend
In another terminal:
```powershell
cd frontend
Copy-Item .env.example .env
npm install
npm run dev
```
Frontend runs at `http://localhost:5173`.

## Demo content
The seed script creates category and product examples with Kenyan shilling prices. It uses remote Unsplash image URLs as initial visual assets. Replace them with licensed/local product images before production.

## Important production notes
This is a runnable starter, not a production-certified commerce platform. Configure a real payment provider before accepting payments. The checkout endpoint creates an order but deliberately does not charge a payment method. Review security, email verification, password reset, shipping, tax, privacy, and deployment configuration before public launch.
