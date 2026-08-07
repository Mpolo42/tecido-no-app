import { createClient } from '@supabase/supabase-js';

// Substitua pelas chaves do seu projeto no Supabase
const SUPABASE_URL = 'https://seu-projeto.supabase.co';
const SUPABASE_ANON_KEY = 'sua-chave-anonima-aqui';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);