import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ivhlsmpxxricfytyswzi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2aGxzbXB4eHJpY2Z5dHlzd3ppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTM0MzI3NywiZXhwIjoyMDkwOTE5Mjc3fQ.Ei5n9CxqZJhUwvAeykiEnPhh8DeT82ys5fR0nBp0ifY';

const supabase = createClient(supabaseUrl, supabaseKey);

function cleanUrl(url, base) {
  if (!url) return url;
  let clean = url.trim();
  
  // Remove trailing slashes
  clean = clean.replace(/\/*$/, '');
  
  if (clean === '') return clean;

  // Check if it's already a full URL
  if (clean.startsWith('http')) {
    return clean;
  }

  // If it starts with a slash, remove it first
  if (clean.startsWith('/')) {
    clean = clean.substring(1);
  }
  
  // If it still contains "linkedin.com" or "github.com" but missing https
  if (clean.includes('linkedin.com') || clean.includes('github.com')) {
    return `https://${clean.replace(/^https?:\/\//, '')}`;
  }

  // It's likely just a handle or /handle
  return `${base}${clean}`;
}

async function fixTable(tableName, idCol = 'id') {
  console.log(`Fetching from ${tableName}...`);
  
  const { data: rows, error } = await supabase
    .from(tableName)
    .select(`${idCol}, display_name, linkedin_handle, github_handle`);

  if (error) {
    console.error(`Error fetching from ${tableName}:`, error);
    return;
  }

  let fixCount = 0;

  for (const row of rows) {
    let oldLinkedIn = row.linkedin_handle;
    let oldGithub = row.github_handle;
    
    let newLinkedIn = cleanUrl(oldLinkedIn, 'https://www.linkedin.com/in/');
    let newGithub = cleanUrl(oldGithub, 'https://github.com/');

    if (newLinkedIn !== oldLinkedIn || newGithub !== oldGithub) {
      const { error: updateError } = await supabase
        .from(tableName)
        .update({
          linkedin_handle: newLinkedIn,
          github_handle: newGithub
        })
        .eq(idCol, row[idCol]);

      if (!updateError) {
        fixCount++;
      }
    }
  }

  console.log(`Cleaned ${fixCount} records in ${tableName}.`);
}

async function runFix() {
  await fixTable('profiles');
  await fixTable('career_applications');
  console.log('All tables cleaned.');
}

runFix();
