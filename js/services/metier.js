/**
 * Bijoutier Pro — Services Métier
 * Logique pure sans accès DOM. Utilise BijoutierStore pour les données.
 */

// ═══════════════════════════════════════════
// COURS SERVICE
// ═══════════════════════════════════════════
const CoursService = {
  getCours() {
    return BijoutierStore.getCoursActifValeur();
  },

  // Cours équivalent 18k (75% du cours 24k) — base de calcul des achats divers
  getCours18k() {
    const config = BijoutierStore.getConfig();
    return this.getCours() * (config.puretés['18K'] || 0.75);
  },

  getCoursActif() {
    return BijoutierStore.getCoursActif();
  },

  getHistorique(jours = 30) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - jours);
    return BijoutierStore.query('coursOr', c => new Date(c.date) >= cutoff)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  getVariation() {
    const hist = BijoutierStore.getAll('coursOr')
      .filter(c => c.valide)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    if (hist.length < 2) return { absolue: 0, pourcent: 0 };
    const diff = hist[0].cours_mad_g - hist[1].cours_mad_g;
    return {
      absolue: diff,
      pourcent: ((diff / hist[1].cours_mad_g) * 100).toFixed(1),
    };
  },

  // Enregistre un cours. Le carat saisi (18K/24K) détermine la conversion :
  // on stocke toujours cours_mad_g en équivalent-24k pour la cohérence de toute l'app.
  ajouterCours(data) {
    const config = BijoutierStore.getConfig();
    const carat = data.carat_saisi || '24K';
    const facteur = config.puretés[carat] || 1;
    const cours24k = facteur > 0 ? data.cours_saisi / facteur : data.cours_saisi;
    return BijoutierStore.add('coursOr', {
      date: data.date,
      cours_mad_g: Math.round(cours24k * 100) / 100,
      carat_saisi: carat,
      cours_saisi: data.cours_saisi,
      vendeur: data.vendeur || '',
      quantite_g: data.quantite_g || 0,
      valide: data.valide !== undefined ? data.valide : true,
    });
  },

  validerCours(id) {
    return BijoutierStore.update('coursOr', id, { valide: true });
  },

  convertirMAD(poids_g, purete = '24K') {
    const cours = this.getCours();
    const config = BijoutierStore.getConfig();
    const facteur = config.puretés[purete] || 1;
    return poids_g * cours * facteur;
  },

  // « argent » désigne un paiement en cash (pas le métal) : simple conversion MAD → équivalent-or
  convertirCashEnOr(montantMad) {
    if (!montantMad) return 0;
    const cours = this.getCours();
    return cours > 0 ? montantMad / cours : 0;
  },
};

// ═══════════════════════════════════════════
// CLIENT SERVICE
// ═══════════════════════════════════════════
const ClientService = {
  getAll() {
    return BijoutierStore.getAll('clients');
  },

  getById(id) {
    return BijoutierStore.getById('clients', id);
  },

  rechercher(query) {
    const q = query.toLowerCase();
    return BijoutierStore.query('clients', c =>
      c.nom.toLowerCase().includes(q) ||
      (c.telephone && c.telephone.includes(q)) ||
      (c.bijouterie && c.bijouterie.toLowerCase().includes(q))
    );
  },

  ajouter(data) {
    return BijoutierStore.add('clients', {
      nom: data.nom,
      telephone: data.telephone || '',
      bijouterie: data.bijouterie || '',
      tarif_prestation: data.tarif_prestation || 100,
      notes: data.notes || '',
      actif: true,
    });
  },

  modifier(id, updates) {
    return BijoutierStore.update('clients', id, updates);
  },

  getCommandes(clientId) {
    return BijoutierStore.query('commandes', c => c.client_id === clientId)
      .sort((a, b) => new Date(b.date_depot_or) - new Date(a.date_depot_or));
  },

  getTarifPrestation(clientId) {
    const client = this.getById(clientId);
    return client ? client.tarif_prestation : 100;
  },

  getCA(clientId) {
    const livrees = BijoutierStore.query('commandes',
      c => c.client_id === clientId && c.statut === 'livree'
    );
    return livrees.reduce((sum, c) => sum + (c.tarif_prestation || 0), 0);
  },
};

// ═══════════════════════════════════════════
// COMMANDE SERVICE
// ═══════════════════════════════════════════
const CommandeService = {
  getAll() {
    return BijoutierStore.getAll('commandes');
  },

  getById(id) {
    return BijoutierStore.getById('commandes', id);
  },

  getEnCours() {
    return BijoutierStore.query('commandes', c => c.statut === 'en_cours')
      .sort((a, b) => new Date(a.date_livraison_prevue) - new Date(b.date_livraison_prevue));
  },

  getLivrees() {
    return BijoutierStore.query('commandes', c => c.statut === 'livree');
  },

  creer(data) {
    const client = ClientService.getById(data.client_id);
    if (!client) return null;

    const typeMetal = data.type_metal || 'or';
    const purete = data.purete || '18K';
    const honoraires = data.honoraires_mad != null ? data.honoraires_mad : client.tarif_prestation;
    const prixModele = data.prix_modele_3d_mad || 0;

    // Règle module 1 : si argent (= paiement cash) → conversion en équivalent-or au cours actif
    const poidsOrEquivalent = typeMetal === 'argent'
      ? CoursService.convertirCashEnOr(data.montant_cash_mad || 0)
      : data.poids_or_g;

    // Poids nécessaire à la fabrication de la pièce (peut dépasser ce que le client a apporté)
    const poidsNecessaire = data.poids_necessaire_g || poidsOrEquivalent;

    const commande = BijoutierStore.add('commandes', {
      client_id: data.client_id,
      type: data.type,
      poids_or_g: poidsOrEquivalent,
      purete,
      pierres: data.pierres || 'Sans pierres',
      taille: data.taille || '',
      couleur_or: data.couleur_or || 'Jaune',
      date_depot_or: data.date_depot_or,
      date_livraison_prevue: data.date_livraison_prevue,
      date_livraison_effective: null,
      statut: 'en_cours',
      tarif_prestation: client.tarif_prestation,
      type_metal: typeMetal,
      prix_modele_3d_mad: prixModele,
      honoraires_mad: honoraires,
      or_prete_g: 0,
      piece_id: null,
      cours_depot: CoursService.getCours(),
      notes: data.notes || '',
    });

    // Mouvement stock client : dépôt (toujours tracé en équivalent-or)
    StockService.mouvementer({
      type: 'depot_client',
      categorie: 'client',
      poids_g: poidsOrEquivalent,
      purete,
      source: `Commande ${commande.id}`,
      client_id: data.client_id,
      commande_id: commande.id,
    });

    // Règle module 1 : si or insuffisant → compléter via coffre (devient une dette : crédit client)
    const manque = poidsNecessaire - poidsOrEquivalent;
    if (manque > 0.001) {
      CoffreService.completerOrPourCommande(commande.id, data.client_id, manque, purete);
      BijoutierStore.update('commandes', commande.id, { or_prete_g: manque });
    }

    // Crédit client mis à jour : modèle 3D + honoraires
    CreditService.chargerModele3D(commande.id, data.client_id, prixModele);
    CreditService.chargerHonoraires(commande.id, data.client_id, honoraires);

    // Création de la pièce liée : point d'entrée du pipeline atelier
    const piece = BijoutierStore.add('pieces', {
      commande_id: commande.id,
      client_id: data.client_id,
      type_metal: typeMetal,
      poids_initial_g: poidsNecessaire,
      poids_actuel_g: poidsNecessaire,
      purete,
      statut: 'creee',
      localisation_actuelle: 'commande',
      artisan_actuel_id: null,
      etapes_artisan_requises: data.etapes_artisan_requises || [],
      douane_requise: false,
      date_creation: new Date().toISOString().split('T')[0],
      date_finition: null,
      date_sortie_finale: null,
    });
    CoffreService.recevoirPiece(piece.id);
    BijoutierStore.update('commandes', commande.id, { piece_id: piece.id });

    return BijoutierStore.getById('commandes', commande.id);
  },

  // poidsLivraison : poids effectif du bijou livré (défaut = poids déposé). Le gain (±g) en découle.
  livrer(id, poidsLivraison = null) {
    const cmd = this.getById(id);
    if (!cmd || cmd.statut !== 'en_cours') return null;

    const today = new Date().toISOString().split('T')[0];
    const poidsLivre = poidsLivraison != null ? poidsLivraison : cmd.poids_or_g;
    const updated = BijoutierStore.update('commandes', id, {
      statut: 'livree',
      date_livraison_effective: today,
      poids_livraison_g: poidsLivre,
      gain_g: poidsLivre - cmd.poids_or_g,
    });

    // Mouvement stock client : sortie
    StockService.mouvementer({
      type: 'sortie_client',
      categorie: 'client',
      poids_g: poidsLivre,
      purete: cmd.purete,
      source: `Livraison ${cmd.id}`,
      client_id: cmd.client_id,
      commande_id: cmd.id,
    });

    // Snapshot caisse
    CaisseService.snapshot({
      type_transaction: 'Livraison commande',
      poids_g: poidsLivre,
      montant_mad: cmd.tarif_prestation,
      commande_id: cmd.id,
      client_id: cmd.client_id,
      sens: 'entree',
    });

    return updated;
  },

  setRegle(id, valeur) {
    return BijoutierStore.update('commandes', id, { regle: !!valeur });
  },

  setPoinconDouane(id, valeur) {
    return BijoutierStore.update('commandes', id, { poincon_douane: !!valeur });
  },

  // Récap des commandes d'un client groupées par catégorie (nb + poids total)
  getRecapClient(clientId) {
    const cmds = BijoutierStore.query('commandes', c => c.client_id === clientId);
    const parType = {};
    cmds.forEach(c => {
      if (!parType[c.type]) parType[c.type] = { type: c.type, nombre: 0, poids_total_g: 0 };
      parType[c.type].nombre += 1;
      parType[c.type].poids_total_g += (c.poids_or_g || 0);
    });
    return {
      categories: Object.values(parType).sort((a, b) => b.nombre - a.nombre),
      total_commandes: cmds.length,
      total_poids_g: cmds.reduce((s, c) => s + (c.poids_or_g || 0), 0),
    };
  },

  // Répartition du volume (grammes d'or) par client, avec part en %
  repartitionGrammesParClient() {
    const lignes = ClientService.getAll().map(c => {
      const cmds = BijoutierStore.query('commandes', x => x.client_id === c.id);
      const grammes = cmds.reduce((s, x) => s + (x.poids_or_g || 0), 0);
      return { client: c, grammes };
    }).filter(l => l.grammes > 0).sort((a, b) => b.grammes - a.grammes);
    const total = lignes.reduce((s, l) => s + l.grammes, 0);
    return lignes.map(l => ({ ...l, pourcent: total > 0 ? (l.grammes / total) * 100 : 0 }));
  },

  getJoursRestants(commande) {
    if (commande.statut === 'livree') return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const prevue = new Date(commande.date_livraison_prevue);
    return Math.ceil((prevue - today) / (1000 * 60 * 60 * 24));
  },

  getNiveauAlerte(commande) {
    const jours = this.getJoursRestants(commande);
    if (jours === null) return 'ok';
    if (jours < 0) return 'retard';
    if (jours <= 2) return 'urgent';
    return 'normal';
  },
};

// ═══════════════════════════════════════════
// STOCK SERVICE ("Mon Trésor")
// ═══════════════════════════════════════════
const StockService = {
  mouvementer(data) {
    let collName = 'stock_client';
    if (data.categorie === 'propre') collName = 'stock_propre';
    else if (data.categorie === 'atelier') collName = 'stock_atelier';
    return BijoutierStore.add(collName, {
      type: data.type,
      poids_g: data.poids_g,
      purete: data.purete || '24K',
      source: data.source || '',
      client_id: data.client_id || null,
      commande_id: data.commande_id || null,
      piece_id: data.piece_id || null,
      artisan_id: data.artisan_id || null,
      poids_perte_g: data.poids_perte_g ?? null,
      cours_applique: CoursService.getCours(),
      date: data.date || new Date().toISOString().split('T')[0],
      notes: data.notes || '',
    });
  },

  getStockPropre() {
    const mouvements = BijoutierStore.getAll('stock_propre');
    const parPurete = {};
    mouvements.forEach(m => {
      if (!parPurete[m.purete]) parPurete[m.purete] = 0;
      if (['entree_propre', 'balayure', 'raffinage'].includes(m.type)) {
        parPurete[m.purete] += m.poids_g;
      } else if (m.type === 'sortie_propre') {
        parPurete[m.purete] -= m.poids_g;
      }
    });
    return parPurete;
  },

  getStockClient() {
    const mouvements = BijoutierStore.getAll('stock_client');
    const parClient = {};
    mouvements.forEach(m => {
      const key = m.client_id || 'inconnu';
      if (!parClient[key]) parClient[key] = { total_g: 0, details: [] };
      if (m.type === 'depot_client') {
        parClient[key].total_g += m.poids_g;
      } else if (m.type === 'sortie_client') {
        parClient[key].total_g -= m.poids_g;
      }
      parClient[key].details.push(m);
    });
    // Ne garder que les soldes > 0
    Object.keys(parClient).forEach(k => {
      if (parClient[k].total_g <= 0) delete parClient[k];
    });
    return parClient;
  },

  getTotalPropre() {
    const stock = this.getStockPropre();
    return Object.values(stock).reduce((sum, g) => sum + g, 0);
  },

  getTotalClient() {
    const stock = this.getStockClient();
    return Object.values(stock).reduce((sum, c) => sum + c.total_g, 0);
  },

  getValorisationPropre() {
    const stock = this.getStockPropre();
    const cours = CoursService.getCours();
    const config = BijoutierStore.getConfig();
    let total = 0;
    Object.entries(stock).forEach(([purete, g]) => {
      total += g * cours * (config.puretés[purete] || 1);
    });
    return total;
  },
};

// ═══════════════════════════════════════════
// BALAYURE SERVICE
// ═══════════════════════════════════════════
const BalayureService = {
  calculer(initial, traite, pur24k) {
    const cours = CoursService.getCours();
    return {
      poids_pur_24k_g: pur24k,
      valeur_mad: pur24k * cours,
      rendement: initial > 0 ? ((pur24k / initial) * 100).toFixed(2) : 0,
    };
  },

  enregistrer(data) {
    const cours = CoursService.getCours();
    const balayure = BijoutierStore.add('balayures', {
      type: data.type || 'Incinération',
      poids_initial_g: data.poids_initial_g,
      poids_traite_g: data.poids_traite_g,
      poids_pur_24k_g: data.poids_pur_24k_g,
      cours_applique: cours,
      valeur_mad: data.poids_pur_24k_g * cours,
      date: data.date || new Date().toISOString().split('T')[0],
    });

    // Mouvement stock propre
    StockService.mouvementer({
      type: 'balayure',
      categorie: 'propre',
      poids_g: data.poids_pur_24k_g,
      purete: '24K',
      source: `Balayure ${data.type}`,
    });

    return balayure;
  },

  getHistorique() {
    return BijoutierStore.getAll('balayures')
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  },
};

// ═══════════════════════════════════════════
// RAFFINAGE SERVICE
// ═══════════════════════════════════════════
const RaffinageService = {
  convertir(quantite24k, pureteCible = '18K') {
    const config = BijoutierStore.getConfig();
    const facteur = config.puretés[pureteCible];
    if (!facteur) return null;

    const resultat = quantite24k * (24 / parseInt(pureteCible));
    const cours = CoursService.getCours();
    const valeur = resultat * cours * facteur;

    return { quantite_resultat_g: resultat, valeur_mad: valeur, facteur };
  },

  enregistrer(data) {
    const conversion = this.convertir(data.quantite_24k_g, data.purete_cible || '18K');
    if (!conversion) return null;

    const cours = CoursService.getCours();
    return BijoutierStore.add('raffinages', {
      quantite_24k_g: data.quantite_24k_g,
      purete_cible: data.purete_cible || '18K',
      quantite_resultat_g: conversion.quantite_resultat_g,
      cours_applique: cours,
      valeur_mad: conversion.valeur_mad,
      date: data.date || new Date().toISOString().split('T')[0],
    });
  },

  getHistorique() {
    return BijoutierStore.getAll('raffinages')
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  },
};

// ═══════════════════════════════════════════
// CAISSE SERVICE
// ═══════════════════════════════════════════
const CaisseService = {
  snapshot(data) {
    const now = new Date();
    const cours = CoursService.getCours();
    return BijoutierStore.add('caisseSnapshots', {
      type_transaction: data.type_transaction,
      poids_g: data.poids_g || 0,
      cours_applique: cours,
      montant_mad: data.montant_mad || (data.poids_g * cours),
      commande_id: data.commande_id || null,
      client_id: data.client_id || null,
      sens: data.sens || 'entree',
      date: now.toISOString().split('T')[0],
      heure: now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0'),
      notes: data.notes || '',
    });
  },

  getSnapsDuJour(date = null) {
    const today = date || new Date().toISOString().split('T')[0];
    return BijoutierStore.query('caisseSnapshots', s => s.date === today)
      .sort((a, b) => a.heure.localeCompare(b.heure));
  },

  getSoldeJour(date = null) {
    const snaps = this.getSnapsDuJour(date);
    return snaps.reduce((sum, s) => {
      return sum + (s.sens === 'entree' ? s.montant_mad : -s.montant_mad);
    }, 0);
  },
};

// ═══════════════════════════════════════════
// ALERTE SERVICE
// ═══════════════════════════════════════════
const AlerteService = {
  evaluer() {
    const alertes = [];
    const enCours = CommandeService.getEnCours();

    enCours.forEach(cmd => {
      const jours = CommandeService.getJoursRestants(cmd);
      const niveau = CommandeService.getNiveauAlerte(cmd);
      const client = ClientService.getById(cmd.client_id);

      if (niveau === 'retard') {
        alertes.push({
          type: 'retard',
          niveau: 'danger',
          message: `RETARD : ${cmd.type} pour ${client?.nom || '?'} — ${Math.abs(jours)}j de retard`,
          commande_id: cmd.id,
          client_id: cmd.client_id,
          jours,
        });
      } else if (niveau === 'urgent') {
        alertes.push({
          type: 'urgent',
          niveau: 'warning',
          message: `URGENT : ${cmd.type} pour ${client?.nom || '?'} — ${jours}j restants`,
          commande_id: cmd.id,
          client_id: cmd.client_id,
          jours,
        });
      }
    });

    return alertes.sort((a, b) => a.jours - b.jours);
  },

  getRetards() {
    return this.evaluer().filter(a => a.type === 'retard');
  },

  getUrgents() {
    return this.evaluer().filter(a => a.type === 'urgent');
  },

  count() {
    const alertes = this.evaluer();
    return { retards: alertes.filter(a => a.type === 'retard').length, urgents: alertes.filter(a => a.type === 'urgent').length, total: alertes.length };
  },
};

// ═══════════════════════════════════════════
// CA SERVICE (Chiffre d'Affaires)
// ═══════════════════════════════════════════
const CAService = {
  parClient(clientId) {
    return ClientService.getCA(clientId);
  },

  parPeriode(debut, fin) {
    const livrees = BijoutierStore.query('commandes', c =>
      c.statut === 'livree' &&
      c.date_livraison_effective &&
      c.date_livraison_effective >= debut &&
      c.date_livraison_effective <= fin
    );
    return livrees.reduce((sum, c) => sum + (c.tarif_prestation || 0), 0);
  },

  // CA d'un client sur une période donnée (commandes livrées dans l'intervalle)
  parClientPeriode(clientId, debut, fin) {
    const livrees = BijoutierStore.query('commandes', c =>
      c.client_id === clientId &&
      c.statut === 'livree' &&
      c.date_livraison_effective &&
      (!debut || c.date_livraison_effective >= debut) &&
      (!fin || c.date_livraison_effective <= fin)
    );
    return livrees.reduce((sum, c) => sum + (c.tarif_prestation || 0), 0);
  },

  // Répartition du CA par client sur une période, triée + part en % du total
  repartitionParClient(debut, fin) {
    const lignes = ClientService.getAll()
      .map(c => ({ client: c, ca: this.parClientPeriode(c.id, debut, fin) }))
      .filter(l => l.ca > 0)
      .sort((a, b) => b.ca - a.ca);
    const total = lignes.reduce((s, l) => s + l.ca, 0);
    return lignes.map(l => ({
      ...l,
      pourcent: total > 0 ? (l.ca / total) * 100 : 0,
    }));
  },

  duJour(date = null) {
    const today = date || new Date().toISOString().split('T')[0];
    return this.parPeriode(today, today);
  },

  delaSemaine() {
    const now = new Date();
    const lundi = new Date(now);
    lundi.setDate(now.getDate() - now.getDay() + 1);
    return this.parPeriode(lundi.toISOString().split('T')[0], now.toISOString().split('T')[0]);
  },

  duMois() {
    const now = new Date();
    const debut = new Date(now.getFullYear(), now.getMonth(), 1);
    return this.parPeriode(debut.toISOString().split('T')[0], now.toISOString().split('T')[0]);
  },

  totalCumule() {
    const livrees = BijoutierStore.query('commandes', c => c.statut === 'livree');
    return livrees.reduce((sum, c) => sum + (c.tarif_prestation || 0), 0);
  },

  resume() {
    return {
      jour: this.duJour(),
      semaine: this.delaSemaine(),
      mois: this.duMois(),
      total: this.totalCumule(),
      nbLivraisons: BijoutierStore.query('commandes', c => c.statut === 'livree').length,
    };
  },
};

// ═══════════════════════════════════════════
// CREDIT SERVICE (Crédit Client — module 2)
// ═══════════════════════════════════════════
const CreditService = {
  getLignes(commandeId) {
    return BijoutierStore.query('creditsClient', l => l.commande_id === commandeId)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  },

  getSolde(commandeId) {
    return this.getLignes(commandeId)
      .reduce((sum, l) => sum + (l.type === 'paiement' ? -l.montant_mad : l.montant_mad), 0);
  },

  getSoldeClient(clientId) {
    return BijoutierStore.query('creditsClient', l => l.client_id === clientId)
      .reduce((sum, l) => sum + (l.type === 'paiement' ? -l.montant_mad : l.montant_mad), 0);
  },

  _ajouterLigne(type, commandeId, clientId, montantMad, extra = {}) {
    return BijoutierStore.add('creditsClient', {
      client_id: clientId,
      commande_id: commandeId,
      type,
      montant_mad: montantMad,
      poids_or_g: extra.poids_or_g || null,
      cours_applique: extra.cours_applique || null,
      date: extra.date || new Date().toISOString().split('T')[0],
      notes: extra.notes || '',
    });
  },

  chargerModele3D(commandeId, clientId, montantMad) {
    if (!montantMad) return null;
    return this._ajouterLigne('charge_modele_3d', commandeId, clientId, montantMad);
  },

  chargerHonoraires(commandeId, clientId, montantMad) {
    if (!montantMad) return null;
    return this._ajouterLigne('charge_honoraires', commandeId, clientId, montantMad);
  },

  chargerOrPrete(commandeId, clientId, poidsG, purete = '24K') {
    if (!poidsG) return null;
    const montant = CoursService.convertirMAD(poidsG, purete);
    return this._ajouterLigne('charge_or_prete', commandeId, clientId, montant, {
      poids_or_g: poidsG,
      cours_applique: CoursService.getCours(),
    });
  },

  enregistrerPaiement(commandeId, clientId, montantMad, notes = '') {
    if (!montantMad) return null;
    return this._ajouterLigne('paiement', commandeId, clientId, montantMad, { notes });
  },

  estSoldeNul(commandeId) {
    return Math.abs(this.getSolde(commandeId)) < 0.01;
  },

  getImpayes() {
    const commandeIds = [...new Set(BijoutierStore.getAll('creditsClient').map(l => l.commande_id))];
    return commandeIds
      .map(id => ({ commande_id: id, solde: this.getSolde(id) }))
      .filter(c => c.solde > 0.01);
  },
};

// ═══════════════════════════════════════════
// COFFRE SERVICE (module 3 — hub central du pipeline)
// ═══════════════════════════════════════════
const CoffreService = {
  getStockOr() {
    const entrees = ['entree_coffre_achat', 'entree_coffre_retour_fonderie', 'entree_coffre_retour_artisan', 'entree_coffre_retour_douane', 'entree_coffre_retour_finition'];
    const sorties = ['sortie_coffre_fonderie', 'sortie_coffre_artisan', 'sortie_coffre_pret_client'];
    const parPurete = {};
    BijoutierStore.getAll('stock_atelier').forEach(m => {
      if (!entrees.includes(m.type) && !sorties.includes(m.type)) return;
      if (!parPurete[m.purete]) parPurete[m.purete] = 0;
      parPurete[m.purete] += entrees.includes(m.type) ? m.poids_g : -m.poids_g;
    });
    return parPurete;
  },

  getTotalOr() {
    return Object.values(this.getStockOr()).reduce((sum, g) => sum + g, 0);
  },

  recevoirPiece(pieceId) {
    return BijoutierStore.update('pieces', pieceId, { statut: 'au_coffre', localisation_actuelle: 'coffre' });
  },

  acheterOr(poidsG, purete, fournisseur, montantMad) {
    const mvt = StockService.mouvementer({
      type: 'entree_coffre_achat', categorie: 'atelier', poids_g: poidsG, purete, source: fournisseur || 'Achat or',
    });
    CaisseService.snapshot({
      type_transaction: 'Achat or',
      poids_g: poidsG,
      montant_mad: montantMad || CoursService.convertirMAD(poidsG, purete),
      sens: 'sortie',
    });
    return mvt;
  },

  recevoirRetourFonderie(pieceId, poidsG, purete) {
    const mvt = StockService.mouvementer({
      type: 'entree_coffre_retour_fonderie', categorie: 'atelier', poids_g: poidsG, purete, piece_id: pieceId, source: 'Retour fonderie',
    });
    BijoutierStore.update('pieces', pieceId, { statut: 'en_attente_chef_atelier', poids_actuel_g: poidsG, localisation_actuelle: 'coffre' });
    return mvt;
  },

  recevoirRetourArtisan(pieceId, poidsG, purete, artisanId) {
    const mvt = StockService.mouvementer({
      type: 'entree_coffre_retour_artisan', categorie: 'atelier', poids_g: poidsG, purete, piece_id: pieceId, artisan_id: artisanId, source: 'Retour artisan',
    });
    BijoutierStore.update('pieces', pieceId, { statut: 'en_attente_chef_atelier', poids_actuel_g: poidsG, localisation_actuelle: 'coffre', artisan_actuel_id: null });
    return mvt;
  },

  recevoirRetourDouane(pieceId, poidsG, purete) {
    const mvt = StockService.mouvementer({
      type: 'entree_coffre_retour_douane', categorie: 'atelier', poids_g: poidsG, purete, piece_id: pieceId, source: 'Retour douane',
    });
    BijoutierStore.update('pieces', pieceId, { statut: 'en_attente_chef_atelier', poids_actuel_g: poidsG, localisation_actuelle: 'coffre' });
    return mvt;
  },

  recevoirRetourFinition(pieceId, poidsG, purete) {
    const mvt = StockService.mouvementer({
      type: 'entree_coffre_retour_finition', categorie: 'atelier', poids_g: poidsG, purete, piece_id: pieceId, source: 'Retour finition (excédent/annulation)',
    });
    BijoutierStore.update('pieces', pieceId, { statut: 'retour_coffre_final', poids_actuel_g: poidsG, localisation_actuelle: 'coffre' });
    return mvt;
  },

  envoyerFonderie(pieceId, poidsG, purete) {
    StockService.mouvementer({
      type: 'sortie_coffre_fonderie', categorie: 'atelier', poids_g: poidsG, purete, piece_id: pieceId, source: 'Envoi fonderie',
    });
    return FonderieService.recevoir(pieceId, poidsG, purete);
  },

  affecterArtisan(pieceId, artisanId, typeEtape, poidsG, purete) {
    StockService.mouvementer({
      type: 'sortie_coffre_artisan', categorie: 'atelier', poids_g: poidsG, purete, piece_id: pieceId, artisan_id: artisanId, source: `Affectation ${typeEtape}`,
    });
    return ArtisanService.recevoir(pieceId, artisanId, typeEtape, poidsG, purete);
  },

  // Règle module 1 : "si or insuffisant → compléter via coffre" — devient une dette (crédit client)
  completerOrPourCommande(commandeId, clientId, poidsManquantG, purete) {
    if (!poidsManquantG || poidsManquantG <= 0) return null;
    StockService.mouvementer({
      type: 'sortie_coffre_pret_client', categorie: 'atelier', poids_g: poidsManquantG, purete, commande_id: commandeId, source: `Complément or commande ${commandeId}`,
    });
    CreditService.chargerOrPrete(commandeId, clientId, poidsManquantG, purete);
    return { poids_complete_g: poidsManquantG, purete };
  },
};

// ═══════════════════════════════════════════
// FONDERIE SERVICE (module 4)
// ═══════════════════════════════════════════
const FonderieService = {
  recevoir(pieceId, poidsOrG, purete) {
    const mvt = StockService.mouvementer({
      type: 'entree_fonderie', categorie: 'atelier', poids_g: poidsOrG, purete, piece_id: pieceId, source: 'Réception fonderie',
    });
    BijoutierStore.update('pieces', pieceId, { statut: 'en_fonderie', localisation_actuelle: 'fonderie' });
    return mvt;
  },

  // Règle module 4 : "retour obligatoire vers coffre"
  retourner(pieceId, poidsEntreeG, poidsBrutG, purete) {
    StockService.mouvementer({
      type: 'sortie_fonderie', categorie: 'atelier', poids_g: poidsBrutG, purete, piece_id: pieceId,
      poids_perte_g: poidsBrutG - poidsEntreeG, source: 'Bijou brut',
    });
    return CoffreService.recevoirRetourFonderie(pieceId, poidsBrutG, purete);
  },
};

// ═══════════════════════════════════════════
// CHEF D'ATELIER SERVICE (module 5 — contrôle, décision)
// ═══════════════════════════════════════════
const ChefAtelierService = {
  getEnAttenteControle() {
    return BijoutierStore.query('pieces', p => p.statut === 'en_attente_chef_atelier');
  },

  affecterArtisan(pieceId, artisanId, typeEtape, poidsG, purete) {
    const piece = BijoutierStore.getById('pieces', pieceId);
    if (!piece) return null;
    return CoffreService.affecterArtisan(pieceId, artisanId, typeEtape, poidsG || piece.poids_actuel_g, purete || piece.purete);
  },

  envoyerDouane(pieceId) {
    const piece = BijoutierStore.getById('pieces', pieceId);
    if (!piece) return null;
    BijoutierStore.update('pieces', pieceId, { douane_requise: true });
    return DouaneService.ouvrir(pieceId, piece.poids_actuel_g, piece.purete);
  },

  envoyerFinition(pieceId) {
    const piece = BijoutierStore.getById('pieces', pieceId);
    if (!piece) return null;
    return FinitionService.recevoir(pieceId, piece.poids_actuel_g, piece.purete);
  },

  validerEtapesRestantes(pieceId) {
    const piece = BijoutierStore.getById('pieces', pieceId);
    return piece ? (piece.etapes_artisan_requises || []) : [];
  },
};

// ═══════════════════════════════════════════
// ARTISAN SERVICE (module 6 — préparation, pré-polissage, sertissage, gravure)
// ═══════════════════════════════════════════
const ArtisanService = {
  getAll() {
    return BijoutierStore.getAll('artisans');
  },

  getById(id) {
    return BijoutierStore.getById('artisans', id);
  },

  getByCompetence(type) {
    return BijoutierStore.query('artisans', a => a.actif && (a.competences || []).includes(type));
  },

  ajouter(data) {
    return BijoutierStore.add('artisans', {
      nom: data.nom,
      competences: data.competences || [],
      telephone: data.telephone || '',
      actif: true,
    });
  },

  recevoir(pieceId, artisanId, typeEtape, poidsEntreeG, purete) {
    const mvt = StockService.mouvementer({
      type: 'entree_artisan', categorie: 'atelier', poids_g: poidsEntreeG, purete, piece_id: pieceId, artisan_id: artisanId, source: `Réception ${typeEtape}`,
    });
    BijoutierStore.update('pieces', pieceId, { statut: 'chez_artisan', localisation_actuelle: 'artisan', artisan_actuel_id: artisanId });
    return mvt;
  },

  // Règle module 6 : sortie = grammes modifiés (±) — gain ou perte selon l'étape (gravure, ajout de matière, etc.)
  retourner(pieceId, poidsEntreeG, poidsSortieG, purete) {
    const piece = BijoutierStore.getById('pieces', pieceId);
    const artisanId = piece ? piece.artisan_actuel_id : null;
    StockService.mouvementer({
      type: 'sortie_artisan', categorie: 'atelier', poids_g: poidsSortieG, purete, piece_id: pieceId, artisan_id: artisanId,
      poids_perte_g: poidsSortieG - poidsEntreeG, source: 'Retour artisan',
    });
    return CoffreService.recevoirRetourArtisan(pieceId, poidsSortieG, purete, artisanId);
  },

  getHistoriquePiece(pieceId) {
    return BijoutierStore.query('stock_atelier', m => m.piece_id === pieceId && ['entree_artisan', 'sortie_artisan'].includes(m.type))
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  },
};

// ═══════════════════════════════════════════
// DOUANE SERVICE (module 7 — règle stricte : aucune variation)
// ═══════════════════════════════════════════
const DouaneService = {
  ouvrir(pieceId, poidsEntreeG, purete) {
    BijoutierStore.update('pieces', pieceId, { statut: 'en_douane', localisation_actuelle: 'douane' });
    return StockService.mouvementer({
      type: 'entree_douane', categorie: 'atelier', poids_g: poidsEntreeG, purete, piece_id: pieceId, source: 'Entrée douane',
    });
  },

  // Rejette la clôture si le poids de sortie diffère du poids d'entrée (tolérance flottante seulement)
  cloturer(pieceId, poidsSortieG, purete) {
    const EPSILON = 0.001;
    const entree = BijoutierStore.query('stock_atelier', m => m.piece_id === pieceId && m.type === 'entree_douane')
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
    if (!entree) return { ok: false, erreur: 'Aucune entrée douane trouvée pour cette pièce' };
    if (Math.abs(poidsSortieG - entree.poids_g) > EPSILON) {
      return { ok: false, erreur: `Variation interdite : entrée ${entree.poids_g}g ≠ sortie ${poidsSortieG}g` };
    }
    StockService.mouvementer({
      type: 'sortie_douane', categorie: 'atelier', poids_g: poidsSortieG, purete, piece_id: pieceId, poids_perte_g: 0, source: 'Sortie douane',
    });
    return { ok: true, mouvement: CoffreService.recevoirRetourDouane(pieceId, poidsSortieG, purete) };
  },
};

// ═══════════════════════════════════════════
// FINITION SERVICE (module 8)
// ═══════════════════════════════════════════
const FinitionService = {
  recevoir(pieceId, poidsEntreeG, purete) {
    BijoutierStore.update('pieces', pieceId, { statut: 'en_finition', localisation_actuelle: 'finition' });
    return StockService.mouvementer({
      type: 'entree_finition', categorie: 'atelier', poids_g: poidsEntreeG, purete, piece_id: pieceId, source: 'Réception finition',
    });
  },

  terminer(pieceId, poidsFinalG) {
    const today = new Date().toISOString().split('T')[0];
    return BijoutierStore.update('pieces', pieceId, { statut: 'finie', poids_actuel_g: poidsFinalG, date_finition: today });
  },
};

// ═══════════════════════════════════════════
// SORTIE SERVICE (module 9 — retour coffre ou livraison client)
// ═══════════════════════════════════════════
const SortieService = {
  livrerClient(pieceId) {
    const piece = BijoutierStore.getById('pieces', pieceId);
    if (!piece || piece.statut !== 'finie') return { ok: false, erreur: 'La pièce doit être finie avant livraison' };

    StockService.mouvementer({
      type: 'sortie_finition_client', categorie: 'atelier', poids_g: piece.poids_actuel_g, purete: piece.purete, piece_id: pieceId, source: 'Livraison client',
    });

    const today = new Date().toISOString().split('T')[0];
    BijoutierStore.update('pieces', pieceId, { statut: 'livree_client', date_sortie_finale: today });

    const commande = CommandeService.livrer(piece.commande_id);
    const soldeNul = CreditService.estSoldeNul(piece.commande_id);

    // Solde non nul = avertissement seulement, jamais un blocage de la livraison
    return {
      ok: true,
      piece: BijoutierStore.getById('pieces', pieceId),
      commande,
      avertissement: soldeNul ? null : `Solde client non nul : ${CreditService.getSolde(piece.commande_id)} MAD`,
    };
  },

  retournerCoffre(pieceId, poidsG, purete) {
    const piece = BijoutierStore.getById('pieces', pieceId);
    if (!piece) return null;

    StockService.mouvementer({
      type: 'sortie_finition_coffre', categorie: 'atelier', poids_g: poidsG, purete: purete || piece.purete, piece_id: pieceId, source: 'Retour coffre (excédent/annulation)',
    });

    const today = new Date().toISOString().split('T')[0];
    BijoutierStore.update('pieces', pieceId, { date_sortie_finale: today });

    return CoffreService.recevoirRetourFinition(pieceId, poidsG, purete || piece.purete);
  },
};

// ═══════════════════════════════════════════
// ACHAT DIVERS SERVICE (Chdaya, sbika, dlala, cliente — achats d'or au comptoir)
// Gain = valeur marché 18k de l'or reçu − coût payé.
// L'or reçu est ramené en équivalent-18k selon son carat : poids × carat / 18.
// ═══════════════════════════════════════════
const AchatDiversService = {
  CATEGORIES: ['Chdaya', 'Sbika', 'Dlala', 'Cliente'],

  calculer(poidsG, carat, prixAchatMadG) {
    const cours18k = CoursService.getCours18k();
    const poids18kEquiv = poidsG * ((carat || 18) / 18);
    const valeurMarche = poids18kEquiv * cours18k;
    const cout = poidsG * (prixAchatMadG || 0);
    return {
      cours_18k_applique: cours18k,
      poids_18k_equiv_g: poids18kEquiv,
      cout_mad: cout,
      valeur_marche_mad: valeurMarche,
      gain_mad: valeurMarche - cout,
    };
  },

  enregistrer(data) {
    const calc = this.calculer(data.poids_g, data.carat, data.prix_achat_mad_g);
    return BijoutierStore.add('achatsDivers', {
      categorie: data.categorie,
      poids_g: data.poids_g,
      carat: data.carat || 18,
      prix_achat_mad_g: data.prix_achat_mad_g,
      cours_18k_applique: calc.cours_18k_applique,
      poids_18k_equiv_g: calc.poids_18k_equiv_g,
      cout_mad: calc.cout_mad,
      valeur_marche_mad: calc.valeur_marche_mad,
      gain_mad: calc.gain_mad,
      date: data.date || new Date().toISOString().split('T')[0],
    });
  },

  getHistorique(filtre = {}) {
    return BijoutierStore.query('achatsDivers', a =>
      (!filtre.categorie || a.categorie === filtre.categorie) &&
      (!filtre.debut || a.date >= filtre.debut) &&
      (!filtre.fin || a.date <= filtre.fin)
    ).sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  getTotalGain(filtre = {}) {
    return this.getHistorique(filtre).reduce((sum, a) => sum + (a.gain_mad || 0), 0);
  },
};
