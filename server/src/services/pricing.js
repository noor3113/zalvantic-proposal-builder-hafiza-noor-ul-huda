const RUSH_MULTIPLIER = 1.25;
const MAX_DISCOUNT_PERCENT = 20;
const DEFAULT_RATES = { USD: 1, EUR: 0.92, PKR: 280 };

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function isMoney(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function calculateQuote({
  items,
  rush = false,
  discountPercent = 0,
  currency = 'USD',
  rates = DEFAULT_RATES,
} = {}) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('At least one item is required');
  }
  if (typeof rush !== 'boolean') {
    throw new Error('rush must be true or false');
  }
  if (
    typeof discountPercent !== 'number' ||
    !Number.isFinite(discountPercent) ||
    discountPercent < 0
  ) {
    throw new Error('discountPercent must be a number that is 0 or more');
  }
  const rate = rates[currency];
  if (typeof rate !== 'number' || !(rate > 0)) {
    throw new Error(`No exchange rate for ${currency}`);
  }

  let subtotal = 0;
  for (const item of items) {
    if (!item || !isMoney(item.basePrice)) {
      throw new Error('Package price must be a number that is 0 or more');
    }
    subtotal += item.basePrice;
    for (const price of item.addOns || []) {
      if (!isMoney(price)) {
        throw new Error('Add-on price must be a number that is 0 or more');
      }
      subtotal += price;
    }
  }

  const rushFee = rush ? subtotal * (RUSH_MULTIPLIER - 1) : 0;
  const afterRush = subtotal + rushFee;

  const discountPercentApplied = Math.min(discountPercent, MAX_DISCOUNT_PERCENT);
  const discountAmount = (afterRush * discountPercentApplied) / 100;

  const totalUSD = round2(afterRush - discountAmount);
  const total = round2(totalUSD * rate);

  return {
    subtotal: round2(subtotal),
    rushFee: round2(rushFee),
    discountPercentApplied,
    discountCapped: discountPercent > MAX_DISCOUNT_PERCENT,
    discountAmount: round2(discountAmount),
    totalUSD,
    currency,
    rate,
    total,
  };
}

module.exports = {
  calculateQuote,
  round2,
  RUSH_MULTIPLIER,
  MAX_DISCOUNT_PERCENT,
  DEFAULT_RATES,
};