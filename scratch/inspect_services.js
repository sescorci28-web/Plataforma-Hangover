const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ouibyflexyntquwptkhh.supabase.co';
const supabaseKey = 'sb_publishable_Q2nGAVHUY2In3SY6bF3-Xg_tg2JR5EZ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
  const { data: services, error } = await supabase
    .from('services')
    .select('id, title, category, slug, image_url, cover_url, video_url')
    .limit(10);

  if (error) {
    console.error('Error fetching services:', error);
    return;
  }

  console.log('Services count:', services.length);
  for (const s of services) {
    console.log(`Service: ${s.title} (${s.id})`);
    console.log(`  Slug: ${s.slug}`);
    console.log(`  Category: ${s.category}`);
    console.log(`  Image: ${s.image_url}`);
    console.log(`  Cover: ${s.cover_url}`);
    console.log(`  Video: ${s.video_url}`);
    
    // Check if stories/gallery items exist
    const { count: storiesCount } = await supabase
      .from('service_stories')
      .select('id', { count: 'exact', head: true })
      .eq('service_id', s.id);
    
    const { count: galleryCount } = await supabase
      .from('service_gallery_items')
      .select('id', { count: 'exact', head: true })
      .eq('service_id', s.id);
      
    const { count: pastEventsCount } = await supabase
      .from('service_past_events')
      .select('id', { count: 'exact', head: true })
      .eq('service_id', s.id);
      
    const { count: reviewsCount } = await supabase
      .from('service_reviews')
      .select('id', { count: 'exact', head: true })
      .eq('service_id', s.id);

    console.log(`  Stories: ${storiesCount}, Gallery items: ${galleryCount}, Past events: ${pastEventsCount}, Reviews: ${reviewsCount}`);
  }
}

inspect();
