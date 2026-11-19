const { calculateQuote } = require('../src/services/pricing');

const rates = { USD: 1, EUR: 0.9, PKR: 280 };
const one = (basePrice, addOns = []) => [{ basePrice, addOns }];

describe('calculateQuote: results', () => {
  test.each([
    ['one package, no add-ons', { items: one(500) }, { subtotal: 500, rushFee: 0, discountAmount: 0, totalUSD: 500, total: 500 }],
    ['package with one add-on', { items: one(500, [150]) }, { subtotal: 650, total: 650 }],
    ['package with two add-ons', { items: one(1200, [150, 80]) }, { subtotal: 1430, total: 1430 }],
    ['two packages', { items: [{ basePrice: 500, addOns: [150] }, { basePrice: 400, addOns: [] }] }, { subtotal: 1050, total: 1050 }],
    ['add-on that costs 0', { items: one(500, [0]) }, { subtotal: 500, total: 500 }],
    ['rush adds 25%', { items: one(1000), rush: true }, { subtotal: 1000, rushFee: 250, totalUSD: 1250, total: 1250 }],
    ['rush also applies to add-ons', { items: one(800, [200]), rush: true }, { subtotal: 1000, rushFee: 250, total: 1250 }],
    ['discount 10%', { items: one(1000), discountPercent: 10 }, { discountPercentApplied: 10, discountAmount: 100, totalUSD: 900, total: 900, discountCapped: false }],
    ['discount 0', { items: one(1000), discountPercent: 0 }, { discountAmount: 0, total: 1000 }],
    ['rush first, then discount', { items: one(1000), rush: true, discountPercent: 10 }, { rushFee: 250, discountAmount: 125, totalUSD: 1125, total: 1125 }],
    ['discount exactly at the cap', { items: one(1000), discountPercent: 20 }, { discountPercentApplied: 20, discountAmount: 200, total: 800, discountCapped: false }],
    ['discount above the cap is capped', { items: one(1000), discountPercent: 50 }, { discountPercentApplied: 20, discountAmount: 200, total: 800, discountCapped: true }],
    ['convert to EUR', { items: one(1000), currency: 'EUR' }, { currency: 'EUR', rate: 0.9, totalUSD: 1000, total: 900 }],
    ['convert to PKR', { items: one(1000), currency: 'PKR' }, { total: 280000 }],
    ['rush, discount and EUR together', { items: one(1000), rush: true, discountPercent: 10, currency: 'EUR' }, { totalUSD: 1125, total: 1012.5 }],
    ['rounding after conversion', { items: one(333.33), currency: 'EUR' }, { totalUSD: 333.33, total: 300 }],
    ['rounding with rush', { items: one(99.99), rush: true }, { subtotal: 99.99, rushFee: 25, totalUSD: 124.99, total: 124.99 }],
  ])('%s', (name, input, expected) => {
    expect(calculateQuote({ rates, ...input })).toMatchObject(expected);
  });
});

describe('calculateQuote: bad input is rejected', () => {
  test.each([
    ['no items', { items: [] }],
    ['items missing', {}],
    ['negative package price', { items: one(-1) }],
    ['negative add-on price', { items: one(100, [-5]) }],
    ['price is text', { items: one('500') }],
    ['price is NaN', { items: one(NaN) }],
    ['negative discount', { items: one(100), discountPercent: -5 }],
    ['discount is text', { items: one(100), discountPercent: '10' }],
    ['unknown currency', { items: one(100), currency: 'GBP' }],
    ['rush is not true or false', { items: one(100), rush: 'yes' }],
  ])('%s', (name, input) => {
    expect(() => calculateQuote({ rates, ...input })).toThrow();
  });
});
