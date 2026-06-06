import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ivhlsmpxxricfytyswzi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2aGxzbXB4eHJpY2Z5dHlzd3ppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTM0MzI3NywiZXhwIjoyMDkwOTE5Mjc3fQ.Ei5n9CxqZJhUwvAeykiEnPhh8DeT82ys5fR0nBp0ifY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkApps() {
  console.log('Checking applications structure...');
  const { data: row, error } = await supabase.from('applications').select('*').limit(1);
  if (error) {
    console.error(error);
    return;
  }
  console.log('Keys in applications row:', Object.keys(row[0] || {}));
}

checkApps();
