-- ============================================================
-- Bijoutier Pro — Schéma Supabase PostgreSQL
-- Migration 001 : Tables fondamentales
-- À exécuter dans Supabase > SQL Editor
-- ============================================================

-- ─── COURS DE L'OR ───
CREATE TABLE cours_or (
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

CREATE INDEX idx_cours_or_date ON cours_or(date DESC);
CREATE INDEX idx_cours_or_valide ON cours_or(valide) WHERE valide = true;

-- ─── CLIENTS ───
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  telephone TEXT,
  bijouterie TEXT,
  tarif_prestation NUMERIC(10,2) DEFAULT 100,
  notes TEXT,
  actif BOOLEAN DEFAULT true,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_clients_nom ON clients(nom);
CREATE INDEX idx_clients_user ON clients(user_id);

-- ─── COMMANDES ───
CREATE TABLE commandes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id),
  type TEXT NOT NULL,                          -- Bague, Collier, Bracelet, etc.
  poids_or_g NUMERIC(10,3) NOT NULL,
  purete TEXT DEFAULT '18K',
  pierres TEXT DEFAULT 'Sans pierres',
  taille TEXT,
  couleur_or TEXT DEFAULT 'Jaune',             -- Jaune, Rose, Blanc
  date_depot_or DATE NOT NULL,
  date_livraison_prevue DATE NOT NULL,
  date_livraison_effective DATE,
  statut TEXT DEFAULT 'en_cours'               -- en_cours, prete, livree, annulee
    CHECK (statut IN ('en_cours', 'prete', 'livree', 'annulee')),
  tarif_prestation NUMERIC(10,2),              -- copié du client au moment du dépôt
  cours_depot NUMERIC(10,2),                   -- cours au moment du dépôt
  notes TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_commandes_client ON commandes(client_id);
CREATE INDEX idx_commandes_statut ON commandes(statut);
CREATE INDEX idx_commandes_livraison ON commandes(date_livraison_prevue);
CREATE INDEX idx_commandes_user ON commandes(user_id);

-- ─── STOCK MOUVEMENTS ───
CREATE TABLE stock_mouvements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL                            -- entree_propre, sortie_propre, depot_client, sortie_client
    CHECK (type IN ('entree_propre', 'sortie_propre', 'depot_client', 'sortie_client', 'balayure', 'raffinage')),
  categorie TEXT NOT NULL                       -- propre, client
    CHECK (categorie IN ('propre', 'client')),
  poids_g NUMERIC(10,3) NOT NULL,
  purete TEXT DEFAULT '24K',
  source TEXT,                                  -- description libre
  client_id UUID REFERENCES clients(id),
  commande_id UUID REFERENCES commandes(id),
  cours_applique NUMERIC(10,2),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_stock_type ON stock_mouvements(type);
CREATE INDEX idx_stock_categorie ON stock_mouvements(categorie);
CREATE INDEX idx_stock_client ON stock_mouvements(client_id);
CREATE INDEX idx_stock_date ON stock_mouvements(date DESC);

-- ─── BALAYURES ───
CREATE TABLE balayures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL DEFAULT 'Incinération'
    CHECK (type IN ('Incinération', 'Fonte')),
  poids_initial_g NUMERIC(10,3) NOT NULL,
  poids_traite_g NUMERIC(10,3),
  poids_pur_24k_g NUMERIC(10,3),
  cours_applique NUMERIC(10,2),
  valeur_mad NUMERIC(12,2) GENERATED ALWAYS AS (poids_pur_24k_g * cours_applique) STORED,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── RAFFINAGES ───
CREATE TABLE raffinages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quantite_24k_g NUMERIC(10,3) NOT NULL,
  purete_cible TEXT DEFAULT '18K',
  facteur_conversion NUMERIC(6,4),             -- ex: 1.3333 pour 24K→18K
  quantite_resultat_g NUMERIC(10,3) GENERATED ALWAYS AS (quantite_24k_g * 24.0 / 
    CASE purete_cible 
      WHEN '18K' THEN 18 
      WHEN '14K' THEN 14 
      WHEN '22K' THEN 22 
      WHEN '9K' THEN 9 
      ELSE 24 
    END) STORED,
  cours_applique NUMERIC(10,2),
  valeur_mad NUMERIC(12,2),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── ARTICLES (CATALOGUE) ───
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  poids_or_g NUMERIC(10,3),
  taille TEXT,
  type_pierres TEXT DEFAULT 'Sans pierres',
  carats TEXT,
  photo_url TEXT,
  actif BOOLEAN DEFAULT true,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── CAISSE SNAPSHOTS ───
CREATE TABLE caisse_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type_transaction TEXT NOT NULL,               -- Achat or, Vente bijou, Dépôt client, Raffinage
  poids_g NUMERIC(10,3),
  cours_applique NUMERIC(10,2),
  montant_mad NUMERIC(12,2) NOT NULL,
  commande_id UUID REFERENCES commandes(id),
  client_id UUID REFERENCES clients(id),
  sens TEXT DEFAULT 'entree'                    -- entree, sortie
    CHECK (sens IN ('entree', 'sortie')),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  heure TIME NOT NULL DEFAULT CURRENT_TIME,
  notes TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_caisse_date ON caisse_snapshots(date DESC);
CREATE INDEX idx_caisse_type ON caisse_snapshots(type_transaction);

-- ─── DOUANE (préparé pour M12) ───
CREATE TABLE douane (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('import', 'export')),
  poids_g NUMERIC(10,3) NOT NULL,
  purete TEXT DEFAULT '24K',
  pays_origine TEXT,
  pays_destination TEXT,
  frais_mad NUMERIC(12,2) DEFAULT 0,
  reference_doc TEXT,
  commande_id UUID REFERENCES commandes(id),
  statut TEXT DEFAULT 'en_cours' CHECK (statut IN ('en_cours', 'valide', 'refuse')),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- VUES CALCULÉES (pas de données statiques)
-- ============================================================

-- Stock propre actuel (somme des mouvements)
CREATE VIEW v_stock_propre AS
SELECT 
  purete,
  SUM(CASE WHEN type IN ('entree_propre', 'balayure', 'raffinage') THEN poids_g ELSE 0 END)
  - SUM(CASE WHEN type = 'sortie_propre' THEN poids_g ELSE 0 END) AS total_g
FROM stock_mouvements
WHERE categorie = 'propre'
GROUP BY purete;

-- Stock client actuel (or déposé non encore restitué)
CREATE VIEW v_stock_client AS
SELECT 
  sm.client_id,
  c.nom AS client_nom,
  sm.purete,
  SUM(CASE WHEN sm.type = 'depot_client' THEN sm.poids_g ELSE 0 END)
  - SUM(CASE WHEN sm.type = 'sortie_client' THEN sm.poids_g ELSE 0 END) AS total_g
FROM stock_mouvements sm
JOIN clients c ON c.id = sm.client_id
WHERE sm.categorie = 'client'
GROUP BY sm.client_id, c.nom, sm.purete
HAVING SUM(CASE WHEN sm.type = 'depot_client' THEN sm.poids_g ELSE 0 END)
     - SUM(CASE WHEN sm.type = 'sortie_client' THEN sm.poids_g ELSE 0 END) > 0;

-- Commandes avec jours restants et alertes
CREATE VIEW v_commandes_alertes AS
SELECT 
  cmd.*,
  c.nom AS client_nom,
  c.telephone AS client_telephone,
  (cmd.date_livraison_prevue - CURRENT_DATE) AS jours_restants,
  CASE 
    WHEN cmd.statut = 'livree' THEN 'ok'
    WHEN (cmd.date_livraison_prevue - CURRENT_DATE) < 0 THEN 'retard'
    WHEN (cmd.date_livraison_prevue - CURRENT_DATE) <= 2 THEN 'urgent'
    ELSE 'normal'
  END AS niveau_alerte
FROM commandes cmd
JOIN clients c ON c.id = cmd.client_id
WHERE cmd.statut NOT IN ('annulee');

-- CA par client (commandes livrées × tarif)
CREATE VIEW v_ca_par_client AS
SELECT 
  c.id AS client_id,
  c.nom,
  c.bijouterie,
  COUNT(cmd.id) AS nb_commandes_livrees,
  SUM(cmd.tarif_prestation) AS ca_total,
  MAX(cmd.date_livraison_effective) AS derniere_livraison
FROM clients c
LEFT JOIN commandes cmd ON cmd.client_id = c.id AND cmd.statut = 'livree'
GROUP BY c.id, c.nom, c.bijouterie;

-- CA par période
CREATE VIEW v_ca_par_jour AS
SELECT 
  cmd.date_livraison_effective AS jour,
  COUNT(cmd.id) AS nb_livraisons,
  SUM(cmd.tarif_prestation) AS ca_jour
FROM commandes cmd
WHERE cmd.statut = 'livree' AND cmd.date_livraison_effective IS NOT NULL
GROUP BY cmd.date_livraison_effective
ORDER BY jour DESC;

-- ============================================================
-- ROW LEVEL SECURITY (chaque bijoutier voit ses données)
-- ============================================================

ALTER TABLE cours_or ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE commandes ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_mouvements ENABLE ROW LEVEL SECURITY;
ALTER TABLE balayures ENABLE ROW LEVEL SECURITY;
ALTER TABLE raffinages ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE caisse_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE douane ENABLE ROW LEVEL SECURITY;

-- Politique : l'utilisateur ne voit que ses propres données
CREATE POLICY "Users see own data" ON cours_or FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own data" ON clients FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own data" ON commandes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own data" ON stock_mouvements FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own data" ON balayures FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own data" ON raffinages FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own data" ON articles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own data" ON caisse_snapshots FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own data" ON douane FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- TRIGGERS : updated_at automatique
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_cours_or_updated BEFORE UPDATE ON cours_or FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_clients_updated BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_commandes_updated BEFORE UPDATE ON commandes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_articles_updated BEFORE UPDATE ON articles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
