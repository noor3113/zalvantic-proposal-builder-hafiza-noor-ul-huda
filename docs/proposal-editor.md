# Proposal editor

## How a proposal is made

- A proposal is created from a submitted quote and a template.
- The sections of the template are copied into the proposal, so editing a proposal never changes the template.
- Fields: quoteId, title, sections (key, title, body), version and status.

## Validation (Zod, on the server)

- Title: 1 to 120 characters.
- Sections: at least 1 and at most 12.
- Each section needs a title (up to 100 characters), and its text can be up to 5000 characters.

## Editing

- Only a proposal with status draft can be edited. Any other status returns an error (409).
- The editor lets the admin edit the title and the text of each section, and add, remove and move sections.

## Live preview

- The preview shows the title and the sections as the client will see them.
- In the pricing section it shows the price table from `GET /api/quotes/:id/price`.

## Not done yet

- PDF export (Week 5), share link (Week 6) and versions (Week 7). The version stays 1 for now.