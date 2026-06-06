const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_PROJECT_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function findUser() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, display_name')
    .or('display_name.ilike.%lassya%,email.ilike.%lassya%');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Found users:', data);
}

findUser();
