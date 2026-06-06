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

async function checkFKs() {
  const { data, error } = await supabase.rpc('get_table_referencing_user', { target_user_id: 'e69c963d-e718-4eb8-b749-d901cd78abcc' });
  // Since we don't have this RPC, we'll try to delete and see where it fails, or search the codebase for FK definitions.
  // Codebase approach: search for "REFERENCES profiles" in SQL if available.
}

async function tryDelete() {
  const userId = 'e69c963d-e718-4eb8-b749-d901cd78abcc';
  console.log(`Checking rows for user ${userId}...`);
  
  const tables = [
    'admin_approval_queue', 'applications', 'admin_audit_log', 
    'xp_log', 'user_contributions', 'career_applications', 'project_ideas'
  ];

  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
      .or(`user_id.eq.${userId},requested_by.eq.${userId},admin_id.eq.${userId}`);
    
    if (count > 0) {
      console.log(`Table ${table} has ${count} matching rows.`);
    }
  }
}

tryDelete();
