/**
 * Seed fake leaderboard users for development/demo purposes.
 * Run: npx tsx scripts/seed-users.ts
 */
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";

// Load from .env file
dotenv.config({ path: resolve(process.cwd(), ".env") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("❌ Missing environment variables!");
  console.error("   NEXT_PUBLIC_SUPABASE_URL:", url ? "✓" : "✗");
  console.error("   SUPABASE_SERVICE_ROLE_KEY:", key ? "✓" : "✗");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const SEED_USERS = [
  { username: "satoshi_sol",     xp: 45000, total_earned: 128.50, streak_count: 30 },
  { username: "vitalik_watcher", xp: 32150, total_earned: 85.20,  streak_count: 15 },
  { username: "phantom_degen",   xp: 28400, total_earned: 72.80,  streak_count: 12 },
  { username: "sol_maxi",        xp: 21200, total_earned: 54.10,  streak_count: 8  },
  { username: "defi_farmer",     xp: 17800, total_earned: 43.60,  streak_count: 5  },
  { username: "moon_watcher",    xp: 13500, total_earned: 32.00,  streak_count: 3  },
  { username: "chain_surfer",    xp: 9200,  total_earned: 21.40,  streak_count: 7  },
  { username: "yield_hunter",    xp: 6700,  total_earned: 15.90,  streak_count: 2  },
  { username: "stake_lord",      xp: 4500,  total_earned: 10.20,  streak_count: 1  },
  { username: "newbie_earner",   xp: 5000,  total_earned: 0,       streak_count: 0  },
];

async function seed() {
  console.log("Seeding leaderboard users...\n");

  for (const u of SEED_USERS) {
    const email = `${u.username}@seed.samono.local`;

    // Create auth user
    const { data: created, error: authErr } = await supabase.auth.admin.createUser({
      email,
      password: `seed_${u.username}_2026!`,
      email_confirm: true,
    });

    if (authErr) {
      // May already exist — try to look up by email
      const { data: existing } = await supabase.auth.admin.listUsers();
      const found = existing?.users?.find((u2) => u2.email === email);
      if (found) {
        // Update the profile for the existing user
        const { error: profErr } = await supabase.from("profiles").upsert(
          {
            id: found.id,
            username: u.username,
            xp: u.xp,
            total_earned: u.total_earned,
            streak_count: u.streak_count,
          },
          { onConflict: "id" }
        );
        console.log(profErr ? `✗ update ${u.username}: ${profErr.message}` : `↺ updated  ${u.username} (xp=${u.xp})`);
      } else {
        console.log(`⚠ skip ${u.username}: ${authErr.message}`);
      }
      continue;
    }

    // Upsert profile
    const { error: profErr } = await supabase.from("profiles").upsert(
      {
        id: created.user!.id,
        username: u.username,
        xp: u.xp,
        total_earned: u.total_earned,
        streak_count: u.streak_count,
      },
      { onConflict: "id" }
    );

    console.log(profErr ? `✗ ${u.username}: ${profErr.message}` : `✓ created  ${u.username} (xp=${u.xp})`);
  }

  console.log("\nDone.");
}

seed().catch(console.error);
