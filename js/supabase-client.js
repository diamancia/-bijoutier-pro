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
  url: 'https://VOTRE_PROJET.supabase.co',     // ← remplacer
  anonKey: 'VOTRE_CLE_ANON_ICI',               // ← remplacer
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
