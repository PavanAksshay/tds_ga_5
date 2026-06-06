const { createClient } = require('@supabase/supabase-js');
const fs = require('node:fs');

// Simple env parser
const env = fs.readFileSync('.env', 'utf8')
  .split('\n')
  .reduce((acc, line) => {
    const [key, ...val] = line.split('=');
    if (key && val.length > 0) acc[key.trim()] = val.join('=').trim();
    return acc;
  }, {});

const supabase = createClient(
  env.SUPABASE_PROJECT_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

async function findUser() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, display_name, created_at')
    .or('display_name.ilike.%lassya%,display_name.ilike.%kotian%');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(JSON.stringify(data, null, 2));
}

findUser();
