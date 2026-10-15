const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ouibyflexyntquwptkhh.supabase.co';
const supabaseKey = 'sb_publishable_Q2nGAVHUY2In3SY6bF3-Xg_tg2JR5EZ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function runDiagnostic() {
  console.log('====================================================');
  console.log('DIAGNÓSTICO ISLADO DE LECTURA EN PUBLIC.PROFILES');
  console.log('====================================================\n');

  // 1. Comprobar sesión de autenticación
  console.log('1. COMPROBACIÓN DE SESIÓN Y AUTENTICACIÓN:');
  const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
  
  if (sessionErr) {
    console.log('  - Session Error:', sessionErr.message);
  } else {
    const session = sessionData?.session;
    if (session) {
      console.log('  - Sesión activa encontrada.');
      console.log('  - User ID:', session.user?.id);
      console.log('  - User Email:', session.user?.email);

      // Comprobar si el usuario autenticado tiene perfil en public.profiles
      const { data: userProfileData, error: userProfileErr } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, city, role, provider_type')
        .eq('id', session.user.id)
        .maybeSingle();

      if (userProfileErr) {
        console.log('  - Error consultando perfil del usuario autenticado:', userProfileErr.message);
      } else if (userProfileData) {
        console.log('  - Perfil del usuario autenticado EXISTE:', userProfileData);
      } else {
        console.log('  - Perfil del usuario autenticado NO EXISTE en public.profiles.');
      }
    } else {
      console.log('  - No existe sesión activa en la prueba aislada (Cliente Anónimo).');
    }
  }

  // 2. Consulta directa a public.profiles SIN NINGÚN FILTRO
  console.log('\n2. CONSULTA DIRECTA A PUBLIC.PROFILES SIN FILTROS:');
  console.log('  Campos solicitados: id, full_name, username, avatar_url, city, role, provider_type');

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, full_name, username, avatar_url, city, role, provider_type');

  if (error) {
    console.log('\n  [!] HUBO UN ERROR DE SUPABASE:');
    console.log('  - error.message:', error.message);
    console.log('  - error.code:', error.code);
    console.log('  - error.details:', error.details);
    console.log('  - error.hint:', error.hint);
  } else {
    console.log('\n  [✓] CONSULTA EXITOSA (Sin errores de Supabase)');
    console.log('  - Cantidad de perfiles recibidos:', profiles ? profiles.length : 0);

    if (profiles && profiles.length > 0) {
      console.log('\n  DETALLE DE PERFILES RECIBIDOS:');
      profiles.forEach((p, idx) => {
        console.log(`  Profile #${idx + 1}:`);
        console.log(`    - ID:            ${p.id}`);
        console.log(`    - Full Name:     ${p.full_name || 'NULL/Vacio'}`);
        console.log(`    - Username:      ${p.username || 'NULL/Vacio'}`);
        console.log(`    - City:          ${p.city || 'NULL/Vacio'}`);
        console.log(`    - Role:          ${p.role || 'NULL/Vacio'}`);
        console.log(`    - Provider Type: ${p.provider_type || 'NULL/Vacio'}`);
        console.log(`    - Avatar URL:    ${p.avatar_url || 'NULL/Vacio'}`);
      });
    } else {
      console.log('\n  [!] La consulta no devolvió ningún registro (0 perfiles).');
    }
  }

  console.log('\n====================================================');
}

runDiagnostic();
