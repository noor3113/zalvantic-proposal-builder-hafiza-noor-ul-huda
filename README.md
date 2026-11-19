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

Note: this project uses JavaScript (not TypeScript). The price calculation was added in Week 3.

## Week 3: Pricing

All pricing lives in one function, `calculateQuote`, in `server/src/services/pricing.js`. It adds up packages and add-ons, adds a rush fee, applies a discount (capped at 20%) and converts the currency with a stored rate. The details and a worked example are in `docs/pricing-rules.md`.

Run the tests with `npm test` inside the `server` folder. There are 27 table-driven tests, including edge cases such as a discount above the cap, bad input and rounding.

The server prices a quote with `GET /api/quotes/:id/price`, and stores the total when the quote is submitted. The React app only shows the numbers it gets from the server.

## Learning log

- Week 1: I connected Express to MongoDB Atlas. The first connection failed because of a DNS problem, and it worked after I set Google DNS in the server code. I learned that passwords go in `.env` and never in the repo.
- Week 2: I learned to validate a form step with Zod on both the client and the server. Long PowerShell test commands got cut when pasted, so I used short commands with variables instead. Saving `currentStep` on the server is what makes resuming a draft work.
- Week 3: I learned to write business rules as one tested function and to use table-driven tests with Jest. Doing the calculation by hand first helped me check the expected numbers. I also learned to read the server terminal for the real error when the screen only says "Server error".