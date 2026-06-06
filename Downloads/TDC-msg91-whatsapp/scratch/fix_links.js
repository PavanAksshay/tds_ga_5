import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://ivhlsmpxxricfytyswzi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2aGxzbXB4eHJpY2Z5dHlzd3ppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTM0MzI3NywiZXhwIjoyMDkwOTE5Mjc3fQ.Ei5n9CxqZJhUwvAeykiEnPhh8DeT82ys5fR0nBp0ifY';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixLinks() {
  console.log('Fetching profiles...');
  
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, display_name, linkedin_handle, github_handle');

  if (error) {
    console.error('Error fetching profiles:', error);
    return;
  }

  let fixCount = 0;

  for (const profile of profiles) {
    let updatedNeeded = false;
    let oldLinkedIn = profile.linkedin_handle;
    let oldGithub = profile.github_handle;
    
    let newLinkedIn = oldLinkedIn;
    let newGithub = oldGithub;

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

    newLinkedIn = cleanUrl(oldLinkedIn, 'https://www.linkedin.com/in/');
    newGithub = cleanUrl(oldGithub, 'https://github.com/');

    if (newLinkedIn !== oldLinkedIn || newGithub !== oldGithub) {
      console.log(`Fixing profile: ${profile.display_name || profile.id}`);
      if (newLinkedIn !== oldLinkedIn) console.log(`  LinkedIn: ${oldLinkedIn} -> ${newLinkedIn}`);
      if (newGithub !== oldGithub) console.log(`  GitHub: ${oldGithub} -> ${newGithub}`);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          linkedin_handle: newLinkedIn,
          github_handle: newGithub
        })
        .eq('id', profile.id);

      if (updateError) {
        console.error(`  Error updating profile: ${updateError.message}`);
      } else {
        fixCount++;
      }
    }
  }

  console.log(`Finished. Fixed ${fixCount} profiles.`);
}

fixLinks();
