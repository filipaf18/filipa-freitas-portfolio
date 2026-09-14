// Cria as duas utilizadoras no Supabase Auth (usa a service role key).
// Uso: node --env-file=.env.local scripts/create-users.mjs
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const users = process.env.APP_USERS;

if (!url || !key || !users) {
  console.error("Faltam NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY ou APP_USERS.");
  process.exit(1);
}

const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

for (const entry of users.split(";").map((s) => s.trim()).filter(Boolean)) {
  const [email, password, display_name] = entry.split(":");
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: display_name ?? email.split("@")[0] },
  });
  if (error) console.error(`✗ ${email}: ${error.message}`);
  else console.log(`✓ ${email} (${data.user.id})`);
}
