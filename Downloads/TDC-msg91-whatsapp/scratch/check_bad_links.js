import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ivhlsmpxxricfytyswzi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2aGxzbXB4eHJpY2Z5dHlzd3ppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTM0MzI3NywiZXhwIjoyMDkwOTE5Mjc3fQ.Ei5n9CxqZJhUwvAeykiEnPhh8DeT82ys5fR0nBp0ifY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBad() {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, display_name, linkedin_handle, github_handle');

  if (error) {
    console.error(error);
    return;
  }

  const bad = profiles.filter(p => 
    (p.linkedin_handle && !p.linkedin_handle.startsWith('https://')) ||
    (p.github_handle && !p.github_handle.startsWith('https://'))
  );

  console.log(`Remaining profiles with non-https links: ${bad.length}`);
  bad.slice(0, 10).forEach(p => {
    console.log(`- ${p.display_name || p.id}: LI: ${p.linkedin_handle}, GH: ${p.github_handle}`);
  });
}

checkBad();
