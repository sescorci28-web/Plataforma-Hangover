const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ouibyflexyntquwptkhh.supabase.co';
const supabaseKey = 'sb_publishable_Q2nGAVHUY2In3SY6bF3-Xg_tg2JR5EZ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function audit() {
  console.log('=== 1. AUDIT PROFILES ===');
  const { data: profiles, error: pErr } = await supabase.from('profiles').select('*').limit(1);
  if (pErr) console.error('Profiles error:', pErr);
  else {
    console.log('Profiles columns:', profiles.length > 0 ? Object.keys(profiles[0]) : 'Empty table');
    if (profiles[0]) console.log('Profiles sample:', profiles[0]);
  }

  console.log('\n=== 2. AUDIT EVENTS ===');
  const { data: events, error: eErr } = await supabase.from('events').select('*').limit(1);
  if (eErr) console.error('Events error:', eErr);
  else {
    console.log('Events columns:', events.length > 0 ? Object.keys(events[0]) : 'Empty table');
    if (events[0]) console.log('Events sample:', events[0]);
  }

  console.log('\n=== 3. AUDIT CLUBS ===');
  const { data: clubs, error: cErr } = await supabase.from('clubs').select('*').limit(1);
  if (cErr) console.error('Clubs error:', cErr);
  else {
    console.log('Clubs columns:', clubs.length > 0 ? Object.keys(clubs[0]) : 'Empty table');
    if (clubs[0]) console.log('Clubs sample:', clubs[0]);
  }

  console.log('\n=== 4. AUDIT SERVICES ===');
  const { data: services, error: sErr } = await supabase.from('services').select('*').limit(1);
  if (sErr) console.error('Services error:', sErr);
  else {
    console.log('Services columns:', services.length > 0 ? Object.keys(services[0]) : 'Empty table');
    if (services[0]) console.log('Services sample:', services[0]);
  }

  console.log('\n=== 5. CHECK OPENAPI SCHEMA DEFS ===');
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/?apikey=${supabaseKey}`);
    const spec = await res.json();
    if (spec && spec.definitions) {
      console.log('Available tables in OpenAPI spec:', Object.keys(spec.definitions));
      ['profiles', 'events', 'clubs', 'services'].forEach(t => {
        if (spec.definitions[t]) {
          console.log(`\nTable [${t}] OpenAPI properties:`, Object.keys(spec.definitions[t].properties || {}));
        }
      });
    }
  } catch (err) {
    console.error('OpenAPI fetch error:', err);
  }
}

audit();
