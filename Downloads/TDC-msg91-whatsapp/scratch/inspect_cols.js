import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ivhlsmpxxricfytyswzi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2aGxzbXB4eHJpY2Z5dHlzd3ppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTM0MzI3NywiZXhwIjoyMDkwOTE5Mjc3fQ.Ei5n9CxqZJhUwvAeykiEnPhh8DeT82ys5fR0nBp0ifY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectColumns() {
  const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'profiles' });
  
  if (error) {
    console.log('RPC failed, trying raw query...');
    // Fallback to fetching one row to see keys
    const { data: row, error: rowError } = await supabase.from('profiles').select('*').limit(1);
    if (rowError) {
      console.error('Error:', rowError);
    } else {
      console.log('Keys in profiles row:', Object.keys(row[0] || {}));
    }
    return;
  }
  console.log('Columns:', data);
}

inspectColumns();
