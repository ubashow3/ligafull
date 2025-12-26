
import { createClient } from '@supabase/supabase-js';

// URL do projeto verificado no token (ukdszrnpkulwsljsdmqz)
const supabaseUrl = 'https://ukdszrnpkulwsljsdmqz.supabase.co';

// Nova chave fornecida pelo usuário
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrZHN6cm5wa3Vsd3NsanNkbXF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDYzNjIyNiwiZXhwIjoyMDY2MjEyMjI2fQ._MtIYRHOC5T3BKWQgaidgitcDFUfRixcxF9UyxxhyFA';

// Inicialização do cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseKey);
