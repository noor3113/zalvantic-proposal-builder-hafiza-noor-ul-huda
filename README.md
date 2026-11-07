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