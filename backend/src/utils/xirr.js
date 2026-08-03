/**
 * XIRR calculation using Newton-Raphson with a bisection fallback.
 * cashflows: [{ amount: number, date: Date }]
 * Convention: outflows (purchases/investments) are negative, inflows (redemptions/current value) are positive.
 */
function xnpv(rate, cashflows) {
  const t0 = cashflows[0].date;
  return cashflows.reduce((sum, cf) => {
    const days = (cf.date - t0) / (1000 * 60 * 60 * 24);
    return sum + cf.amount / Math.pow(1 + rate, days / 365);
  }, 0);
}

function xnpvDerivative(rate, cashflows) {
  const t0 = cashflows[0].date;
  return cashflows.reduce((sum, cf) => {
    const days = (cf.date - t0) / (1000 * 60 * 60 * 24);
    const power = days / 365;
    if (power === 0) return sum;
    return sum - (power * cf.amount) / Math.pow(1 + rate, power + 1);
  }, 0);
}

function calculateXIRR(cashflows) {
  if (!cashflows || cashflows.length < 2) return null;

  const sorted = [...cashflows].sort((a, b) => a.date - b.date);
  const hasPositive = sorted.some((c) => c.amount > 0);
  const hasNegative = sorted.some((c) => c.amount < 0);
  if (!hasPositive || !hasNegative) return null;

  let rate = 0.1;
  const maxIterations = 100;
  const tolerance = 1e-6;

  for (let i = 0; i < maxIterations; i++) {
    const npv = xnpv(rate, sorted);
    const deriv = xnpvDerivative(rate, sorted);
    if (Math.abs(deriv) < 1e-10) break;
    const newRate = rate - npv / deriv;
    if (Math.abs(newRate - rate) < tolerance) {
      rate = newRate;
      break;
    }
    rate = newRate;
    if (rate <= -0.999999) rate = -0.999999;
  }

  if (!isFinite(rate) || isNaN(rate)) return null;

  // sanity check via bisection if Newton diverged wildly
  if (Math.abs(xnpv(rate, sorted)) > 1) {
    let low = -0.9999,
      high = 10;
    let mid = rate;
    for (let i = 0; i < 200; i++) {
      mid = (low + high) / 2;
      const val = xnpv(mid, sorted);
      if (Math.abs(val) < 1e-4) break;
      if (val > 0) low = mid;
      else high = mid;
    }
    rate = mid;
  }

  return rate * 100; // percentage
}

module.exports = { calculateXIRR };
