#!/usr/bin/env node
import { createClient } from "@supabase/supabase-js";

const BC_ORG_ID = "00000000-0000-0000-0000-000000000001";

async function main() {
  // Check Node version
  const nodeMajor = parseInt(process.versions.node.split(".")[0], 10);
  if (nodeMajor < 22) {
    console.error("This script requires Node 22+ (run: nvm use)");
    process.exit(1);
  }

  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    console.log("Usage: node --env-file=.env.local scripts/invite-catalyst.mjs <email...> [--admin] [--site http://localhost:3000] [--inviter \"Paul Wicki\"]");
    process.exit(args[0] === "--help" || args[0] === "-h" ? 0 : 1);
  }

  const emails = [];
  let site = "http://localhost:3000";
  let inviterName = "Paul Wicki";
  let isAdmin = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--site" && i + 1 < args.length) {
      site = args[i + 1];
      i++;
    } else if (args[i] === "--inviter" && i + 1 < args.length) {
      inviterName = args[i + 1];
      i++;
    } else if (args[i] === "--admin") {
      isAdmin = true;
    } else if (!args[i].startsWith("--")) {
      emails.push(args[i]);
    }
  }

  if (emails.length === 0) {
    console.error("Error: At least one email address is required");
    process.exit(1);
  }

  // Validate environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Error: Missing required environment variables");
    console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
    process.exit(1);
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  let hadFailure = false;

  for (const email of emails) {
    try {
      // Create invitation record
      const { data: invitation, error: insertError } = await supabase
        .from("invitations")
        .insert({
          org_id: BC_ORG_ID,
          email: email,
          role: "catalyst",
          is_admin: isAdmin,
          invited_by: null,
          invited_by_name: inviterName,
        })
        .select("token")
        .single();

      if (insertError) {
        console.log(`Failed: ${email} -> ${insertError.message}`);
        hadFailure = true;
        continue;
      }

      const token = invitation.token;
      const redirectTo = `${site}/en/invite/${token}`;

      // Send invitation email via Supabase Auth
      const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
        email,
        {
          redirectTo,
          data: {
            invitation_token: token,
            invited_by_name: inviterName,
          },
        }
      );

      if (inviteError) {
        // Delete the invitation record on failure
        await supabase.from("invitations").delete().eq("token", token);
        console.log(`Failed: ${email} -> ${inviteError.message}`);
        hadFailure = true;
        continue;
      }

      console.log(`Sent: ${email} -> ${redirectTo}`);
    } catch (error) {
      console.log(`Failed: ${email} -> ${error.message}`);
      hadFailure = true;
    }
  }

  process.exit(hadFailure ? 1 : 0);
}

main();
