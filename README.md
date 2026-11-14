# zalvantic-proposal-builder-hafiza-noor-ul-huda

## Run locally

Requirements: Node.js and a MongoDB Atlas database.

### 1. Server

```
cd server
npm install
```

Copy `.env.example` to `.env` and fill in the values, then:

```
node src/scripts/createAdmin.js
node src/scripts/seed.js
node index.js
```

### 2. Client

```
cd client
npm install
npm run dev
```

Open http://localhost:5173 and log in with the admin account.

## Week 2: Quote form

Admin can start a quote, fill it in 3 steps (client details, packages and add-ons, options), review it and submit it. Every step is validated with Zod on the client and again on the server. A quote is saved as a draft after each step, so it can be resumed later from the quotes list.

Server routes (admin only): `POST /api/quotes`, `GET /api/quotes`, `GET /api/quotes/:id`, `PUT /api/quotes/:id/steps/:n`, `POST /api/quotes/:id/submit`.
Note: this project uses JavaScript (not TypeScript). The price calculation is added in Week 3.