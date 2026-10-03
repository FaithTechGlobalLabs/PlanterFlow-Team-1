// Checks authenticated server-rendered pages with the synthetic demo sessions.
import { createServerClient } from "@supabase/ssr";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
const demo = JSON.parse(readFileSync(".env.workspace-demo.json", "utf8"));
const base = "http://127.0.0.1:3000";
for (const role of ["planter", "catalyst", "peer", "outsider"]) {
  const cookies = new Map();
  const auth = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: { getAll: () => [...cookies].map(([name,value]) => ({name,value})), setAll: entries => entries.forEach(({name,value}) => cookies.set(name,value)) },
  });
  const account = demo.accounts[role];
  const { error } = await auth.auth.signInWithPassword({ email: account.email, password: account.password });
  assert.equal(error, null, `sign in as ${role}`);
  const response = await fetch(`${base}/en/dashboard?planter=${demo.accounts.planter.id}`, {
    headers: { Cookie: [...cookies].map(([name,value]) => `${name}=${value}`).join("; ") }, redirect: "manual",
  });
  assert.equal(response.status,200,`dashboard renders for ${role}`);
  const html = await response.text();
  if (role === "planter" || role === "catalyst") {
    assert.ok(html.includes("Build deeper roots in our neighbourhood"), `${role} sees saved objective`);
    assert.ok(html.includes("Share coffee with two neighbours"), `${role} receives saved activity`);
    assert.ok(html.includes("those small conversations matter"), `${role} receives Catalyst reply`);
    assert.ok(!html.includes("Your workspace couldn’t load"), `${role} page has no load error`);
  } else {
    assert.ok(!html.includes("Build deeper roots in our neighbourhood"), `${role} cannot receive another planter's private objective in page payload`);
  }
  console.log(`PASS: ${role} authenticated page and scoped data`);
  if (role === "catalyst" || role === "outsider") {
    const overview = await fetch(`${base}/en/dashboard`, {
      headers: { Cookie: [...cookies].map(([name,value]) => `${name}=${value}`).join("; ") },
    });
    assert.equal(overview.status, 200);
    const overviewHtml = await overview.text();
    assert.ok(overviewHtml.includes("Planter journeys"), `${role} receives organization dashboard`);
    assert.ok(!overviewHtml.includes("Your workspace couldn’t load"));
    if (role === "catalyst") assert.ok(overviewHtml.includes("Daniel Park"));
    else assert.ok(!overviewHtml.includes("Build deeper roots in our neighbourhood"), "foreign organization data remains private");
    console.log(`PASS: ${role} organization dashboard and isolation`);
  }
}
const anonymous = await fetch(`${base}/en/dashboard`, { redirect: "manual" });
assert.equal(anonymous.status,307);
assert.ok(anonymous.headers.get("location").endsWith("/en/login"));
console.log("PASS: unauthenticated dashboard redirects to login");
