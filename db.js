const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_API_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_KEY || 'placeholder_key';

const supabase = createClient(
  supabaseUrl,
  supabaseKey
);

// Test the connection
if (process.env.SUPABASE_URL && process.env.SUPABASE_API_KEY) {
  supabase
    .from('products')
    .select('*')
    .limit(1)
    .then(({ data, error }) => {
      if (error) console.error('Supabase Connection error:', error.message);
      else console.log('✅ Supabase Connected successfully:', data);
    });
}

module.exports = supabase;
