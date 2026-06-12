const { createClient } = require('@supabase/supabase-js');

const url = "https://ouibyflexyntquwptkhh.supabase.co";
const key = "sb_publishable_Q2nGAVHUY2In3SY6bF3-Xg_tg2JR5EZ";

// We use the anon client
const supabase = createClient(url, key);

async function run() {
  const providerEmail = `prov_${Date.now()}@test.com`;
  const adminEmail = `adm_${Date.now()}@test.com`;
  const password = "password123";

  console.log("1. Creating provider...");
  const { data: provData } = await supabase.auth.signUp({ email: providerEmail, password });
  const provId = provData.user.id;
  await new Promise(r => setTimeout(r, 1000));
  await supabase.from("profiles").update({ role: 'provider' }).eq("id", provId);

  console.log("2. Inserting club as provider...");
  const slug = `test-rls-${Date.now()}`;
  const { data: clubData } = await supabase.from("clubs").insert({
    provider_id: provId,
    name: "RLS Test Club",
    slug,
    city: "Barranquilla",
    active: true
  }).select();
  const clubId = clubData[0].id;
  console.log("Club created with ID:", clubId);

  console.log("3. Creating admin...");
  const { data: admData } = await supabase.auth.signUp({ email: adminEmail, password });
  const admId = admData.user.id;
  await new Promise(r => setTimeout(r, 1000));
  await supabase.from("profiles").update({ role: 'admin' }).eq("id", admId);

  // Now we sign in as admin on a new client instance
  const adminClient = createClient(url, key);
  await adminClient.auth.signInWithPassword({ email: adminEmail, password });

  console.log("4. Trying to update club as admin (simulating actions.ts without provider_id filter)...");
  const { data: updateRes, error: updateErr } = await adminClient
    .from("clubs")
    .update({ name: "Updated by Admin" })
    .eq("id", clubId)
    .select();

  console.log("Update result as admin:", { updateRes, updateErr });

  console.log("5. Trying to delete club as admin...");
  const { data: deleteRes, error: deleteErr } = await adminClient
    .from("clubs")
    .delete()
    .eq("id", clubId)
    .select();

  console.log("Delete result as admin:", { deleteRes, deleteErr });
}

run();
