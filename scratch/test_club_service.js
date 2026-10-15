const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ouibyflexyntquwptkhh.supabase.co';
const supabaseKey = 'sb_publishable_Q2nGAVHUY2In3SY6bF3-Xg_tg2JR5EZ';
const supabase = createClient(supabaseUrl, supabaseKey);

const DEFAULT_CLUB_BANNER = 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800&q=80';

function mapSupabaseClubToClubInfo(dbClub) {
  const addressParts = [dbClub.address, dbClub.city].filter(Boolean);
  const location = addressParts.length > 0 ? addressParts.join(', ') : (dbClub.city || 'Ubicación por confirmar');
  const imageUrl = dbClub.banner_image || dbClub.hero_image || dbClub.logo || DEFAULT_CLUB_BANNER;

  return {
    id: dbClub.id,
    name: dbClub.name || 'Discoteca Hangover',
    verified: true,
    location,
    hours: dbClub.opening_hours || 'Jue - Sáb: 9:00 PM - 4:00 AM',
    description: dbClub.description || 'Discoteca exclusiva asociada a la plataforma Hangover.',
    category: dbClub.club_type || 'Discoteca',
    rating: typeof dbClub.rating === 'number' && dbClub.rating > 0 ? dbClub.rating : 5.0,
    imageUrl,
    gallery: [],
    upcomingEvents: [],
    menu: [],
  };
}

async function test() {
  console.log('Testing getClubs() with active=true and status=published:');
  const { data, error } = await supabase
    .from('clubs')
    .select('*')
    .eq('active', true)
    .eq('status', 'published')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error:', error);
  } else {
    console.log(`Found ${data.length} published active clubs:`);
    const mapped = data.map(mapSupabaseClubToClubInfo);
    console.log(JSON.stringify(mapped, null, 2));

    if (mapped.length > 0) {
      console.log('\nTesting getClubById with first club ID:', mapped[0].id);
      const { data: singleClub, error: singleErr } = await supabase
        .from('clubs')
        .select('*')
        .eq('id', mapped[0].id)
        .eq('active', true)
        .eq('status', 'published')
        .single();
      
      if (singleErr) {
        console.error('Single error:', singleErr);
      } else {
        console.log('Successfully fetched single club:', singleClub.name);
      }
    }
  }
}

test();
