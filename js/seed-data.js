/**
 * Bijoutier Pro — Données initiales (migration du code statique)
 * P02 : Convertit les données hardcodées du HTML en objets Store
 */

const SEED_DATA = {
  config: {
    coursActif: null,
    devise: 'MAD',
    puretés: { '24K': 1, '22K': 0.916, '18K': 0.75, '14K': 0.585, '9K': 0.375 },
  },

  coursOr: [
    { id: 'cor_001', date: '2026-06-19', cours_mad_g: 642, carat_saisi: '24K', cours_saisi: 642, vendeur: 'Ennachi', quantite_g: 50, valide: true, created_at: '2026-06-19T08:00:00Z' },
    { id: 'cor_002', date: '2026-06-12', cours_mad_g: 639, carat_saisi: '24K', cours_saisi: 639, vendeur: 'Ahroum Manjra', quantite_g: 30, valide: true, created_at: '2026-06-12T08:00:00Z' },
    { id: 'cor_003', date: '2026-06-05', cours_mad_g: 635, carat_saisi: '24K', cours_saisi: 635, vendeur: 'Ahroum Sd Othmane', quantite_g: 20, valide: true, created_at: '2026-06-05T08:00:00Z' },
  ],

  achatsDivers: [
    { id: 'ach_001', categorie: 'Chdaya', poids_g: 8, carat: 18, prix_achat_mad_g: 460, cours_18k_applique: 481.5, poids_18k_equiv_g: 8, cout_mad: 3680, valeur_marche_mad: 3852, gain_mad: 172, date: '2026-06-19', created_at: '2026-06-19T10:30:00Z' },
    { id: 'ach_002', categorie: 'Sbika', poids_g: 10, carat: 14.5, prix_achat_mad_g: 370, cours_18k_applique: 481.5, poids_18k_equiv_g: 8.0555555556, cout_mad: 3700, valeur_marche_mad: 3878.75, gain_mad: 178.75, date: '2026-06-18', created_at: '2026-06-18T14:00:00Z' },
    { id: 'ach_003', categorie: 'Dlala', poids_g: 5, carat: 18, prix_achat_mad_g: 470, cours_18k_applique: 479.25, poids_18k_equiv_g: 5, cout_mad: 2350, valeur_marche_mad: 2396.25, gain_mad: 46.25, date: '2026-06-12', created_at: '2026-06-12T11:15:00Z' },
  ],

  artisans: [
    { id: 'arn_001', nom: 'Karim Ezzahiri', competences: ['préparation', 'pré-polissage'], telephone: '0662 111 222', pin: '1111', lieu: 'in_situ', actif: true, created_at: '2026-01-05T00:00:00Z' },
    { id: 'arn_002', nom: 'Samira Bensouda', competences: ['sertissage'], telephone: '0663 333 444', pin: '2222', lieu: 'in_situ', actif: true, created_at: '2026-01-05T00:00:00Z' },
    { id: 'arn_003', nom: 'Omar Idrissi', competences: ['gravure', 'sertissage'], telephone: '0664 555 666', pin: '3333', lieu: 'ex_situ', actif: true, created_at: '2026-02-01T00:00:00Z' },
    { id: 'arn_004', nom: 'Mehdi Ouali (test)', competences: ['préparation', 'sertissage'], telephone: '0665 777 888', pin: '4444', lieu: 'in_situ', actif: true, created_at: '2026-06-23T00:00:00Z' },
    { id: 'arn_005', nom: 'Salma Idrissi (test)', competences: ['gravure'], telephone: '0666 999 000', pin: '5555', lieu: 'ex_situ', actif: true, created_at: '2026-06-23T00:00:00Z' },
  ],

  clients: [
    { id: 'cli_001', nom: 'Hassan Benjelloun', telephone: '0661 234 567', bijouterie: 'Bijouterie Centrale', tarif_prestation: 120, created_at: '2026-01-10T00:00:00Z' },
    { id: 'cli_002', nom: 'Fatima Amrani', telephone: '0622 890 123', bijouterie: 'Or et Lumière', tarif_prestation: 100, created_at: '2026-02-15T00:00:00Z' },
    { id: 'cli_003', nom: 'Youssef Kettani', telephone: '0637 456 789', bijouterie: 'Goldsmith', tarif_prestation: 120, created_at: '2026-03-01T00:00:00Z' },
    { id: 'cli_004', nom: 'Meryem Lahlou', telephone: '0655 321 098', bijouterie: 'Artisan Or', tarif_prestation: 110, created_at: '2026-01-20T00:00:00Z' },
  ],

  commandes: [
    // Exemple de commandes migrées depuis les "dépôts" existants
    { id: 'cmd_001', client_id: 'cli_001', type: 'Bague', poids_or_g: 3.5, purete: '18K', pierres: 'Diamant', taille: '52', date_depot_or: '2026-06-12', date_livraison_prevue: '2026-06-22', date_livraison_effective: null, statut: 'en_cours', tarif_prestation: 120, cours_depot: 642, type_metal: 'or', prix_modele_3d_mad: 250, honoraires_mad: 120, or_prete_g: 0, piece_id: 'pie_001', notes: '', created_at: '2026-06-12T09:15:00Z' },
    { id: 'cmd_002', client_id: 'cli_002', type: 'Collier', poids_or_g: 4.2, purete: '18K', pierres: 'Zircone', taille: '45cm', date_depot_or: '2026-06-10', date_livraison_prevue: '2026-06-20', date_livraison_effective: null, statut: 'en_cours', tarif_prestation: 100, cours_depot: 641, type_metal: 'or', prix_modele_3d_mad: 0, honoraires_mad: 100, or_prete_g: 0, piece_id: null, notes: '', created_at: '2026-06-10T10:00:00Z' },
    { id: 'cmd_003', client_id: 'cli_003', type: 'Bague', poids_or_g: 6.0, purete: '18K', pierres: 'Moissanite', taille: '56', date_depot_or: '2026-06-15', date_livraison_prevue: '2026-06-25', date_livraison_effective: null, statut: 'en_cours', tarif_prestation: 120, cours_depot: 642, type_metal: 'or', prix_modele_3d_mad: 300, honoraires_mad: 120, or_prete_g: 1.5, piece_id: 'pie_002', notes: 'Or insuffisant déposé : 1.5g complétés via coffre', created_at: '2026-06-15T11:00:00Z' },
    { id: 'cmd_004', client_id: 'cli_001', type: 'Bracelet', poids_or_g: 2.0, purete: '18K', pierres: 'Sans pierres', taille: '18cm', date_depot_or: '2026-06-05', date_livraison_prevue: '2026-06-15', date_livraison_effective: '2026-06-14', statut: 'livree', tarif_prestation: 120, cours_depot: 639, type_metal: 'or', prix_modele_3d_mad: 0, honoraires_mad: 120, or_prete_g: 0, piece_id: 'pie_003', poids_livraison_g: 1.93, gain_g: -0.07, regle: true, poincon_douane: true, notes: '', created_at: '2026-06-05T09:00:00Z' },
    { id: 'cmd_005', client_id: 'cli_002', type: 'Boucles', poids_or_g: 1.5, purete: '18K', pierres: 'Zircone', taille: '', date_depot_or: '2026-06-01', date_livraison_prevue: '2026-06-10', date_livraison_effective: '2026-06-09', statut: 'livree', tarif_prestation: 100, cours_depot: 638, poids_livraison_g: 1.52, gain_g: 0.02, regle: true, poincon_douane: false, notes: '', created_at: '2026-06-01T08:30:00Z' },
    { id: 'cmd_006', client_id: 'cli_004', type: 'Bague', poids_or_g: 2.8, purete: '18K', pierres: 'Diamant', taille: '54', date_depot_or: '2026-06-14', date_livraison_prevue: '2026-06-24', date_livraison_effective: null, statut: 'en_cours', tarif_prestation: 110, cours_depot: 642, notes: '', created_at: '2026-06-14T10:30:00Z' },
    { id: 'cmd_007', client_id: 'cli_004', type: 'Collier', poids_or_g: 3.2, purete: '22K', pierres: 'Sans pierres', taille: '40cm', date_depot_or: '2026-06-08', date_livraison_prevue: '2026-06-18', date_livraison_effective: '2026-06-17', statut: 'livree', tarif_prestation: 110, cours_depot: 640, poids_livraison_g: 3.25, gain_g: 0.05, regle: false, poincon_douane: true, notes: '', created_at: '2026-06-08T14:00:00Z' },
    { id: 'cmd_008', client_id: 'cli_004', type: 'Bracelet', poids_or_g: 4.0, purete: '18K', pierres: 'Naturelles', taille: '17cm', date_depot_or: '2026-06-02', date_livraison_prevue: '2026-06-12', date_livraison_effective: '2026-06-11', statut: 'livree', tarif_prestation: 110, cours_depot: 637, poids_livraison_g: 3.95, gain_g: -0.05, regle: true, poincon_douane: false, notes: '', created_at: '2026-06-02T09:00:00Z' },
  ],

  stock: {
    propre: [
      { id: 'stp_001', type: 'entree_propre', poids_g: 45.0, purete: '24K', source: 'Achat Al Waha', date: '2026-06-19', created_at: '2026-06-19T08:00:00Z', notes: 'Stock principal' },
      { id: 'stp_002', type: 'balayure', poids_g: 8.2, purete: '24K', source: 'Balayure incinération', date: '2026-06-19', created_at: '2026-06-19T09:10:00Z', notes: 'Récupéré atelier' },
    ],
    client: [
      { id: 'stc_001', type: 'depot_client', client_id: 'cli_001', commande_id: 'cmd_001', poids_g: 3.5, purete: '18K', cours_applique: 642, date: '2026-06-12', created_at: '2026-06-12T09:15:00Z' },
      { id: 'stc_002', type: 'depot_client', client_id: 'cli_002', commande_id: 'cmd_002', poids_g: 4.2, purete: '18K', cours_applique: 641, date: '2026-06-10', created_at: '2026-06-10T10:00:00Z' },
      { id: 'stc_003', type: 'depot_client', client_id: 'cli_003', commande_id: 'cmd_003', poids_g: 6.0, purete: '18K', cours_applique: 642, date: '2026-06-15', created_at: '2026-06-15T11:00:00Z' },
      { id: 'stc_004', type: 'depot_client', client_id: 'cli_004', commande_id: 'cmd_006', poids_g: 2.8, purete: '18K', cours_applique: 642, date: '2026-06-14', created_at: '2026-06-14T10:30:00Z' },
    ],
    atelier: [
      { id: 'ate_001', type: 'entree_coffre_achat', categorie: 'atelier', poids_g: 60.0, purete: '24K', piece_id: null, artisan_id: null, poids_perte_g: null, source: 'Achat or Al Waha', cours_applique: 642, date: '2026-06-19', notes: '' },

      { id: 'ate_002', type: 'sortie_coffre_fonderie', categorie: 'atelier', poids_g: 3.5, purete: '18K', piece_id: 'pie_001', artisan_id: null, poids_perte_g: null, source: 'Envoi fonderie', cours_applique: 642, date: '2026-06-12', notes: '' },
      { id: 'ate_003', type: 'entree_fonderie', categorie: 'atelier', poids_g: 3.5, purete: '18K', piece_id: 'pie_001', artisan_id: null, poids_perte_g: null, source: 'Réception fonderie', cours_applique: 642, date: '2026-06-12', notes: '' },
      { id: 'ate_004', type: 'sortie_fonderie', categorie: 'atelier', poids_g: 3.4, purete: '18K', piece_id: 'pie_001', artisan_id: null, poids_perte_g: -0.1, source: 'Bijou brut', cours_applique: 642, date: '2026-06-13', notes: '' },
      { id: 'ate_005', type: 'entree_coffre_retour_fonderie', categorie: 'atelier', poids_g: 3.4, purete: '18K', piece_id: 'pie_001', artisan_id: null, poids_perte_g: null, source: 'Retour fonderie', cours_applique: 642, date: '2026-06-13', notes: '' },
      { id: 'ate_006', type: 'sortie_coffre_artisan', categorie: 'atelier', poids_g: 3.4, purete: '18K', piece_id: 'pie_001', artisan_id: 'arn_001', poids_perte_g: null, source: 'Affectation préparation', cours_applique: 642, date: '2026-06-13', notes: '' },
      { id: 'ate_007', type: 'entree_artisan', categorie: 'atelier', poids_g: 3.4, purete: '18K', piece_id: 'pie_001', artisan_id: 'arn_001', poids_perte_g: null, source: 'Réception préparation', cours_applique: 642, date: '2026-06-13', notes: '' },
      { id: 'ate_008', type: 'sortie_artisan', categorie: 'atelier', poids_g: 3.35, purete: '18K', piece_id: 'pie_001', artisan_id: 'arn_001', poids_perte_g: -0.05, source: 'Retour artisan', cours_applique: 642, date: '2026-06-14', notes: '' },
      { id: 'ate_009', type: 'entree_coffre_retour_artisan', categorie: 'atelier', poids_g: 3.35, purete: '18K', piece_id: 'pie_001', artisan_id: 'arn_001', poids_perte_g: null, source: 'Retour artisan', cours_applique: 642, date: '2026-06-14', notes: '' },
      { id: 'ate_010', type: 'sortie_coffre_artisan', categorie: 'atelier', poids_g: 3.35, purete: '18K', piece_id: 'pie_001', artisan_id: 'arn_002', poids_perte_g: null, source: 'Affectation sertissage', cours_applique: 642, date: '2026-06-14', notes: '' },
      { id: 'ate_011', type: 'entree_artisan', categorie: 'atelier', poids_g: 3.35, purete: '18K', piece_id: 'pie_001', artisan_id: 'arn_002', poids_perte_g: null, source: 'Réception sertissage', cours_applique: 642, date: '2026-06-14', notes: '' },

      { id: 'ate_012', type: 'sortie_coffre_pret_client', categorie: 'atelier', poids_g: 1.5, purete: '18K', piece_id: null, artisan_id: null, poids_perte_g: null, source: 'Complément or commande cmd_003', cours_applique: 642, date: '2026-06-15', notes: '' },
      { id: 'ate_013', type: 'sortie_coffre_fonderie', categorie: 'atelier', poids_g: 7.5, purete: '18K', piece_id: 'pie_002', artisan_id: null, poids_perte_g: null, source: 'Envoi fonderie', cours_applique: 642, date: '2026-06-15', notes: '' },
      { id: 'ate_014', type: 'entree_fonderie', categorie: 'atelier', poids_g: 7.5, purete: '18K', piece_id: 'pie_002', artisan_id: null, poids_perte_g: null, source: 'Réception fonderie', cours_applique: 642, date: '2026-06-15', notes: '' },
      { id: 'ate_015', type: 'sortie_fonderie', categorie: 'atelier', poids_g: 7.4, purete: '18K', piece_id: 'pie_002', artisan_id: null, poids_perte_g: -0.1, source: 'Bijou brut', cours_applique: 642, date: '2026-06-16', notes: '' },
      { id: 'ate_016', type: 'entree_coffre_retour_fonderie', categorie: 'atelier', poids_g: 7.4, purete: '18K', piece_id: 'pie_002', artisan_id: null, poids_perte_g: null, source: 'Retour fonderie', cours_applique: 642, date: '2026-06-16', notes: '' },

      { id: 'ate_017', type: 'entree_finition', categorie: 'atelier', poids_g: 1.95, purete: '18K', piece_id: 'pie_003', artisan_id: null, poids_perte_g: null, source: 'Réception finition', cours_applique: 639, date: '2026-06-13', notes: '' },
      { id: 'ate_018', type: 'sortie_finition_client', categorie: 'atelier', poids_g: 1.93, purete: '18K', piece_id: 'pie_003', artisan_id: null, poids_perte_g: null, source: 'Livraison client', cours_applique: 639, date: '2026-06-14', notes: '' },
    ],
  },

  pieces: [
    { id: 'pie_001', commande_id: 'cmd_001', client_id: 'cli_001', type_metal: 'or', poids_initial_g: 3.5, poids_actuel_g: 3.35, purete: '18K', statut: 'chez_artisan', localisation_actuelle: 'artisan', artisan_actuel_id: 'arn_002', etapes_artisan_requises: ['préparation', 'sertissage'], douane_requise: false, date_creation: '2026-06-12', date_finition: null, date_sortie_finale: null, created_at: '2026-06-12T09:15:00Z' },
    { id: 'pie_002', commande_id: 'cmd_003', client_id: 'cli_003', type_metal: 'or', poids_initial_g: 7.5, poids_actuel_g: 7.4, purete: '18K', statut: 'en_attente_chef_atelier', localisation_actuelle: 'coffre', artisan_actuel_id: null, etapes_artisan_requises: ['sertissage', 'gravure'], douane_requise: false, date_creation: '2026-06-15', date_finition: null, date_sortie_finale: null, created_at: '2026-06-15T11:00:00Z' },
    { id: 'pie_003', commande_id: 'cmd_004', client_id: 'cli_001', type_metal: 'or', poids_initial_g: 2.0, poids_actuel_g: 1.93, purete: '18K', statut: 'livree_client', localisation_actuelle: 'client', artisan_actuel_id: null, etapes_artisan_requises: [], douane_requise: false, date_creation: '2026-06-05', date_finition: '2026-06-13', date_sortie_finale: '2026-06-14', created_at: '2026-06-05T09:00:00Z' },
  ],

  creditsClient: [
    { id: 'cre_001', client_id: 'cli_001', commande_id: 'cmd_001', type: 'charge_modele_3d', montant_mad: 250, poids_or_g: null, cours_applique: null, date: '2026-06-12', notes: '', created_at: '2026-06-12T09:15:00Z' },
    { id: 'cre_002', client_id: 'cli_001', commande_id: 'cmd_001', type: 'charge_honoraires', montant_mad: 120, poids_or_g: null, cours_applique: null, date: '2026-06-12', notes: '', created_at: '2026-06-12T09:15:00Z' },

    { id: 'cre_003', client_id: 'cli_003', commande_id: 'cmd_003', type: 'charge_modele_3d', montant_mad: 300, poids_or_g: null, cours_applique: null, date: '2026-06-15', notes: '', created_at: '2026-06-15T11:00:00Z' },
    { id: 'cre_004', client_id: 'cli_003', commande_id: 'cmd_003', type: 'charge_honoraires', montant_mad: 120, poids_or_g: null, cours_applique: null, date: '2026-06-15', notes: '', created_at: '2026-06-15T11:00:00Z' },
    { id: 'cre_005', client_id: 'cli_003', commande_id: 'cmd_003', type: 'charge_or_prete', montant_mad: 963, poids_or_g: 1.5, cours_applique: 642, date: '2026-06-15', notes: 'Complément or via coffre', created_at: '2026-06-15T11:05:00Z' },
    { id: 'cre_006', client_id: 'cli_003', commande_id: 'cmd_003', type: 'paiement', montant_mad: 200, poids_or_g: null, cours_applique: null, date: '2026-06-18', notes: 'Acompte', created_at: '2026-06-18T10:00:00Z' },

    { id: 'cre_007', client_id: 'cli_001', commande_id: 'cmd_004', type: 'charge_honoraires', montant_mad: 120, poids_or_g: null, cours_applique: null, date: '2026-06-05', notes: '', created_at: '2026-06-05T09:00:00Z' },
    { id: 'cre_008', client_id: 'cli_001', commande_id: 'cmd_004', type: 'paiement', montant_mad: 120, poids_or_g: null, cours_applique: null, date: '2026-06-14', notes: 'Solde à la livraison', created_at: '2026-06-14T16:00:00Z' },
  ],

  balayures: [
    { id: 'bal_001', type: 'Incinération', poids_initial_g: 100, poids_traite_g: 12.5, poids_pur_24k_g: 8.2, cours_applique: 642, valeur_mad: 5264, date: '2026-06-19', created_at: '2026-06-19T09:10:00Z' },
  ],

  raffinages: [
    { id: 'raf_001', quantite_24k_g: 10, purete_cible: '18K', quantite_resultat_g: 13.33, cours_applique: 642, valeur_mad: 6420, date: '2026-06-18', created_at: '2026-06-18T14:20:00Z' },
    { id: 'raf_002', quantite_24k_g: 5, purete_cible: '18K', quantite_resultat_g: 6.67, cours_applique: 639, valeur_mad: 3195, date: '2026-06-12', created_at: '2026-06-12T11:00:00Z' },
  ],

  caisseSnapshots: [
    { id: 'cas_001', type_transaction: 'Achat or', poids_g: 3.5, cours_applique: 642, montant_mad: 2247, commande_id: null, date: '2026-06-19', heure: '09:15', created_at: '2026-06-19T09:15:00Z' },
    { id: 'cas_002', type_transaction: 'Vente bijou', poids_g: 5.2, cours_applique: 642, montant_mad: 3338, commande_id: null, date: '2026-06-19', heure: '11:42', created_at: '2026-06-19T11:42:00Z' },
  ],

  articles: [
    { id: 'art_001', nom: 'Bague solitaire', poids_or_g: 3.2, taille: '52', type_pierres: 'Diamant', carats: '0.3ct', photo_url: null, created_at: '2026-05-01T00:00:00Z' },
    { id: 'art_002', nom: 'Collier 18K', poids_or_g: 5.8, taille: '45cm', type_pierres: 'Zircone', carats: null, photo_url: null, created_at: '2026-05-10T00:00:00Z' },
    { id: 'art_003', nom: 'Bracelet jonc', poids_or_g: 12.5, taille: '18cm', type_pierres: 'Sans pierres', carats: null, photo_url: null, created_at: '2026-04-15T00:00:00Z' },
  ],
};
