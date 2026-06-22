/**
 * Bijoutier Pro — Configuration Supabase
 * 
 * INSTRUCTIONS :
 * 1. Va sur https://supabase.com → crée un projet
 * 2. Settings > API → copie l'URL et la clé anon
 * 3. Remplace les valeurs ci-dessous
 * 4. Va dans SQL Editor → colle le contenu de supabase/migrations/001_schema.sql
 */

const SUPABASE_CONFIG = {
  url: 'https://aucnhtbmdlalplkjggkm.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1Y25odGJtZGxhbHBsa2pnZ2ttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwNDk4MDcsImV4cCI6MjA5NzYyNTgwN30.-fOypb_iL_sTosnyo0GZXnxQLUfKzkfe7zzzUofnRbY',
};

// ─── Client Supabase ───
let _supabaseClient = null;

function initSupabase() {
  if (typeof supabase === 'undefined') {
    console.warn('[Supabase] SDK non chargé. Mode hors-ligne.');
    return null;
  }

  if (SUPABASE_CONFIG.url.includes('VOTRE_PROJET')) {
    console.warn('[Supabase] Configuration non remplie. Mode hors-ligne.');
    return null;
  }

  try {
    _supabaseClient = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    console.log('[Supabase] Client initialisé');
    return _supabaseClient;
  } catch (e) {
    console.error('[Supabase] Erreur initialisation:', e);
    return null;
  }
}

function getSupabase() {
  return _supabaseClient;
}
