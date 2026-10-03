// Exercise the built app's actual Server Actions using only approved demo sessions.
// Start the production server first; run with node --env-file=.env.local scripts/verify-workspace-actions.mjs.
import { createServerClient } from "@supabase/ssr";
import { readFileSync, writeFileSync } from "node:fs";
import assert from "node:assert/strict";
const file = ".env.workspace-demo.json";
const demo = JSON.parse(readFileSync(file, "utf8"));
const manifest = JSON.parse(readFileSync(".next/server/server-reference-manifest.json", "utf8"));
const base = "http://127.0.0.1:3000";
const clients = {};
assert.equal(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname, "uqxkoqekpvdyucuiccxh.supabase.co");
for (const role of ["planter", "catalyst", "peer", "outsider"]) {
  const cookies = new Map();
  const db = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: { getAll: () => [...cookies].map(([name,value]) => ({name,value})), setAll: entries => entries.forEach(({name,value}) => cookies.set(name,value)) },
  });
  const { email, password } = demo.accounts[role];
  assert.equal((await db.auth.signInWithPassword({email,password})).error, null);
  clients[role] = { db, cookie: () => [...cookies].map(([name,value]) => `${name}=${value}`).join("; ") };
}
async function action(role, name, fields) {
  const id = Object.entries(manifest.node).find(([, value]) => value.exportedName === name)?.[0];
  assert.ok(id, `built action ${name} exists`);
  const body = new FormData();
  for (const [key, value] of Object.entries(fields)) body.set(`_1_${key}`, value);
  body.set("0", '["$K1"]');
  const response = await fetch(`${base}/en/dashboard`, { method: "POST", headers: { Cookie: clients[role].cookie(), Origin: base, "Next-Action": id }, body });
  assert.equal(response.status, 200, `${name} HTTP response`);
  const payload = await response.text();
  for (const line of payload.split("\n")) {
    const match = line.match(/^[0-9a-f]+:(\{"ok":.*)$/);
    if (match) { const result = JSON.parse(match[1]); if (!result.ok) console.log(`${role} ${name}: ${result.error}`); return result; }
  }
  throw new Error(`No SaveResult returned by ${name}`);
}
const save = (role, fields) => action(role, "saveWorkspace", fields);
const category = demo.categories.find(category => category.title === "Engage the City");
demo.workflowChecks ??= {};
const keep = (key, id) => { demo.workflowChecks[key] = id; writeFileSync(file, JSON.stringify(demo, null, 2)); };
assert.equal((await save("planter", { intent: "objective", id: demo.objective, category_id: category.id, title: "Build deeper roots in our neighbourhood", description: "Make space for genuine relationships, one conversation at a time.", cadence: "weekly" })).ok, true);
assert.equal((await save("planter", { intent: "activity", id: demo.activity, objective_id: demo.objective, description: "Share coffee with two neighbours", cadence: "weekly" })).ok, true);
for (const [key, role, fields] of [
  ["progress", "planter", { intent:"progress", objective_id:demo.objective, activity_id:demo.activity, note:"Demo: shared a meal with a neighbour and planned our next gathering.", value:"1" }],
  ["checkin", "planter", { intent:"check_in", note:"Demo: grateful for new friendships this week.", feeling:"encouraged", momentum:"moving", support:"Please pray for a sustainable family rhythm." }],
  ["reply", "catalyst", { intent:"message", objective_id:demo.objective, body:"Demo: thank you for the update. I’m praying for your family and the new friendships." }],
]) {
  if (!demo.workflowChecks[key]) {
    const result = await save(role, fields);
    assert.equal(result.ok, true, `${key} saves through the app`);
    keep(key, result.id);
  }
}
assert.equal((await save("planter", { intent:"prayer_visibility", id:demo.prayer, visibility:"private" })).ok, true);
assert.equal((await save("peer", { intent:"message", objective_id:demo.objective, body:"Forbidden peer message" })).ok, false);
assert.equal((await save("outsider", { intent:"message", objective_id:demo.objective, body:"Forbidden outsider message" })).ok, false);
assert.equal((await save("catalyst", { intent:"progress", objective_id:demo.objective, note:"Forbidden progress" })).ok, false);
assert.equal((await action("planter", "saveCategory", { intent:"category", id:category.id, title:"Forbidden rename" })).ok, false);
assert.equal((await action("outsider", "saveCategory", { intent:"category", id:category.id, title:"Forbidden rename" })).ok, false);
assert.equal((await action("catalyst", "saveCategory", { intent:"remove_category", id:category.id })).ok, false);
assert.equal((await action("catalyst", "saveCategory", { intent:"category", id:category.id, title:"Engage the City", description:"Build meaningful relationships and serve your neighbourhood." })).ok, true);
for (const [table, key] of [["progress_entries","progress"],["check_ins","checkin"],["dialogue_messages","reply"]]) {
  const result = await clients.planter.db.from(table).select("id").eq("id", demo.workflowChecks[key]).single();
  assert.equal(result.error, null, `${key} is persisted and readable`);
}
console.log("PASS: app saves objective/activity edits, progress, check-in, Catalyst reply, prayer sharing and category edits; rejects unauthorized writes and removal of a category in use.");


