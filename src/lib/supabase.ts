/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabaseClient: any;

const isValidUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (e) {
    return false;
  }
};

if (!supabaseUrl || !supabaseAnonKey || !isValidUrl(supabaseUrl)) {
  console.warn('Supabase URL or Anon Key is missing or invalid. Please check your .env file.');
  // Create a mock object that doesn't crash but warns on usage
  supabaseClient = new Proxy({}, {
    get: (target, prop) => {
      return () => {
        console.error(`Supabase property "${String(prop)}" called but client is not initialized because keys are missing.`);
        return { data: null, error: new Error('Supabase client not initialized') };
      };
    }
  });
} else {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = supabaseClient;
