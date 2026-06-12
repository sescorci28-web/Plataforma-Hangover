const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf8');
const lines = envContent.split('\n');
let supabaseUrl = '';
let supabaseKey = '';

for (const line of lines) {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
    supabaseUrl = line.split('=')[1].trim();
  }
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
    supabaseKey = line.split('=')[1].trim();
  }
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  try {
    const email = `test_upload_user_${Date.now()}@test.com`;
    const password = "password123";
    
    console.log('1. Signing up test user...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password
    });
    
    if (signUpError) {
      console.error('Sign up failed:', signUpError);
      return;
    }
    
    const user = signUpData.user;
    console.log('Signed up! User ID:', user.id);
    
    const buffer = Buffer.from('dummy file content');
    
    // Attempt 1: Upload to clubs/banners/ (Root-level folder)
    {
      const filePath = `clubs/banners/test-${Date.now()}.txt`;
      console.log('Attempt 1: Uploading to:', filePath);
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, buffer, {
          contentType: 'text/plain',
          upsert: true
        });
      if (error) {
        console.log('Attempt 1 failed:', error.message);
      } else {
        console.log('Attempt 1 succeeded!', data);
      }
    }
    
    // Attempt 2: Upload to user_id/ (User-specific folder)
    {
      const filePath = `${user.id}/test-${Date.now()}.txt`;
      console.log('Attempt 2: Uploading to:', filePath);
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, buffer, {
          contentType: 'text/plain',
          upsert: true
        });
      if (error) {
        console.log('Attempt 2 failed:', error.message);
      } else {
        console.log('Attempt 2 succeeded!', data);
      }
    }

    // Attempt 3: Upload to user_id/clubs/banners/ (Nested under user folder)
    {
      const filePath = `${user.id}/clubs/banners/test-${Date.now()}.txt`;
      console.log('Attempt 3: Uploading to:', filePath);
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, buffer, {
          contentType: 'text/plain',
          upsert: true
        });
      if (error) {
        console.log('Attempt 3 failed:', error.message);
      } else {
        console.log('Attempt 3 succeeded!', data);
      }
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

test();
