import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(url, key);

async function run() {
  const { data, error } = await supabase.from('blog_views').select('*').limit(10);
  console.log('blog_views data:', JSON.stringify(data, null, 2));
  console.log('error:', error);
}

run();
