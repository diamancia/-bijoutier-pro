/**
 * Bijoutier Pro — Store Central
 * P01 : Gestion centralisée des données avec événements, persistance locale, et sync Supabase
 */

const BijoutierStore = (() => {
  // ─── ÉTAT CENTRAL ───
  const _state = {
    config: {
      coursActif: null,        // référence vers le dernier cours validé
      devise: 'MAD',
      puretés: { '24K': 1, '22K': 0.916, '18K': 0.75, '14K': 0.585, '9K': 0.375 },
    },
    coursOr: [],               // { id, date, cours_mad_g, carat_saisi, cours_saisi, vendeur, quantite_g, valide, created_at }
    achatsDivers: [],          // { id, categorie, poids_g, carat, prix_achat_mad_g, cours_18k_applique, poids_18k_equiv_g, cout_mad, valeur_marche_mad, gain_mad, date, created_at }
    clients: [],               // { id, nom, telephone, bijouterie, tarif_prestation, created_at }
    commandes: [],             // { id, client_id, type, poids_or_g, purete, pierres, taille, date_depot_or, date_livraison_prevue, date_livraison_effective, statut, tarif_prestation, type_metal, prix_modele_3d_mad, honoraires_mad, or_prete_g, piece_id, notes, created_at }
    stock: {
      propre: [],              // { id, poids_g, purete, source, date, notes }
      client: [],              // { id, client_id, commande_id, poids_g, purete, date_depot, date_sortie }
      atelier: [],             // { id, type, categorie:'atelier', poids_g, purete, piece_id, artisan_id, poids_perte_g, source, cours_applique, date, notes }
    },
    balayures: [],             // { id, type, poids_initial_g, poids_traite_g, poids_pur_24k_g, cours_applique, valeur_mad, date, created_at }
    raffinages: [],            // { id, quantite_24k_g, purete_cible, quantite_resultat_g, cours_applique, valeur_mad, date, created_at }
    caisseSnapshots: [],       // { id, type_transaction, poids_g, cours_applique, montant_mad, commande_id, date, heure, created_at }
    articles: [],              // { id, nom, poids_or_g, taille, type_pierres, photo_url, created_at }
    pieces: [],                // { id, commande_id, client_id, type_metal, poids_initial_g, poids_actuel_g, purete, statut, localisation_actuelle, artisan_actuel_id, etapes_artisan_requises, douane_requise, date_creation, date_finition, date_sortie_finale, created_at }
    creditsClient: [],         // { id, client_id, commande_id, type, montant_mad, poids_or_g, cours_applique, date, notes, created_at }
    artisans: [],              // { id, nom, competences, telephone, actif, created_at }
    alertes: [],               // générées dynamiquement, pas persistées
  };

  // ─── SYSTÈME D'ÉVÉNEMENTS ───
  const _listeners = {};

  function on(event, callback) {
    if (!_listeners[event]) _listeners[event] = [];
    _listeners[event].push(callback);
    return () => { _listeners[event] = _listeners[event].filter(cb => cb !== callback); };
  }

  function emit(event, data) {
    if (_listeners[event]) {
      _listeners[event].forEach(cb => {
        try { cb(data); } catch (e) { console.error(`[Store] Erreur listener ${event}:`, e); }
      });
    }
    // Événement global pour le dashboard
    if (event !== 'state:changed') {
      emit('state:changed', { source: event, data });
    }
  }

  // ─── GÉNÉRATEUR D'ID ───
  function generateId(prefix = '') {
    const ts = Date.now().toString(36);
    const rand = Math.random().toString(36).substring(2, 7);
    return prefix ? `${prefix}_${ts}_${rand}` : `${ts}_${rand}`;
  }

  // ─── CRUD GÉNÉRIQUE ───
  function getCollection(name) {
    if (name === 'stock_propre') return _state.stock.propre;
    if (name === 'stock_client') return _state.stock.client;
    if (name === 'stock_atelier') return _state.stock.atelier;
    if (_state[name] !== undefined && Array.isArray(_state[name])) return _state[name];
    console.warn(`[Store] Collection inconnue: ${name}`);
    return null;
  }

  function getAll(collection) {
    const col = getCollection(collection);
    return col ? [...col] : [];
  }

  function getById(collection, id) {
    const col = getCollection(collection);
    return col ? col.find(item => item.id === id) || null : null;
  }

  function query(collection, filterFn) {
    const col = getCollection(collection);
    return col ? col.filter(filterFn) : [];
  }

  function add(collection, data) {
    const col = getCollection(collection);
    if (!col) return null;

    const item = {
      id: generateId(collection.substring(0, 3)),
      ...data,
      created_at: new Date().toISOString(),
    };

    col.push(item);
    _persist();
    emit(`${collection}:added`, item);
    return item;
  }

  function update(collection, id, updates) {
    const col = getCollection(collection);
    if (!col) return null;

    const index = col.findIndex(item => item.id === id);
    if (index === -1) return null;

    const updated = { ...col[index], ...updates, updated_at: new Date().toISOString() };
    col[index] = updated;
    _persist();
    emit(`${collection}:updated`, updated);
    return updated;
  }

  function remove(collection, id) {
    const col = getCollection(collection);
    if (!col) return false;

    const index = col.findIndex(item => item.id === id);
    if (index === -1) return false;

    const removed = col.splice(index, 1)[0];
    _persist();
    emit(`${collection}:removed`, removed);
    return true;
  }

  // ─── ACCESSEURS SPÉCIALISÉS ───
  function getCoursActif() {
    const validés = _state.coursOr.filter(c => c.valide).sort((a, b) => new Date(b.date) - new Date(a.date));
    return validés.length > 0 ? validés[0] : null;
  }

  function getCoursActifValeur() {
    const cours = getCoursActif();
    return cours ? cours.cours_mad_g : 0;
  }

  function getConfig() {
    return { ..._state.config };
  }

  function setConfig(key, value) {
    _state.config[key] = value;
    _persist();
    emit('config:updated', { key, value });
  }

  // ─── PERSISTANCE LOCALE ───
  const STORAGE_KEY = 'bijoutier_pro_data';
  // Incrémenter à chaque changement de schéma : invalide les données locales obsolètes
  const SCHEMA_VERSION = 5;

  function _persist() {
    try {
      const toSave = {
        _schemaVersion: SCHEMA_VERSION,
        coursOr: _state.coursOr,
        achatsDivers: _state.achatsDivers,
        clients: _state.clients,
        commandes: _state.commandes,
        stock: _state.stock,
        balayures: _state.balayures,
        raffinages: _state.raffinages,
        caisseSnapshots: _state.caisseSnapshots,
        articles: _state.articles,
        pieces: _state.pieces,
        creditsClient: _state.creditsClient,
        artisans: _state.artisans,
        config: _state.config,
        _lastSaved: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (e) {
      console.error('[Store] Erreur persistance:', e);
    }
  }

  function _restore() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return false;

      const data = JSON.parse(saved);
      // Données d'une version antérieure → on les ignore et on repart des données seed
      if (data._schemaVersion !== SCHEMA_VERSION) {
        localStorage.removeItem(STORAGE_KEY);
        console.log('[Store] Schéma obsolète, réinitialisation des données locales');
        return false;
      }
      if (data.coursOr) _state.coursOr = data.coursOr;
      if (data.achatsDivers) _state.achatsDivers = data.achatsDivers;
      if (data.clients) _state.clients = data.clients;
      if (data.commandes) _state.commandes = data.commandes;
      if (data.stock) _state.stock = data.stock;
      if (!_state.stock.atelier) _state.stock.atelier = [];
      if (data.balayures) _state.balayures = data.balayures;
      if (data.raffinages) _state.raffinages = data.raffinages;
      if (data.caisseSnapshots) _state.caisseSnapshots = data.caisseSnapshots;
      if (data.articles) _state.articles = data.articles;
      if (data.pieces) _state.pieces = data.pieces;
      if (data.creditsClient) _state.creditsClient = data.creditsClient;
      if (data.artisans) _state.artisans = data.artisans;
      if (data.config) Object.assign(_state.config, data.config);

      console.log('[Store] Données restaurées depuis localStorage');
      return true;
    } catch (e) {
      console.error('[Store] Erreur restauration:', e);
      return false;
    }
  }

  function clearAll() {
    _state.coursOr = [];
    _state.achatsDivers = [];
    _state.clients = [];
    _state.commandes = [];
    _state.stock = { propre: [], client: [], atelier: [] };
    _state.balayures = [];
    _state.raffinages = [];
    _state.caisseSnapshots = [];
    _state.articles = [];
    _state.pieces = [];
    _state.creditsClient = [];
    _state.artisans = [];
    _state.alertes = [];
    localStorage.removeItem(STORAGE_KEY);
    emit('store:cleared', {});
  }

  // ─── SYNC SUPABASE (préparé, implémenté dans P03+) ───
  let _supabase = null;
  let _syncEnabled = false;
  let _offlineQueue = [];

  function connectSupabase(supabaseClient) {
    _supabase = supabaseClient;
    _syncEnabled = true;
    emit('sync:connected', {});
    console.log('[Store] Supabase connecté');
  }

  function isOnline() {
    return _syncEnabled && _supabase !== null;
  }

  function queueOfflineAction(action) {
    _offlineQueue.push({ ...action, queued_at: new Date().toISOString() });
    try {
      localStorage.setItem(STORAGE_KEY + '_queue', JSON.stringify(_offlineQueue));
    } catch (e) { /* ignore */ }
    emit('sync:queued', { pending: _offlineQueue.length });
  }

  function getOfflineQueue() {
    return [..._offlineQueue];
  }

  async function flushOfflineQueue() {
    if (!isOnline() || _offlineQueue.length === 0) return 0;
    let flushed = 0;
    // Implémentation dans le module Supabase
    emit('sync:flushing', { total: _offlineQueue.length });
    return flushed;
  }

  // ─── INITIALISATION ───
  function init(seedData = null) {
    const restored = _restore();

    if (!restored && seedData) {
      // Charger les données de démo / migration
      Object.keys(seedData).forEach(key => {
        if (_state[key] !== undefined) {
          if (Array.isArray(_state[key]) && Array.isArray(seedData[key])) {
            _state[key] = seedData[key];
          } else if (typeof _state[key] === 'object' && typeof seedData[key] === 'object') {
            Object.assign(_state[key], seedData[key]);
          }
        }
      });
      _persist();
      console.log('[Store] Initialisé avec données seed');
    }

    emit('store:initialized', { restored, itemCount: _countItems() });
    return { restored };
  }

  function _countItems() {
    return {
      coursOr: _state.coursOr.length,
      achatsDivers: _state.achatsDivers.length,
      clients: _state.clients.length,
      commandes: _state.commandes.length,
      balayures: _state.balayures.length,
      raffinages: _state.raffinages.length,
      caisseSnapshots: _state.caisseSnapshots.length,
      articles: _state.articles.length,
      pieces: _state.pieces.length,
      creditsClient: _state.creditsClient.length,
      artisans: _state.artisans.length,
    };
  }

  // ─── API PUBLIQUE ───
  return {
    // Initialisation
    init,
    clearAll,

    // CRUD
    getAll,
    getById,
    query,
    add,
    update,
    remove,

    // Accesseurs
    getCoursActif,
    getCoursActifValeur,
    getConfig,
    setConfig,

    // Événements
    on,

    // Sync
    connectSupabase,
    isOnline,
    queueOfflineAction,
    getOfflineQueue,
    flushOfflineQueue,

    // Debug
    _debug: () => JSON.parse(JSON.stringify(_state)),
    _countItems,
  };
})();
