# Quote flow

A quote has a status: `draft` or `submitted`. It is saved as a draft after every step, so the admin can resume it later.

## Steps and validation rules

| Step | What is collected | Rules (Zod, client and server) |
|---|---|---|
| 1. Client details | name, email, company | name at least 2 characters, valid email, company optional |
| 2. Packages | packages and their add-ons | at least one package, add-ons optional |
| 3. Options | currency, rush, notes | currency is USD, EUR or PKR, notes up to 500 characters |
| 4. Review | nothing new | the admin checks everything and submits |

## How resuming works

- The quote stores `currentStep`. After step N is saved it becomes the larger of its old value and N + 1 (up to 4).
- The quotes list shows every quote. Clicking Resume opens the quote at its `currentStep` with the saved data.

## Submitting

- Submit checks steps 1 to 3 again on the server.
- A submitted quote is read only. Saving a step or submitting again returns an error (409).
- The total price is not calculated yet. That is added in Week 3.