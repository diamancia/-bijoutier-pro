/**
 * Bijoutier Pro — Harness de vérification P02 (pipeline atelier)
 * Fichier temporaire, jamais chargé par index.html. Sert uniquement à vérifier
 * manuellement le pipeline Coffre → Fonderie → Chef d'atelier → Artisans →
 * Douane → Finition → Sortie + Crédit Client, en l'absence de toute UI/test framework.
 *
 * Usage : charger via une page HTML jetable contenant, dans l'ordre :
 *   <script src="js/store.js"></script>
 *   <script src="js/seed-data.js"></script>
 *   <script src="js/services/metier.js"></script>
 *   <script src="js/test-harness-p02.js"></script>
 * runP02Harness() s'exécute automatiquement au chargement et journalise tout dans la console.
 */

function runP02Harness() {
  const assert = (cond, label) => {
    console.log(cond ? `✅ ${label}` : `❌ ${label}`);
    if (!cond) console.trace();
  };

  console.group('P02 — Harness pipeline atelier');

  // ─── Reset complet pour un état reproductible ───
  BijoutierStore.clearAll();
  BijoutierStore.init(SEED_DATA);
  console.log('État initial :', BijoutierStore._countItems());

  // ═══════════════════════════════════════════
  // 1. Chemin complet : commande or simple → livraison
  // ═══════════════════════════════════════════
  console.group('1. Commande or (chemin simple, sans manque)');

  CoffreService.acheterOr(50, '24K', 'Fournisseur Test', null);
  assert(CoffreService.getTotalOr() > 0, 'Achat or crédite le stock coffre');

  const cmd1 = CommandeService.creer({
    client_id: 'cli_002',
    type: 'Bague',
    poids_or_g: 5,
    purete: '18K',
    type_metal: 'or',
    date_depot_or: '2026-06-21',
    date_livraison_prevue: '2026-07-01',
    prix_modele_3d_mad: 200,
    honoraires_mad: 100,
  });
  assert(!!cmd1.piece_id, 'Commande crée une pièce liée');

  let piece1 = BijoutierStore.getById('pieces', cmd1.piece_id);
  assert(piece1.statut === 'au_coffre', `Pièce mise au coffre après création (statut=${piece1.statut})`);

  CoffreService.envoyerFonderie(piece1.id, piece1.poids_actuel_g, piece1.purete);
  piece1 = BijoutierStore.getById('pieces', piece1.id);
  assert(piece1.statut === 'en_fonderie', `Envoi fonderie (statut=${piece1.statut})`);

  FonderieService.retourner(piece1.id, 5, 4.9, '18K');
  piece1 = BijoutierStore.getById('pieces', piece1.id);
  assert(piece1.statut === 'en_attente_chef_atelier' && piece1.poids_actuel_g === 4.9, `Retour fonderie avec perte tracée (poids=${piece1.poids_actuel_g})`);

  ChefAtelierService.affecterArtisan(piece1.id, 'arn_001', 'préparation', piece1.poids_actuel_g, piece1.purete);
  piece1 = BijoutierStore.getById('pieces', piece1.id);
  assert(piece1.statut === 'chez_artisan' && piece1.artisan_actuel_id === 'arn_001', 'Affectation 1er artisan (préparation)');

  ArtisanService.retourner(piece1.id, 4.9, 4.85, '18K');
  piece1 = BijoutierStore.getById('pieces', piece1.id);
  assert(piece1.statut === 'en_attente_chef_atelier' && piece1.artisan_actuel_id === null, `Retour 1er artisan, perte ${(4.85 - 4.9).toFixed(2)}g tracée`);

  ChefAtelierService.affecterArtisan(piece1.id, 'arn_002', 'sertissage', piece1.poids_actuel_g, piece1.purete);
  ArtisanService.retourner(piece1.id, 4.85, 4.9, '18K'); // gain de matière (soudure) : delta positif
  piece1 = BijoutierStore.getById('pieces', piece1.id);
  assert(piece1.poids_actuel_g === 4.9, `Boucle 2e artisan (sertissage) avec gain tracé (poids=${piece1.poids_actuel_g})`);

  ChefAtelierService.envoyerDouane(piece1.id);
  piece1 = BijoutierStore.getById('pieces', piece1.id);
  assert(piece1.statut === 'en_douane', 'Envoi douane');

  const douaneRejet = DouaneService.cloturer(piece1.id, 4.95, '18K');
  assert(douaneRejet.ok === false, `Douane rejette une variation (${douaneRejet.erreur})`);

  const douaneOk = DouaneService.cloturer(piece1.id, 4.9, '18K');
  assert(douaneOk.ok === true, 'Douane accepte un poids identique (aucune variation)');
  piece1 = BijoutierStore.getById('pieces', piece1.id);
  assert(piece1.statut === 'en_attente_chef_atelier', 'Retour douane → en attente chef atelier');

  ChefAtelierService.envoyerFinition(piece1.id);
  piece1 = BijoutierStore.getById('pieces', piece1.id);
  assert(piece1.statut === 'en_finition', 'Envoi finition');

  FinitionService.terminer(piece1.id, 4.9);
  piece1 = BijoutierStore.getById('pieces', piece1.id);
  assert(piece1.statut === 'finie' && !!piece1.date_finition, 'Pièce finie');

  const livraison1 = SortieService.livrerClient(piece1.id);
  assert(livraison1.ok === true, 'Livraison client réussie');
  assert(livraison1.commande.statut === 'livree', 'Commande marquée livrée');
  console.log('Avertissement crédit (devrait signaler un solde non nul, jamais bloquer) :', livraison1.avertissement);

  console.groupEnd();

  // ═══════════════════════════════════════════
  // 2. Commande argent avec or insuffisant → complément coffre
  // ═══════════════════════════════════════════
  console.group("2. Commande argent + or insuffisant (complément via coffre)");

  const soldeCoffreAvant = CoffreService.getTotalOr();

  const cmd2 = CommandeService.creer({
    client_id: 'cli_004',
    type: 'Collier',
    poids_or_g: 50,              // grammes d'argent déposés par le client
    type_metal: 'argent',
    purete_argent: '925',
    purete: '18K',
    poids_necessaire_g: 2,        // la pièce nécessite 2g-or, largement au-dessus de l'équivalent argent déposé
    date_depot_or: '2026-06-21',
    date_livraison_prevue: '2026-07-05',
    prix_modele_3d_mad: 150,
    honoraires_mad: 110,
  });

  assert(cmd2.or_prete_g > 0, `Manque détecté et complété via coffre (or_prete_g=${cmd2.or_prete_g.toFixed(3)}g)`);
  assert(CoffreService.getTotalOr() < soldeCoffreAvant, 'Le complément via coffre débite bien le stock coffre');

  const soldeCmd2 = CreditService.getSolde(cmd2.id);
  assert(soldeCmd2 > cmd2.prix_modele_3d_mad + cmd2.honoraires_mad, `Crédit client inclut la charge or_prete (solde=${soldeCmd2.toFixed(2)} MAD)`);

  console.groupEnd();

  // ═══════════════════════════════════════════
  // 3. Résumé final
  // ═══════════════════════════════════════════
  console.group('3. Résumé');
  console.table(BijoutierStore.getAll('pieces').map(p => ({
    id: p.id, commande_id: p.commande_id, statut: p.statut,
    poids_initial_g: p.poids_initial_g, poids_actuel_g: p.poids_actuel_g,
    artisan_actuel_id: p.artisan_actuel_id,
  })));

  const commandeIds = [...new Set(BijoutierStore.getAll('creditsClient').map(l => l.commande_id))];
  console.table(commandeIds.map(id => ({ commande_id: id, solde_mad: CreditService.getSolde(id) })));

  console.log('Stock coffre par pureté :', CoffreService.getStockOr());
  console.log('Compteurs finaux :', BijoutierStore._countItems());
  console.groupEnd();

  console.groupEnd();
}

runP02Harness();
