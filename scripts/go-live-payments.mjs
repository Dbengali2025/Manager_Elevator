#!/usr/bin/env node
/**
 * Manager Elevator — Stripe live-mode go-live automation.
 *
 * Does everything after Stripe live-mode activation, in one run:
 *   1. Verifies the Stripe account can take charges
 *   2. Creates (or reuses) the Membership product + $97/mo and $997/yr prices
 *   3. Creates the webhook endpoint for app.managerelevator.com and captures
 *      its signing secret (only available at creation time)
 *   4. Creates a Customer Portal configuration (cancel at period end enabled)
 *   5. Updates the 4 Stripe env vars on the production Vercel project
 *   6. Triggers a production redeploy so the new vars take effect
 *
 * Usage:
 *   STRIPE_KEY=sk_live_... VERCEL_TOKEN=... node scripts/go-live-payments.mjs
 *
 * Flags:
 *   --dry-run       Read-only: show what would happen, change nothing
 *   --skip-vercel   Do the Stripe work only (prints the values to set by hand)
 *   --allow-test    Permit a sk_test_ key (for rehearsing the script itself)
 */

const APP_URL = process.env.APP_URL_OVERRIDE ?? "https://app.managerelevator.com";
const WEBHOOK_URL = `${APP_URL}/api/stripe/webhook`;
const WEBHOOK_EVENTS = [
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "invoice.paid",
  "invoice.payment_failed",
];
const PRODUCT_NAME = "Manager Elevator Membership";
const PRICES = [
  { lookupKey: "me_monthly", envVar: "STRIPE_PRICE_MONTHLY", amount: 9700, interval: "month", nickname: "Monthly $97" },
  { lookupKey: "me_annual", envVar: "STRIPE_PRICE_ANNUAL", amount: 99700, interval: "year", nickname: "Annual $997" },
];

// Production Vercel project serving app.managerelevator.com
const VERCEL_TEAM_ID = "team_eUGTajpGAfXxeG5iZzASNf1p"; // dbengali2025s-projects
const VERCEL_PROJECT_ID = "prj_w0X5eNYKzLNVAaPP3zs0lZW17jMU"; // manager-elevator

const DRY_RUN = process.argv.includes("--dry-run");
const SKIP_VERCEL = process.argv.includes("--skip-vercel");
const ALLOW_TEST = process.argv.includes("--allow-test");

const STRIPE_KEY = process.env.STRIPE_KEY ?? "";
const VERCEL_TOKEN = process.env.VERCEL_TOKEN ?? "";

function fail(msg) {
  console.error(`\n✗ ${msg}`);
  process.exit(1);
}

function mask(v) {
  return v.length > 12 ? `${v.slice(0, 10)}…${v.slice(-4)}` : "…";
}

// --- Stripe helper (form-encoded, no SDK needed) ---------------------------

async function stripe(method, path, params) {
  const body = params ? encodeForm(params) : undefined;
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${STRIPE_KEY}`,
      ...(body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    body,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Stripe ${method} ${path} → ${res.status}: ${json.error?.message ?? JSON.stringify(json)}`);
  return json;
}

function encodeForm(obj, prefix = "") {
  const parts = [];
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}[${k}]` : k;
    if (Array.isArray(v)) v.forEach((item, i) => parts.push(encodeForm({ [i]: item }, key)));
    else if (typeof v === "object" && v !== null) parts.push(encodeForm(v, key));
    else parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(v)}`);
  }
  return parts.filter(Boolean).join("&");
}

// --- Vercel helper ----------------------------------------------------------

async function vercel(method, path, body) {
  const sep = path.includes("?") ? "&" : "?";
  const res = await fetch(`https://api.vercel.com${path}${sep}teamId=${VERCEL_TEAM_ID}`, {
    method,
    headers: {
      Authorization: `Bearer ${VERCEL_TOKEN}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Vercel ${method} ${path} → ${res.status}: ${json.error?.message ?? JSON.stringify(json)}`);
  return json;
}

// --- Steps -------------------------------------------------------------------

async function checkAccount() {
  if (!STRIPE_KEY) fail("Set STRIPE_KEY (the live secret key, sk_live_...).");
  const isLive = /^(sk|rk)_live_/.test(STRIPE_KEY);
  if (!isLive && !ALLOW_TEST) fail("STRIPE_KEY is not a live key. Pass --allow-test only for rehearsals.");
  const acct = await stripe("GET", "/account");
  console.log(`✓ Stripe account: ${acct.settings?.dashboard?.display_name ?? acct.id} (${isLive ? "LIVE" : "test"} mode)`);
  if (isLive && !acct.charges_enabled) {
    fail("This account cannot take charges yet — finish live-mode activation in the Stripe Dashboard first.");
  }
  return isLive;
}

async function ensurePrices() {
  const existing = await stripe("GET", `/prices?active=true&limit=100&lookup_keys[0]=${PRICES[0].lookupKey}&lookup_keys[1]=${PRICES[1].lookupKey}`);
  const byKey = Object.fromEntries(existing.data.map((p) => [p.lookup_key, p]));
  const results = {};
  let product = null;

  for (const spec of PRICES) {
    const found = byKey[spec.lookupKey];
    if (found) {
      if (found.unit_amount !== spec.amount || found.recurring?.interval !== spec.interval) {
        fail(`Existing price ${found.id} (${spec.lookupKey}) is ${found.unit_amount / 100}/${found.recurring?.interval}, expected ${spec.amount / 100}/${spec.interval}. Resolve manually.`);
      }
      console.log(`✓ Price exists: ${spec.nickname} → ${found.id}`);
      results[spec.envVar] = found.id;
      continue;
    }
    if (DRY_RUN) {
      console.log(`→ [dry-run] Would create price: ${spec.nickname}`);
      results[spec.envVar] = "price_DRYRUN";
      continue;
    }
    if (!product) {
      const search = await stripe("GET", `/products/search?query=${encodeURIComponent(`active:'true' AND name:'${PRODUCT_NAME}'`)}`);
      product = search.data[0] ?? (await stripe("POST", "/products", { name: PRODUCT_NAME }));
      console.log(`✓ Product: ${product.name} → ${product.id}`);
    }
    const price = await stripe("POST", "/prices", {
      product: product.id,
      currency: "usd",
      unit_amount: spec.amount,
      recurring: { interval: spec.interval },
      lookup_key: spec.lookupKey,
      nickname: spec.nickname,
    });
    console.log(`✓ Created price: ${spec.nickname} → ${price.id}`);
    results[spec.envVar] = price.id;
  }
  return results;
}

async function ensureWebhook() {
  const list = await stripe("GET", "/webhook_endpoints?limit=100");
  const existing = list.data.find((w) => w.url === WEBHOOK_URL && w.status === "enabled");
  if (existing) {
    if (DRY_RUN) {
      console.log(`→ [dry-run] Webhook exists (${existing.id}); would delete + recreate to obtain a fresh signing secret.`);
      return "whsec_DRYRUN";
    }
    // The signing secret is only returned at creation, so recreate.
    await stripe("DELETE", `/webhook_endpoints/${existing.id}`);
    console.log(`✓ Removed prior webhook ${existing.id} (secret not retrievable) — recreating`);
  } else if (DRY_RUN) {
    console.log(`→ [dry-run] Would create webhook: ${WEBHOOK_URL}`);
    return "whsec_DRYRUN";
  }
  const wh = await stripe("POST", "/webhook_endpoints", {
    url: WEBHOOK_URL,
    enabled_events: WEBHOOK_EVENTS,
    description: "Manager Elevator production",
  });
  console.log(`✓ Webhook created: ${wh.id} → ${WEBHOOK_URL}`);
  return wh.secret;
}

async function ensurePortalConfig() {
  const list = await stripe("GET", "/billing_portal/configurations?limit=10&active=true");
  if (list.data.length > 0) {
    console.log(`✓ Customer Portal configuration already exists (${list.data[0].id})`);
    return;
  }
  if (DRY_RUN) {
    console.log("→ [dry-run] Would create Customer Portal configuration");
    return;
  }
  const cfg = await stripe("POST", "/billing_portal/configurations", {
    business_profile: { headline: "Manager Elevator membership" },
    default_return_url: `${APP_URL}/billing`,
    features: {
      invoice_history: { enabled: true },
      payment_method_update: { enabled: true },
      subscription_cancel: { enabled: true, mode: "at_period_end" },
    },
  });
  console.log(`✓ Customer Portal configuration created: ${cfg.id}`);
}

async function updateVercelEnv(vars) {
  if (!VERCEL_TOKEN) fail("Set VERCEL_TOKEN (a token with access to the dbengali2025s-projects team).");
  const { envs } = await vercel("GET", `/v9/projects/${VERCEL_PROJECT_ID}/env`);
  for (const [key, value] of Object.entries(vars)) {
    const current = envs.filter((e) => e.key === key && e.target?.includes("production"));
    if (DRY_RUN) {
      console.log(`→ [dry-run] Would set ${key} = ${mask(value)} (${current.length ? "update" : "create"})`);
      continue;
    }
    for (const e of current) await vercel("DELETE", `/v9/projects/${VERCEL_PROJECT_ID}/env/${e.id}`);
    await vercel("POST", `/v10/projects/${VERCEL_PROJECT_ID}/env`, {
      key,
      value,
      type: "encrypted",
      target: ["production"],
    });
    console.log(`✓ Vercel env set: ${key} = ${mask(value)}`);
  }
}

async function redeploy() {
  if (DRY_RUN) {
    console.log("→ [dry-run] Would redeploy production");
    return;
  }
  const { deployments } = await vercel("GET", `/v6/deployments?projectId=${VERCEL_PROJECT_ID}&target=production&limit=1&state=READY`);
  const latest = deployments?.[0];
  if (!latest) fail("No production deployment found to redeploy.");
  const dep = await vercel("POST", `/v13/deployments?forceNew=1`, {
    name: latest.name,
    deploymentId: latest.uid,
    target: "production",
    meta: { action: "redeploy" },
  });
  console.log(`✓ Redeploy triggered: ${dep.url ?? dep.id} — takes ~2 minutes`);
}

// --- Main ---------------------------------------------------------------------

console.log(`Manager Elevator payments go-live${DRY_RUN ? " (DRY RUN)" : ""}`);
console.log(`Webhook target: ${WEBHOOK_URL}\n`);

const isLive = await checkAccount();
const priceVars = await ensurePrices();
const webhookSecret = await ensureWebhook();
await ensurePortalConfig();

const envVars = {
  STRIPE_SECRET_KEY: STRIPE_KEY,
  STRIPE_WEBHOOK_SECRET: webhookSecret,
  ...priceVars,
};

if (SKIP_VERCEL) {
  console.log("\n--skip-vercel: set these on the production Vercel project yourself:");
  for (const [k, v] of Object.entries(envVars)) console.log(`  ${k}=${k === "STRIPE_SECRET_KEY" ? mask(v) : v}`);
} else {
  await updateVercelEnv(envVars);
  await redeploy();
}

console.log(`\nDone. Next: run one real-card smoke test on ${APP_URL}/billing, confirm access unlocks, then refund + cancel from the Stripe Dashboard.`);
if (!isLive) console.log("NOTE: this was a TEST-mode rehearsal, not the live cutover.");
