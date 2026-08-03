const { calculateXIRR } = require("../utils/xirr");

function flattenSchemes(data) {
  const rows = [];
  for (const holding of data.holdings || []) {
    for (const scheme of holding.schemes || []) {
      rows.push({
        folioNumber: holding.folio_number,
        amc: holding.amc,
        registrar: holding.registrar,
        ...scheme,
      });
    }
  }
  return rows;
}

function schemeXIRR(scheme) {
  const cashflows = [];
  for (const txn of scheme.transactions || []) {
    if (!txn.date) continue;
    const date = new Date(txn.date);
    if (txn.type === "PURCHASE" || txn.type === "PURCHASE_SIP") {
      cashflows.push({ date, amount: -Math.abs(txn.amount || 0) });
    } else if (txn.type === "REDEMPTION") {
      cashflows.push({ date, amount: Math.abs(txn.amount || 0) });
    }
  }
  if (scheme.value && scheme.value > 0) {
    cashflows.push({ date: new Date(), amount: scheme.value });
  }
  if (cashflows.length < 2) return null;
  return calculateXIRR(cashflows);
}

function portfolioXIRR(data) {
  const cashflows = [];
  for (const holding of data.holdings || []) {
    for (const scheme of holding.schemes || []) {
      for (const txn of scheme.transactions || []) {
        if (!txn.date) continue;
        const date = new Date(txn.date);
        if (txn.type === "PURCHASE" || txn.type === "PURCHASE_SIP") {
          cashflows.push({ date, amount: -Math.abs(txn.amount || 0) });
        } else if (txn.type === "REDEMPTION") {
          cashflows.push({ date, amount: Math.abs(txn.amount || 0) });
        }
      }
    }
  }
  const totalValue = data.total_value || 0;
  if (totalValue > 0) {
    cashflows.push({ date: new Date(), amount: totalValue });
  }
  if (cashflows.length < 2) return null;
  return calculateXIRR(cashflows);
}

function round(n, d = 2) {
  if (n === null || n === undefined || isNaN(n)) return 0;
  const f = Math.pow(10, d);
  return Math.round(n * f) / f;
}

function buildAnalytics(data) {
  const schemes = flattenSchemes(data);

  const totalInvested = schemes.reduce((s, sc) => s + (sc.cost || 0), 0);
  const currentValue = schemes.reduce((s, sc) => s + (sc.value || 0), 0);
  const absoluteGain = currentValue - totalInvested;
  const gainPercent = totalInvested > 0 ? (absoluteGain / totalInvested) * 100 : 0;
  const xirr = portfolioXIRR(data);

  // asset allocation by scheme type
  const allocationMap = {};
  for (const sc of schemes) {
    const type = sc.type || "OTHER";
    allocationMap[type] = (allocationMap[type] || 0) + (sc.value || 0);
  }
  const assetAllocation = Object.entries(allocationMap)
    .filter(([, value]) => value > 0)
    .map(([type, value]) => ({
      type,
      value: round(value),
      percent: currentValue > 0 ? round((value / currentValue) * 100) : 0,
    }))
    .sort((a, b) => b.value - a.value);

  // AMC allocation
  const amcMap = {};
  for (const sc of schemes) {
    const amc = sc.amc || "Unknown";
    amcMap[amc] = (amcMap[amc] || 0) + (sc.value || 0);
  }
  const amcAllocation = Object.entries(amcMap)
    .filter(([, value]) => value > 0)
    .map(([amc, value]) => ({
      amc,
      value: round(value),
      percent: currentValue > 0 ? round((value / currentValue) * 100) : 0,
    }))
    .sort((a, b) => b.value - a.value);

  // folio-level summary
  const folioMap = {};
  for (const holding of data.holdings || []) {
    const key = holding.folio_number + "|" + holding.amc;
    if (!folioMap[key]) {
      folioMap[key] = {
        folioNumber: holding.folio_number,
        amc: holding.amc,
        registrar: holding.registrar,
        value: 0,
        cost: 0,
        schemeCount: 0,
      };
    }
    for (const sc of holding.schemes || []) {
      folioMap[key].value += sc.value || 0;
      folioMap[key].cost += sc.cost || 0;
      folioMap[key].schemeCount += 1;
    }
  }
  const folioSummary = Object.values(folioMap)
    .map((f) => ({
      ...f,
      value: round(f.value),
      cost: round(f.cost),
      gain: round(f.value - f.cost),
      gainPercent: f.cost > 0 ? round(((f.value - f.cost) / f.cost) * 100) : 0,
    }))
    .sort((a, b) => b.value - a.value);

  // scheme-level performance table
  const schemePerformance = schemes
    .map((sc) => ({
      name: sc.name,
      isin: sc.isin,
      type: sc.type,
      amc: sc.amc,
      folioNumber: sc.folioNumber,
      units: round(sc.units, 3),
      nav: sc.nav,
      value: round(sc.value),
      cost: round(sc.cost),
      gainAbsolute: round(sc.gain_absolute ?? sc.value - sc.cost),
      gainPercent: round(sc.gain_percentage ?? (sc.cost > 0 ? ((sc.value - sc.cost) / sc.cost) * 100 : 0)),
      xirr: schemeXIRR(sc) !== null ? round(schemeXIRR(sc)) : null,
    }))
    .sort((a, b) => b.value - a.value);

  // flattened transaction history
  const transactions = [];
  for (const holding of data.holdings || []) {
    for (const scheme of holding.schemes || []) {
      for (const txn of scheme.transactions || []) {
        transactions.push({
          date: txn.date,
          type: txn.type,
          amount: txn.amount,
          units: txn.units,
          nav: txn.nav,
          schemeName: scheme.name,
          folioNumber: holding.folio_number,
          amc: holding.amc,
          description: txn.description,
        });
      }
    }
  }
  transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

  return {
    summary: {
      investorName: data.investor_name,
      pan: data.pan,
      casType: data.cas_type,
      statementPeriodFrom: data.statement_period_from,
      statementPeriodTo: data.statement_period_to,
      totalFolios: data.total_folios,
      totalSchemes: data.total_schemes,
      totalInvested: round(totalInvested),
      currentValue: round(currentValue),
      absoluteGain: round(absoluteGain),
      gainPercent: round(gainPercent),
      xirr: xirr !== null ? round(xirr) : null,
    },
    assetAllocation,
    amcAllocation,
    folioSummary,
    schemePerformance,
    transactions,
  };
}

module.exports = { buildAnalytics };
