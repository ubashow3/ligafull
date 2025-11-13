import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kurqgwlnrwvgqcpyjxku.supabase.co';
// The Supabase key is now securely managed as an environment variable.
const supabaseKey = process.env.SUPABASE_KEY as string;

// Initialize the Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);
