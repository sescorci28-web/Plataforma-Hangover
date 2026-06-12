const { createClient } = require('@supabase/supabase-js');

const url = "https://ouibyflexyntquwptkhh.supabase.co";
const key = "sb_publishable_Q2nGAVHUY2In3SY6bF3-Xg_tg2JR5EZ";

// We use the anon client
const supabase = createClient(url, key);

async function run() {
  const email = `test_provider_${Date.now()}@test.com`;
  const password = "password123";
  const name = "Test Provider Name";

  console.log("1. Signing up test provider...");
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        type: 'provider',
      }
    }
  });

  if (signUpError) {
    console.error("Sign up error:", signUpError);
    return;
  }

  const user = signUpData.user;
  console.log("Signed up successfully! User ID:", user.id);

  // We are signed in now as this user on this client instance.
  // Wait, let's verify if the profile was created in the database and its role is provider.
  // The database trigger might take a millisecond.
  await new Promise(r => setTimeout(r, 1000));
  
  console.log("2. Fetching profile...");
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("Profile error:", profileError);
    return;
  }
  console.log("Profile role is:", profile.role);

  // If role is not provider, let's update it to provider since some triggers might default to user
  if (profile.role !== 'provider') {
    console.log("Updating profile role to provider...");
    const { error: roleUpdateError } = await supabase
      .from("profiles")
      .update({ role: 'provider' })
      .eq("id", user.id);
    if (roleUpdateError) {
      console.error("Failed to set role to provider:", roleUpdateError);
      return;
    }
  }

  console.log("3. Creating a new club...");
  const slug = `test-club-${Date.now()}`;
  const { data: insertData, error: insertError } = await supabase
    .from("clubs")
    .insert({
      provider_id: user.id,
      name: "Test Club",
      slug,
      city: "Barranquilla",
      description: "My club",
      rating: 5.0,
      active: true,
      cover_price: 15000.00
    })
    .select();

  if (insertError) {
    console.error("Insert club error:", insertError);
    return;
  }

  const club = insertData[0];
  console.log("Created club:", club);

  console.log("4. Updating the club...");
  const { data: updateData, error: updateError } = await supabase
    .from("clubs")
    .update({
      name: "Updated Club Name",
      active: false,
      cover_price: 25000.00,
      banner_image: "https://example.com/banner.jpg",
      logo: "https://example.com/logo.jpg"
    })
    .eq("id", club.id)
    .eq("provider_id", user.id)
    .select();

  if (updateError) {
    console.error("Update club error:", updateError);
    return;
  }

  console.log("Update response data:", updateData);

  console.log("5. Fetching the club again to verify persistence...");
  const { data: verifiedClub, error: fetchError } = await supabase
    .from("clubs")
    .select("*")
    .eq("id", club.id)
    .single();

  if (fetchError) {
    console.error("Fetch verified club error:", fetchError);
    return;
  }

  console.log("Verified club in database:", verifiedClub);
}

run();
