import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kurqgwlnrwvgqcpyjxku.supabase.co';
// The anon key is public and safe to use in a browser client.
// Row Level Security (RLS) in Supabase is used to protect your data.
// Using process.env.SUPABASE_KEY here will not work without a build step
// that injects the environment variable into the browser code.
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1cnFnd2xucnd2Z3FjcHlqeGt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNjg2MjIsImV4cCI6MjA3ODY0NDYyMn0.qm-a0b9WuJoylJgMGa-hMPfCZracQd36C0E96W0fx0Q';


// Initialize the Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);