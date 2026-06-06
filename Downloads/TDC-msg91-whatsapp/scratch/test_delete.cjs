const { createClient } = require('@supabase/supabase-js');
const fs = require('node:fs');

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

async function tryHardDelete() {
  const userId = 'e69c963d-e718-4eb8-b749-d901cd78abcc';
  
  // Try deleting from profiles first
  console.log(`Attempting to delete profile ${userId}...`);
  const { error: profileError } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userId);

  if (profileError) {
    console.error('Profile deletion failed:', profileError.message);
    console.error('Detail:', profileError.details);
  } else {
    console.log('Profile deleted successfully.');
  }

  // Try deleting from auth
  console.log(`Attempting to delete auth user ${userId}...`);
  const { error: authError } = await supabase.auth.admin.deleteUser(userId);

  if (authError) {
    console.error('Auth deletion failed:', authError.message);
  } else {
    console.log('Auth user deleted successfully.');
  }
}

tryHardDelete();
