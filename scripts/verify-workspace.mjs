// Synthetic demo accounts and live permission checks. No real planter data is used.
// Run with: node --env-file=.env.local scripts/verify-workspace.mjs
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import assert from "node:assert/strict";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
assert.equal(new URL(url).hostname, "uqxkoqekpvdyucuiccxh.supabase.co", "Use the approved project only.");
const admin = createClient(url, process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const file = ".env.workspace-demo.json"; // ignored by .env*; never commit account credentials
let demo = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : { accounts: {} };
const persist = () => writeFileSync(file, JSON.stringify(demo, null, 2));
const requireData = result => { if (result.error) throw new Error(result.error.message); return result.data; };
if (!demo.org) {
  demo.org = requireData(await admin.from("organizations").insert({ name: "First Fruits — Demo Community" }).select("id").single()).id;
  demo.foreignOrg = requireData(await admin.from("organizations").insert({ name: "First Fruits — Access Test Community" }).select("id").single()).id;
  persist();
}
for (const [name, display_name, role, org_id] of [
  ["planter", "Daniel Park (Demo)", "planter", demo.org], ["catalyst", "Alex Morgan (Demo)", "catalyst", demo.org],
  ["peer", "Jamie Lee (Demo)", "planter", demo.org], ["outsider", "Outside Catalyst (Test)", "catalyst", demo.foreignOrg],
]) {
  if (!demo.accounts[name]) {
    const password = randomBytes(24).toString("base64url");
    const email = `firstfruits.${name}.${randomBytes(5).toString("hex")}@example.com`;
    const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    if (error) throw new Error(error.message);
    demo.accounts[name] = { id: data.user.id, email, password }; persist();
  }
  requireData(await admin.from("profiles").upsert({ id: demo.accounts[name].id, org_id, role, display_name, locale: "en", onboarded_at: new Date().toISOString() }));
}
if (!demo.categories) {
  demo.categories = requireData(await admin.from("objective_categories").insert([
    { org_id: demo.org, title: "Engage the City", sort_order: 1, kind: "objective" },
    { org_id: demo.org, title: "Make Disciples", sort_order: 2, kind: "objective" },
    { org_id: demo.org, title: "Plant the Church", sort_order: 3, kind: "objective" },
    { org_id: demo.org, title: "Personal Relationship with Jesus", sort_order: 4, kind: "objective" },
    { org_id: demo.org, title: "Prayer Requests", sort_order: 5, kind: "prayer" },
    { org_id: demo.foreignOrg, title: "Foreign category", sort_order: 1, kind: "objective" },
  ]).select("id,title,org_id")); persist();
}
requireData(await admin.from("churches").upsert({ pastor_id: demo.accounts.planter.id, org_id: demo.org, catalyst_id: demo.accounts.catalyst.id, name: "Hope Community Church (Demo)", city: "Vancouver, BC", planting_start_date: "2025-09-01", vision: "A community where neighbours become friends, and friends discover the hope of Jesus." }, { onConflict: "pastor_id" }));

const clients = {};
for (const [name, account] of Object.entries(demo.accounts)) {
  const client = createClient(url, publicKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await client.auth.signInWithPassword({ email: account.email, password: account.password });
  if (error) throw new Error(`${name}: ${error.message}`);
  clients[name] = client;
}
const { planter, catalyst, peer, outsider } = clients;
const category = demo.categories.find(c => c.title === "Engage the City");
if (!demo.objective) {
  demo.objective = requireData(await planter.from("objectives").insert({ planter_id: demo.accounts.planter.id, category_id: category.id, title: "Build deeper roots in our neighbourhood", description: "Make space for genuine relationships, one conversation at a time.", cadence: "weekly" }).select("id").single()).id; persist();
}
if (!demo.activity) {
  demo.activity = requireData(await planter.from("activities").insert({ objective_id: demo.objective, description: "Share coffee with two neighbours", cadence: "weekly" }).select("id").single()).id; persist();
}
if (!demo.progress) {
  demo.progress = requireData(await planter.from("progress_entries").insert({ objective_id: demo.objective, activity_id: demo.activity, author_id: demo.accounts.planter.id, note: "Demo: two good conversations this week. One neighbour is joining us for dinner.", value: 2 }).select("id").single()).id; persist();
}
if (!demo.checkin) {
  demo.checkin = requireData(await planter.from("check_ins").insert({ planter_id: demo.accounts.planter.id, note: "Demo: grateful for new connections and finding our rhythm.", feeling: "encouraged", momentum: "moving", support: "Prayer for a sustainable rhythm for our family." }).select("id").single()).id; persist();
}
if (!demo.message) {
  demo.message = requireData(await catalyst.from("dialogue_messages").insert({ objective_id: demo.objective, author_id: demo.accounts.catalyst.id, body: "Demo: those small conversations matter. I’m praying for you this week." }).select("id").single()).id; persist();
}
if (!demo.prayer) {
  demo.prayer = requireData(await planter.from("prayer_requests").insert({ planter_id: demo.accounts.planter.id, org_id: demo.org, body: "Demo: please pray for the families we are getting to know.", visibility: "private" }).select("id").single()).id; persist();
}
const count = async (db, table, column, id) => requireData(await db.from(table).select("id").eq(column, id)).length;
for (const [table, column, id] of [["objectives","id",demo.objective],["activities","objective_id",demo.objective],["progress_entries","objective_id",demo.objective],["dialogue_messages","objective_id",demo.objective],["check_ins","id",demo.checkin],["prayer_requests","id",demo.prayer]]) {
  assert.ok(await count(planter,table,column,id)>0, `owner reads ${table}`);
  assert.ok(await count(catalyst,table,column,id)>0, `Catalyst reads ${table}`);
  assert.equal(await count(peer,table,column,id),0, `peer cannot read private ${table}`);
  assert.equal(await count(outsider,table,column,id),0, `foreign Catalyst cannot read ${table}`);
}
assert.ok((await peer.from("dialogue_messages").insert({ objective_id:demo.objective,author_id:demo.accounts.peer.id,body:"Forbidden reply" })).error);
assert.ok((await catalyst.from("progress_entries").insert({ objective_id:demo.objective,author_id:demo.accounts.catalyst.id,note:"Forbidden progress" })).error);
assert.ok((await planter.from("dialogue_messages").insert({ objective_id:demo.objective,author_id:demo.accounts.catalyst.id,body:"Forged author" })).error);
assert.ok((await planter.from("objectives").insert({ planter_id:demo.accounts.planter.id,category_id:demo.categories.find(c=>c.org_id===demo.foreignOrg).id,title:"Foreign category" })).error);
assert.ok((await planter.from("profiles").update({ role:"catalyst" }).eq("id",demo.accounts.planter.id)).error);
requireData(await catalyst.from("prayer_requests").update({ visibility:"organization" }).eq("id",demo.prayer).select("id").single());
assert.equal(await count(peer,"prayer_requests","id",demo.prayer),1,"shared prayer visible to peer");
assert.equal(await count(outsider,"prayer_requests","id",demo.prayer),0,"shared prayer isolated to organization");
assert.equal(requireData(await peer.from("prayer_requests").update({visibility:"private"}).eq("id",demo.prayer).select("id")).length,0,"peer cannot change sharing");
requireData(await planter.from("prayer_requests").update({ visibility:"private" }).eq("id",demo.prayer).select("id").single());
assert.equal(await count(peer,"prayer_requests","id",demo.prayer),0,"unsharing removes peer access");
const reloaded = createClient(url,publicKey,{auth:{persistSession:false}});
requireData(await reloaded.auth.signInWithPassword({email:demo.accounts.planter.email,password:demo.accounts.planter.password}));
assert.equal(await count(reloaded,"progress_entries","id",demo.progress),1,"progress survives new session");
console.log("PASS: persisted objectives, activities, progress, check-ins, Catalyst replies, sharing/unsharing, author integrity, profile privilege protection, and cross-planter/cross-organization isolation.");
console.log("Synthetic demo account credentials saved locally in .env.workspace-demo.json (ignored by Git).");
