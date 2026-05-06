/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabaseClient: any;

const isValidUrl = (url: string) => {
  try {
    if (!url) return false;
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (e) {
    return false;
  }
};

if (!supabaseUrl || !supabaseAnonKey || !isValidUrl(supabaseUrl)) {
  console.warn('Supabase URL or Anon Key is missing or invalid. Check your .env file or credentials.');
  // Create a mock object that doesn't crash but warns on usage
  supabaseClient = new Proxy({}, {
    get: (target, prop) => {
      if (prop === 'storage' || prop === 'auth' || prop === 'from') {
        return () => ({
          upload: async () => ({ data: null, error: new Error('Supabase client not initialized') }),
          select: () => ({ error: new Error('Supabase client not initialized') }),
          insert: () => ({ error: new Error('Supabase client not initialized') }),
          signInWithPassword: async () => ({ data: null, error: new Error('Supabase client not initialized') }),
          signUp: async () => ({ data: null, error: new Error('Supabase client not initialized') }),
        });
      }
      return () => {
        console.error(`Supabase property "${String(prop)}" called but client is not initialized.`);
        return { data: null, error: new Error('Supabase client not initialized') };
      };
    }
  });
} else {
  console.log('Initializing Supabase client with URL:', supabaseUrl);
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = supabaseClient;
