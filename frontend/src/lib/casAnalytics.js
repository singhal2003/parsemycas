/**
 * Normalizes the two shapes the real /cas/ai/parse API can return into a
 * common set of derived structures the analytics UI can render.
 *
 * Shape A — CAMS / KFintech (registrar-sourced, non-demat MF folios):
 *   { cas_type: "CAMS_KFINTECH", primary_pan, email, is_joint_holding,
 *     investor_info: {...}, folios: [{ amc, folio_number, registrar, value,
 *     linked_holders, schemes: [{ name, isin, units, nav, value, cost, gain,
 *     nominees, transactions }] }], lifecycle_events, statement_period,
 *     total_folios, total_schemes, total_transactions }
 *
 * Shape B — NSDL / CDSL (depository-sourced, demat holdings + any MF folios):
 *   { cas_type: "NSDL"|"CDSL", pan, investor_name, investor_email,
 *     statement_period_from, statement_period_to,
 *     holdings: [{ folio_number, amc, registrar, total_value, schemes: [...] }],
 *     accounts: [{ demat_type, dp_id, dp_name, bo_id, client_id, total_value,
 *     equities, corporate_bonds, government_securities, aifs, demat_mutual_funds }],
 *     total_accounts, total_folios, total_schemes, total_value }
 *
 * Both were reverse-engineered from the actual API implementation
 * (mf-engine-v2: cas.controller.ts#parseUnified / buildFormattedCasResponse /
 * transformToCAMSFormat) rather than guessed, so field names here should
 * match real responses exactly.
 */

export function isCamsKfintechShape(raw) {
  return Array.isArray(raw?.folios);
}

export function num(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * Sums a numeric field across items — but only if EVERY item has a known value.
 * If even one item's value is null (not extracted from the PDF), the true total is
 * unknowable, so this returns null rather than silently summing just the known ones
 * (which would produce a misleading number, e.g. showing "current value ₹0" when it
 * really means "value unknown for 38 of 39 schemes, 0 for the one fully-redeemed one").
 * This mirrors how the real parser itself computes folio.value (see mf-engine-v2's
 * transformToCAMSFormat: `schemeValues.every(v => v !== null) ? sum : null`).
 */
export function sumOrNull(items, getter) {
  if (!items || items.length === 0) return null;
  let sum = 0;
  for (const item of items) {
    const v = num(getter(item));
    if (v === null) return null;
    sum += v;
  }
  return sum;
}

export function formatCurrency(v) {
  if (v === null || v === undefined) return "—";
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
}

export function formatNumber(v, decimals = 3) {
  if (v === null || v === undefined) return "—";
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("en-IN", { maximumFractionDigits: decimals });
}

export function formatDate(v) {
  if (!v) return "—";
  return v;
}

/** Groups flattened schemes by AMC. A group's `value` is only set if every scheme in
 *  that group has a known value (same all-or-null reasoning as sumOrNull above) —
 *  otherwise the group falls back to `cost` (always known) via `hasValue: false`. */
function buildAmcBreakdown(flatSchemes) {
  const amcMap = new Map();
  for (const s of flatSchemes) {
    const key = s.amc || "Unknown AMC";
    const prev = amcMap.get(key) || { label: key, cost: 0, values: [], schemeCount: 0 };
    prev.cost += s.cost ?? 0;
    prev.values.push(s.value);
    prev.schemeCount += 1;
    amcMap.set(key, prev);
  }
  return Array.from(amcMap.values()).map(({ label, cost, values, schemeCount }) => {
    const hasValue = values.length > 0 && values.every((v) => v !== null);
    return {
      label,
      cost,
      value: hasValue ? values.reduce((a, b) => a + b, 0) : 0,
      hasValue,
      schemeCount,
    };
  });
}

// ─── CAMS / KFintech normalizer ─────────────────────────────────────────────

export function normalizeCamsKfintech(raw) {
  const folios = Array.isArray(raw.folios) ? raw.folios : [];

  const flatSchemes = [];
  const flatTransactions = [];

  for (const folio of folios) {
    const schemes = Array.isArray(folio.schemes) ? folio.schemes : [];
    for (const scheme of schemes) {
      flatSchemes.push({
        folioNumber: folio.folio_number || "",
        amc: folio.amc || "",
        registrar: folio.registrar || "",
        name: scheme.name || "Unnamed scheme",
        isin: scheme.isin || "",
        type: scheme.type || null,
        units: num(scheme.units),
        nav: num(scheme.nav),
        value: num(scheme.value),
        cost: num(scheme.cost),
        gainAbsolute: num(scheme.gain?.absolute),
        gainPercentage: num(scheme.gain?.percentage),
        rta: scheme.additional_info?.rta || scheme.additional_info?.rta_code || null,
        advisor: scheme.additional_info?.advisor || null,
        nominees: Array.isArray(scheme.nominees) ? scheme.nominees : [],
      });

      const txns = Array.isArray(scheme.transactions) ? scheme.transactions : [];
      for (const t of txns) {
        flatTransactions.push({
          date: t.date || null,
          schemeName: scheme.name || "",
          folioNumber: folio.folio_number || "",
          type: t.type || "",
          amount: num(t.amount),
          units: num(t.units),
          nav: num(t.nav),
          balance: num(t.balance),
          description: t.description || "",
        });
      }
    }
  }

  flatTransactions.sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  const totalCost = sumOrNull(flatSchemes, (s) => s.cost);
  const totalValue = sumOrNull(flatSchemes, (s) => s.value);
  const amcBreakdown = buildAmcBreakdown(flatSchemes);

  const investorInfo = raw.investor_info || {};

  return {
    kind: "CAMS_KFINTECH",
    investor: {
      name: investorInfo.name || null,
      pan: raw.primary_pan || investorInfo.pan || null,
      email: raw.email || investorInfo.email || null,
      mobile: investorInfo.mobile || null,
      address: investorInfo.address || null,
      pincode: investorInfo.pincode || null,
      isJointHolding: Boolean(raw.is_joint_holding),
    },
    period: {
      from: raw.statement_period?.from || null,
      to: raw.statement_period?.to || null,
    },
    folios,
    flatSchemes,
    flatTransactions,
    lifecycleEvents: Array.isArray(raw.lifecycle_events) ? raw.lifecycle_events : [],
    amcBreakdown,
    totals: {
      folios: raw.total_folios ?? folios.length,
      schemes: raw.total_schemes ?? flatSchemes.length,
      transactions: raw.total_transactions ?? flatTransactions.length,
      cost: totalCost,
      value: totalValue,
    },
  };
}

// ─── NSDL / CDSL normalizer ──────────────────────────────────────────────────

const DEMAT_BUCKETS = [
  { key: "equities", label: "Equities" },
  { key: "corporate_bonds", label: "Corporate Bonds" },
  { key: "government_securities", label: "Government Securities" },
  { key: "aifs", label: "AIFs" },
  { key: "demat_mutual_funds", label: "Demat Mutual Funds" },
];

export function normalizeNsdlCdsl(raw) {
  const holdings = Array.isArray(raw.holdings) ? raw.holdings : [];
  const accounts = Array.isArray(raw.accounts) ? raw.accounts : [];

  // MF folios (same shape family as CAMS folios, just nested under `holdings`)
  const flatSchemes = [];
  const flatTransactions = [];
  for (const folio of holdings) {
    const schemes = Array.isArray(folio.schemes) ? folio.schemes : [];
    for (const scheme of schemes) {
      flatSchemes.push({
        folioNumber: folio.folio_number || "",
        amc: folio.amc || "",
        registrar: folio.registrar || "",
        name: scheme.name || "Unnamed scheme",
        isin: scheme.isin || "",
        type: scheme.type || null,
        units: num(scheme.units),
        nav: num(scheme.nav),
        value: num(scheme.value),
        cost: num(scheme.cost),
        gainAbsolute: num(scheme.gain_absolute),
        gainPercentage: num(scheme.gain_percentage),
        nominees: Array.isArray(scheme.nominees) ? scheme.nominees : [],
      });
      const txns = Array.isArray(scheme.transactions) ? scheme.transactions : [];
      for (const t of txns) {
        flatTransactions.push({
          date: t.date || null,
          schemeName: scheme.name || "",
          folioNumber: folio.folio_number || "",
          type: t.type || "",
          amount: num(t.amount),
          units: num(t.units),
          nav: num(t.nav),
          balance: num(t.balance),
          description: t.description || "",
        });
      }
    }
  }
  flatTransactions.sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  // Demat holdings, flattened per asset bucket
  const flatDematHoldings = [];
  for (const account of accounts) {
    for (const bucket of DEMAT_BUCKETS) {
      const items = Array.isArray(account[bucket.key]) ? account[bucket.key] : [];
      for (const h of items) {
        flatDematHoldings.push({
          bucket: bucket.label,
          bucketKey: bucket.key,
          dematType: account.demat_type || "",
          dpName: account.dp_name || "",
          name: h.name || h.security_name || "Unnamed holding",
          isin: h.isin || "",
          quantity: num(h.quantity ?? h.units),
          value: num(h.market_value ?? h.value),
        });
      }
    }
  }

  const assetBreakdown = DEMAT_BUCKETS.map((bucket) => {
    const items = flatDematHoldings.filter((h) => h.bucketKey === bucket.key);
    return {
      label: bucket.label,
      value: sumOrNull(items, (h) => h.value) ?? 0,
      count: items.length,
    };
  }).filter((b) => b.count > 0);

  const amcBreakdown = buildAmcBreakdown(flatSchemes);

  const dematValue = sumOrNull(accounts, (a) => a.total_value);
  const mfValue = sumOrNull(holdings, (h) => h.total_value);

  return {
    kind: "NSDL_CDSL",
    investor: {
      name: raw.investor_name || null,
      pan: raw.pan || null,
      email: raw.investor_email || null,
      mobile: null,
      address: null,
      pincode: null,
      isJointHolding: false,
    },
    period: {
      from: raw.statement_period_from || null,
      to: raw.statement_period_to || null,
    },
    casType: raw.cas_type || null,
    holdings,
    accounts,
    flatSchemes,
    flatTransactions,
    flatDematHoldings,
    assetBreakdown,
    amcBreakdown,
    totals: {
      accounts: raw.total_accounts ?? accounts.length,
      folios: raw.total_folios ?? holdings.length,
      schemes: raw.total_schemes ?? flatSchemes.length,
      value: raw.total_value ?? (dematValue !== null || mfValue !== null ? (dematValue ?? 0) + (mfValue ?? 0) : null),
      dematValue,
      mfValue,
    },
  };
}

export function normalizeCasResponse(raw) {
  if (!raw) return null;
  return isCamsKfintechShape(raw) ? normalizeCamsKfintech(raw) : normalizeNsdlCdsl(raw);
}
