-- ============================================================
-- Bijoutier Pro — Schéma Supabase PostgreSQL
-- Migration 002 : Pipeline atelier (Coffre → Fonderie → Chef d'atelier
-- → Artisans → Douane → Finition → Sortie) + Crédit Client + Cours argent
-- Additif uniquement — aucune table/colonne existante supprimée.
-- À exécuter après 001_schema.sql, dans Supabase > SQL Editor
-- ============================================================

-- ─── ARTISANS (référentiel, module 6) ───
CREATE TABLE artisans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  competences TEXT[] NOT NULL DEFAULT '{}',     -- préparation, pré-polissage, sertissage, gravure (un artisan peut en cumuler plusieurs)
  telephone TEXT,
  actif BOOLEAN DEFAULT true,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_artisans_competences ON artisans USING GIN (competences);
CREATE INDEX idx_artisans_user ON artisans(user_id);

-- ─── PIECES (en-cours physique traversant le pipeline) ───
CREATE TABLE pieces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commande_id UUID NOT NULL REFERENCES commandes(id),
  client_id UUID REFERENCES clients(id),
  type_metal TEXT NOT NULL DEFAULT 'or' CHECK (type_metal IN ('or', 'argent')),
  poids_initial_g NUMERIC(10,3) NOT NULL,
  poids_actuel_g NUMERIC(10,3) NOT NULL,
  purete TEXT DEFAULT '18K',
  statut TEXT NOT NULL DEFAULT 'creee'
    CHECK (statut IN ('creee', 'au_coffre', 'en_fonderie', 'chez_artisan', 'en_douane',
                       'en_attente_chef_atelier', 'en_finition', 'finie', 'livree_client',
                       'retour_coffre_final', 'annulee')),
  localisation_actuelle TEXT,                   -- commande, coffre, fonderie, artisan, douane, finition
  artisan_actuel_id UUID REFERENCES artisans(id),
  etapes_artisan_requises TEXT[] DEFAULT '{}',
  douane_requise BOOLEAN DEFAULT false,
  date_creation DATE DEFAULT CURRENT_DATE,
  date_finition DATE,
  date_sortie_finale DATE,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_pieces_commande ON pieces(commande_id);
CREATE INDEX idx_pieces_statut ON pieces(statut);
CREATE INDEX idx_pieces_artisan ON pieces(artisan_actuel_id);
CREATE INDEX idx_pieces_user ON pieces(user_id);

-- ─── CREDITS CLIENT (module 2 — prix modèle 3D, honoraires, or prêté, paiements) ───
CREATE TABLE credits_client (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id),
  commande_id UUID REFERENCES commandes(id),
  type TEXT NOT NULL CHECK (type IN ('charge_modele_3d', 'charge_honoraires', 'charge_or_prete', 'paiement')),
  montant_mad NUMERIC(12,2) NOT NULL CHECK (montant_mad >= 0),
  poids_or_g NUMERIC(10,3),                     -- renseigné uniquement pour charge_or_prete
  cours_applique NUMERIC(10,2),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_credits_client ON credits_client(client_id);
CREATE INDEX idx_credits_commande ON credits_client(commande_id);

-- ─── COURS DE L'ARGENT (miroir de cours_or) ───
CREATE TABLE cours_argent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  cours_mad_g NUMERIC(10,2) NOT NULL,
  vendeur TEXT,
  quantite_g NUMERIC(10,3),
  valide BOOLEAN DEFAULT false,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_cours_argent_date ON cours_argent(date DESC);
CREATE INDEX idx_cours_argent_valide ON cours_argent(valide) WHERE valide = true;

-- ============================================================
-- EXTENSION stock_mouvements : nouvelle catégorie 'atelier'
-- ============================================================

ALTER TABLE stock_mouvements DROP CONSTRAINT IF EXISTS stock_mouvements_type_check;
ALTER TABLE stock_mouvements DROP CONSTRAINT IF EXISTS stock_mouvements_categorie_check;

ALTER TABLE stock_mouvements ADD COLUMN piece_id UUID REFERENCES pieces(id);
ALTER TABLE stock_mouvements ADD COLUMN artisan_id UUID REFERENCES artisans(id);
ALTER TABLE stock_mouvements ADD COLUMN poids_perte_g NUMERIC(10,3);

ALTER TABLE stock_mouvements ADD CONSTRAINT stock_mouvements_categorie_check
  CHECK (categorie IN ('propre', 'client', 'atelier'));

ALTER TABLE stock_mouvements ADD CONSTRAINT stock_mouvements_type_check
  CHECK (type IN (
    -- valeurs existantes (P01)
    'entree_propre', 'sortie_propre', 'depot_client', 'sortie_client', 'balayure', 'raffinage',
    -- coffre (module 3)
    'entree_coffre_achat', 'entree_coffre_retour_fonderie', 'entree_coffre_retour_artisan',
    'entree_coffre_retour_douane', 'entree_coffre_retour_finition',
    'sortie_coffre_fonderie', 'sortie_coffre_artisan', 'sortie_coffre_pret_client',
    -- fonderie (module 4)
    'entree_fonderie', 'sortie_fonderie',
    -- artisans (module 6)
    'entree_artisan', 'sortie_artisan',
    -- douane (module 7)
    'entree_douane', 'sortie_douane',
    -- finition / sortie finale (modules 8-9)
    'entree_finition', 'sortie_finition_client', 'sortie_finition_coffre'
  ));

CREATE INDEX idx_stock_piece ON stock_mouvements(piece_id);
CREATE INDEX idx_stock_artisan ON stock_mouvements(artisan_id);

-- ============================================================
-- EXTENSION commandes (module 1 — type métal, modèle 3D, honoraires, or prêté)
-- ============================================================

ALTER TABLE commandes ADD COLUMN type_metal TEXT DEFAULT 'or' CHECK (type_metal IN ('or', 'argent'));
ALTER TABLE commandes ADD COLUMN prix_modele_3d_mad NUMERIC(10,2) DEFAULT 0;
ALTER TABLE commandes ADD COLUMN honoraires_mad NUMERIC(10,2);
ALTER TABLE commandes ADD COLUMN or_prete_g NUMERIC(10,3) DEFAULT 0;
ALTER TABLE commandes ADD COLUMN piece_id UUID REFERENCES pieces(id);

-- ============================================================
-- VUES CALCULÉES
-- ============================================================

-- Stock coffre actuel (gold géré par l'atelier, par pureté)
CREATE VIEW v_coffre_stock AS
SELECT
  purete,
  SUM(CASE WHEN type IN ('entree_coffre_achat', 'entree_coffre_retour_fonderie',
                          'entree_coffre_retour_artisan', 'entree_coffre_retour_douane',
                          'entree_coffre_retour_finition') THEN poids_g ELSE 0 END)
  - SUM(CASE WHEN type IN ('sortie_coffre_fonderie', 'sortie_coffre_artisan',
                            'sortie_coffre_pret_client') THEN poids_g ELSE 0 END) AS total_g
FROM stock_mouvements
WHERE categorie = 'atelier'
GROUP BY purete;

-- Pipeline pièces : statut courant enrichi (commande, client, artisan)
CREATE VIEW v_pieces_pipeline AS
SELECT
  p.*,
  c.type AS commande_type,
  c.date_livraison_prevue,
  cl.nom AS client_nom,
  a.nom AS artisan_nom
FROM pieces p
JOIN commandes c ON c.id = p.commande_id
LEFT JOIN clients cl ON cl.id = p.client_id
LEFT JOIN artisans a ON a.id = p.artisan_actuel_id;

-- Solde crédit client par commande (charges - paiements)
CREATE VIEW v_credits_client_solde AS
SELECT
  commande_id,
  client_id,
  SUM(CASE WHEN type = 'paiement' THEN -montant_mad ELSE montant_mad END) AS solde_mad
FROM credits_client
GROUP BY commande_id, client_id;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE artisans ENABLE ROW LEVEL SECURITY;
ALTER TABLE pieces ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits_client ENABLE ROW LEVEL SECURITY;
ALTER TABLE cours_argent ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own data" ON artisans FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own data" ON pieces FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own data" ON credits_client FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own data" ON cours_argent FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- TRIGGERS : updated_at automatique (réutilise update_updated_at() de 001)
-- ============================================================

CREATE TRIGGER trg_artisans_updated BEFORE UPDATE ON artisans FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_pieces_updated BEFORE UPDATE ON pieces FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_cours_argent_updated BEFORE UPDATE ON cours_argent FOR EACH ROW EXECUTE FUNCTION update_updated_at();
