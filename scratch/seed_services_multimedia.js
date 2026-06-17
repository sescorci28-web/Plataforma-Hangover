const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ouibyflexyntquwptkhh.supabase.co';
const supabaseKey = 'sb_publishable_Q2nGAVHUY2In3SY6bF3-Xg_tg2JR5EZ';

const UNSPLASH_IMAGES = {
  music: [
    "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1080", // DJ setup
    "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1080", // party crowd
    "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=1080"  // festival lasers
  ],
  sound: [
    "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1080", // big speakers
    "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1080", // lights
    "https://images.unsplash.com/photo-1482440308425-276ad0f28b19?w=1080"  // concert scene
  ],
  bar: [
    "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=1080", // cocktails
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1080", // bartender mixing
    "https://images.unsplash.com/photo-1574096079513-d8259312b785?w=1080"  // party drinks
  ],
  media: [
    "https://images.unsplash.com/photo-1453060113865-968ce1ad0570?w=1080", // photographer
    "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1080", // camera close up
    "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=1080"  // event photo shoot
  ]
};

const MIXKIT_VIDEOS = [
  "https://assets.mixkit.co/videos/preview/mixkit-dj-playing-music-at-a-club-42292-large.mp4",
  "https://assets.mixkit.co/videos/preview/mixkit-people-dancing-at-a-party-with-neon-lights-40013-large.mp4"
];

const COMMENTS = [
  "Excelente servicio. Muy profesional y puntual.",
  "Superó todas nuestras expectativas, los invitados quedaron encantados.",
  "La mejor experiencia para nuestra fiesta. Totalmente recomendado.",
  "Excelente equipo de sonido y la selección musical fue inmejorable.",
  "Muy buena disposición, montaje impecable. Los volvería a contratar sin duda."
];

async function runSeeder() {
  console.log("=== HANGOVER RLS-COMPLIANT SERVICE SEEDER ===");
  
  const providerEmail = "premium_provider@hangover.com";
  const buyerEmail = "buyer@hangover.com";
  const password = "password123";

  // 1. Sign up/in Provider
  const supabase = createClient(supabaseUrl, supabaseKey);
  console.log(`1. Logging in as provider: ${providerEmail}`);
  let session = await supabase.auth.signInWithPassword({ email: providerEmail, password });
  
  if (session.error) {
    console.log("Provider account not found. Signing up...");
    const signUp = await supabase.auth.signUp({
      email: providerEmail,
      password,
      options: { data: { name: "Andrés Silva", type: "provider" } }
    });
    if (signUp.error) {
      console.error("Failed to sign up provider:", signUp.error.message);
      return;
    }
    session = await supabase.auth.signInWithPassword({ email: providerEmail, password });
  }

  const providerUser = session.data.user;
  console.log("Logged in provider successfully! User ID:", providerUser.id);
  
  // Wait for trigger to create profile
  await new Promise(r => setTimeout(r, 1000));

  // Ensure role is provider and onboarding completed
  await supabase
    .from("profiles")
    .update({ role: "provider", onboarding_completed: true, full_name: "Andrés Silva (DJ Andres)", username: "dj_andres" })
    .eq("id", providerUser.id);

  // 2. Create the premium services
  const servicesToCreate = [
    {
      title: "DJ Andres Premium Crossover Set",
      category: "music",
      price: 450000,
      description: "Servicio de DJ Premium para discotecas, bodas y fiestas exclusivas en Barranquilla y Cartagena. Ofrezco un repertorio variado desde electrónica y urbano hasta crossover clásico.",
      experience: "Residente de Hangover Club y más de 8 años de trayectoria en eventos nacionales.",
      cities_coverage: ["Barranquilla", "Cartagena", "Santa Marta"],
      tags: ["dj", "crossover", "vip", "reggaeton"],
      specialties: ["Bodas de Lujo", "Discotecas", "Eventos Sociales"]
    },
    {
      title: "Barra Móvil y Coctelería de Autor",
      category: "bar",
      price: 600000,
      description: "Servicio de coctelería premium con bartender profesional, licores seleccionados y cristalería fina. Diseñamos un menú de tragos personalizado para tu noche ideal.",
      experience: "Mixólogo certificado con experiencia en las mejores barras de Medellín y Bogotá.",
      cities_coverage: ["Barranquilla", "Medellín", "Bogotá"],
      tags: ["cocteleria", "bar", "shots", "premium"],
      specialties: ["Cumpleaños", "Graduaciones", "Fiestas Privadas"]
    },
    {
      title: "Montaje de Sonido Line Array y Luces Robotizadas",
      category: "sound",
      price: 1200000,
      description: "Estructuras completas de truss, iluminación inteligente automatizada por DMX, máquinas de humo y sonido profesional de alta fidelidad.",
      experience: "Empresa con 10 años de trayectoria garantizando la acústica e impacto visual en conciertos y discotecas.",
      cities_coverage: ["Barranquilla", "Cartagena"],
      tags: ["sonido", "iluminacion", "pantallas", "laser"],
      specialties: ["Conciertos", "Eventos corporativos de gran escala"]
    },
    {
      title: "Cobertura de Foto y Video Cinematográfico",
      category: "media",
      price: 500000,
      description: "Registro profesional con cámaras de formato completo, drones para tomas aéreas y entrega rápida de resúmenes en formato vertical para Instagram/TikTok Reels.",
      experience: "Fotógrafo y creador de contenido con enfoque de vida nocturna.",
      cities_coverage: ["Barranquilla", "Cartagena", "Santa Marta"],
      tags: ["fotografo", "video", "reels", "drone"],
      specialties: ["Cumpleaños", "Aftermovies", "Sociales"]
    }
  ];

  console.log("2. Registering premium services...");
  const createdServices = [];

  for (const s of servicesToCreate) {
    // Check if it already exists to prevent duplication
    const { data: existing } = await supabase
      .from("services")
      .select("id")
      .eq("title", s.title)
      .eq("provider_id", providerUser.id)
      .maybeSingle();

    if (existing) {
      console.log(`Service "${s.title}" already exists with ID: ${existing.id}`);
      // Fetch details of existing to make sure we keep track
      const { data: fullS } = await supabase.from("services").select("*").eq("id", existing.id).single();
      createdServices.push(fullS);
      continue;
    }

    const image_url = UNSPLASH_IMAGES[s.category][0];
    const cover_url = UNSPLASH_IMAGES[s.category][1] || image_url;
    const video_url = MIXKIT_VIDEOS[Math.floor(Math.random() * MIXKIT_VIDEOS.length)];

    const { data: inserted, error: insertErr } = await supabase
      .from("services")
      .insert({
        provider_id: providerUser.id,
        title: s.title,
        slug: s.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        category: s.category,
        price: s.price,
        description: s.description,
        experience: s.experience,
        cities_coverage: s.cities_coverage,
        tags: s.tags,
        specialties: s.specialties,
        image_url,
        cover_url,
        video_url,
        spotify_url: s.category === 'music' ? 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGwq6v7e' : null,
        soundcloud_url: s.category === 'music' ? 'https://soundcloud.com/tiesto/club-life-840' : null,
        youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        whatsapp_number: '573001234567',
        social_media: { instagram: `@${s.title.toLowerCase().replace(/[^a-z0-9]+/g, '')}_hangover`, facebook: `${s.title.toLowerCase().replace(/[^a-z0-9]+/g, '')}.hangover` }
      })
      .select()
      .single();

    if (insertErr) {
      console.error(`Error inserting service "${s.title}":`, insertErr.message);
    } else {
      console.log(`Created service "${inserted.title}" with ID: ${inserted.id}`);
      createdServices.push(inserted);
    }
  }

  // 3. Seed stories, gallery items, and past events for each service
  console.log("3. Seeding multimedia elements (stories, gallery, past events) for each service...");
  for (const s of createdServices) {
    const images = UNSPLASH_IMAGES[s.category] || UNSPLASH_IMAGES.music;
    const video_url = s.video_url || MIXKIT_VIDEOS[0];

    // Stories check & insert
    const { count: storiesCount } = await supabase.from('service_stories').select('id', { count: 'exact', head: true }).eq('service_id', s.id);
    if (storiesCount === 0) {
      const { error: storyErr } = await supabase.from('service_stories').insert([
        { service_id: s.id, url: images[0], media_type: 'image', title: 'Comenzando el show', description: '¡Listos para darlo todo!', display_order: 1, active: true },
        { service_id: s.id, url: images[1] || images[0], media_type: 'image', title: 'Pista llena', description: 'La mejor vibra de la noche', display_order: 2, active: true }
      ]);
      if (storyErr) console.error(`  Error seeding stories for "${s.title}":`, storyErr.message);
      else console.log(`  Seeded stories for "${s.title}"`);
    }

    // Gallery check & insert
    const { count: galleryCount } = await supabase.from('service_gallery_items').select('id', { count: 'exact', head: true }).eq('service_id', s.id);
    if (galleryCount === 0) {
      const { error: galleryErr } = await supabase.from('service_gallery_items').insert([
        { service_id: s.id, url: images[0], media_type: 'image', title: 'Equipamiento principal', description: 'Detalle de los equipos profesionales', display_order: 1, active: true, featured: true },
        { service_id: s.id, url: images[2] || images[0], media_type: 'image', title: 'Montaje de cabina', description: 'Cabina organizada y prolija', display_order: 2, active: true },
        { service_id: s.id, url: video_url, media_type: 'video', title: 'Video promocional', description: 'Showreel del servicio en vivo', display_order: 3, active: true, featured: true }
      ]);
      if (galleryErr) console.error(`  Error seeding gallery for "${s.title}":`, galleryErr.message);
      else console.log(`  Seeded gallery items for "${s.title}"`);
    }

    // Past events check & insert
    const { count: pastCount } = await supabase.from('service_past_events').select('id', { count: 'exact', head: true }).eq('service_id', s.id);
    if (pastCount === 0) {
      const { error: pastErr } = await supabase.from('service_past_events').insert([
        { service_id: s.id, title: 'Matrimonio VIP en Cartagena', event_date: '2026-04-18', description: 'Producción musical y montaje técnico frente al mar para 250 invitados.', media_urls: [images[0]] },
        { service_id: s.id, title: 'Fiesta Neon - Universidad del Norte', event_date: '2026-05-02', description: 'Show interactivo de 4 horas con efectos especiales y ambientación láser.', media_urls: [images[1] || images[0]] }
      ]);
      if (pastErr) console.error(`  Error seeding past events for "${s.title}":`, pastErr.message);
      else console.log(`  Seeded past events for "${s.title}"`);
    }
  }

  // 4. Sign out and sign in as Buyer to book and write reviews
  const buyerClient = createClient(supabaseUrl, supabaseKey);
  console.log(`4. Logging in as buyer: ${buyerEmail}`);
  let buyerSession = await buyerClient.auth.signInWithPassword({ email: buyerEmail, password });
  
  if (buyerSession.error) {
    console.log("Buyer account not found. Signing up...");
    const signUp = await buyerClient.auth.signUp({
      email: buyerEmail,
      password,
      options: { data: { name: "Laura Gómez", type: "user" } }
    });
    if (signUp.error) {
      console.error("Failed to sign up buyer:", signUp.error.message);
      return;
    }
    buyerSession = await buyerClient.auth.signInWithPassword({ email: buyerEmail, password });
  }

  const buyerUser = buyerSession.data.user;
  console.log("Logged in buyer successfully! User ID:", buyerUser.id);
  
  // Wait for trigger to create profile
  await new Promise(r => setTimeout(r, 1000));

  // Ensure role is user and onboarding completed
  await buyerClient
    .from("profiles")
    .update({ role: "user", onboarding_completed: true, full_name: "Laura Gómez", username: "laura_g" })
    .eq("id", buyerUser.id);

  // 5. Create bookings and verified reviews
  console.log("5. Creating completed bookings & verified reviews...");
  for (const s of createdServices) {
    const { data: existingReview } = await buyerClient
      .from('service_reviews')
      .select('id')
      .eq('service_id', s.id)
      .eq('user_id', buyerUser.id)
      .maybeSingle();

    if (existingReview) {
      console.log(`Review already exists for service: "${s.title}"`);
      continue;
    }

    // Insert booking
    const { data: booking, error: bookErr } = await buyerClient
      .from('bookings')
      .insert({
        user_id: buyerUser.id,
        provider_id: providerUser.id,
        service_id: s.id,
        status: 'completed',
        event_date: '2026-06-12',
        event_time: '20:00:00',
        total_amount: s.price,
        qr_code: `QR-SEED-${s.id.substring(0,6)}-${buyerUser.id.substring(0,6)}`,
        qr_status: 'used',
        qr_validated_at: new Date().toISOString(),
        number_of_people: 80,
        event_type: 'Fiesta de Cumpleaños',
        booking_city: 'Barranquilla'
      })
      .select()
      .single();

    if (bookErr) {
      console.error(`  Error creating booking for "${s.title}":`, bookErr.message);
      continue;
    }

    // Insert verified review linked to completed booking
    const comment = COMMENTS[Math.floor(Math.random() * COMMENTS.length)];
    const { error: reviewErr } = await buyerClient
      .from('service_reviews')
      .insert({
        booking_id: booking.id,
        user_id: buyerUser.id,
        service_id: s.id,
        rating: Math.random() > 0.4 ? 5 : 4,
        comment: comment
      });

    if (reviewErr) {
      console.error(`  Error creating review for "${s.title}":`, reviewErr.message);
    } else {
      console.log(`  Added verified booking & review for "${s.title}" from Laura Gómez`);
    }
  }

  console.log("=== SEEDING COMPLETED SUCCESSFULLY ===");
}

runSeeder();
