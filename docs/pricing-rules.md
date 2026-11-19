# Pricing rules

All pricing lives in one function, `calculateQuote`, in `server/src/services/pricing.js`. It is tested in `server/tests/pricing.test.js`. The React app never calculates prices, it only shows what the server returns.

## Order of the calculation

1. Subtotal: the base price of every chosen package plus the price of every chosen add-on.
2. Rush: if rush is on, add 25% of the subtotal.
3. Discount: take the discount percent from the amount after rush, but never more than 20% (the cap).
4. Currency: the total in USD is multiplied by a stored exchange rate.
5. Rounding: every money amount is rounded to 2 decimals.

## Stored exchange rates (sample data)

| Currency | Rate (1 USD =) |
|---|---|
| USD | 1 |
| EUR | 0.92 |
| PKR | 280 |

## Worked example

Package 500, add-on 150, rush on, EUR:

- Subtotal: 500 + 150 = 650
- Rush fee: 650 x 0.25 = 162.50, so 812.50 USD
- Discount: none
- Total in EUR: 812.50 x 0.92 = 747.50

## Bad input

The function throws an error for: no items, negative or non-number prices, a negative or non-number discount, an unknown currency, and a rush value that is not true or false.

## Notes

- All package prices are stored in USD.
- The quote form has no discount field yet, so the discount is 0 for quotes made in the app. The discount rule and its cap are covered by the tests.