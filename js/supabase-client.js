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

// Vérifie la connexion réelle (lecture légère sur une table existante).
// Renvoie une promesse { ok, error } — tout est capturé, jamais d'exception non gérée.
async function supabaseHealthCheck() {
  const client = _supabaseClient || initSupabase();
  if (!client) return { ok: false, error: 'SDK/Config absent' };
  try {
    const { error } = await client.from('clients').select('id', { count: 'exact', head: true });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// ─── Sync par snapshot : l'état complet de l'app dans une ligne de la table app_state ───
const APP_STATE_ID = 'main';

// Tire l'état distant. Renvoie { ok, data } : ok=false si la table n'existe pas encore.
async function cloudPull() {
  const client = _supabaseClient || initSupabase();
  if (!client) return { ok: false, data: null };
  try {
    const { data, error } = await client.from('app_state').select('data, updated_at').eq('id', APP_STATE_ID).maybeSingle();
    if (error) return { ok: false, data: null, error: error.message };
    return { ok: true, data: data ? data.data : null };
  } catch (e) {
    return { ok: false, data: null, error: e.message };
  }
}

// Pousse l'état complet (upsert). Renvoie true/false, tout est capturé.
async function cloudPush(stateObj) {
  const client = _supabaseClient || initSupabase();
  if (!client) return false;
  try {
    const { error } = await client.from('app_state').upsert({
      id: APP_STATE_ID, data: stateObj, updated_at: new Date().toISOString(),
    });
    return !error;
  } catch (e) {
    return false;
  }
}

// Abonnement temps réel aux changements de l'état partagé.
function cloudSubscribe(onChange) {
  const client = _supabaseClient || initSupabase();
  if (!client) return null;
  try {
    return client
      .channel('app_state_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_state', filter: 'id=eq.' + APP_STATE_ID }, p => {
        try { onChange && onChange(p); } catch (e) { console.warn('[Supabase] sync handler:', e); }
      })
      .subscribe();
  } catch (e) {
    console.warn('[Supabase] subscribe app_state impossible:', e.message);
    return null;
  }
}

// Abonnement temps réel aux sorties d'or déclarées par les artisans (table demandes_sortie).
// No-op silencieux si le client/la table n'existent pas encore. Retourne le channel (ou null).
function subscribeDemandesSortie(onChange) {
  const client = _supabaseClient || initSupabase();
  if (!client) return null;
  try {
    const channel = client
      .channel('demandes_sortie_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'demandes_sortie' }, payload => {
        try { onChange && onChange(payload); } catch (e) { console.warn('[Supabase] handler:', e); }
      })
      .subscribe();
    return channel;
  } catch (e) {
    console.warn('[Supabase] subscribe demandes_sortie impossible:', e.message);
    return null;
  }
}
