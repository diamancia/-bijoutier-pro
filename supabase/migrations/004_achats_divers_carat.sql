-- ============================================================
-- Bijoutier Pro — Migration 004
-- Achats divers (Chdaya, sbika, dlala, cliente) + carat saisi sur cours_or.
-- ============================================================

-- Carat saisi par l'utilisateur sur un cours (le cours_mad_g reste l'équivalent 24k)
ALTER TABLE cours_or ADD COLUMN IF NOT EXISTS carat_saisi TEXT DEFAULT '24K';
ALTER TABLE cours_or ADD COLUMN IF NOT EXISTS cours_saisi NUMERIC(10,2);

-- Achats d'or au comptoir : gain = valeur marché 18k − coût payé
CREATE TABLE IF NOT EXISTS achats_divers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categorie TEXT NOT NULL CHECK (categorie IN ('Chdaya', 'Sbika', 'Dlala', 'Cliente')),
  poids_g NUMERIC(10,3) NOT NULL,
  carat NUMERIC(5,2) NOT NULL DEFAULT 18,          -- carat réel de l'or reçu (ex : 14.5)
  prix_achat_mad_g NUMERIC(10,2) NOT NULL,         -- prix payé par gramme
  cours_18k_applique NUMERIC(10,2),                -- cours 18k du jour
  poids_18k_equiv_g NUMERIC(10,3),                 -- poids × carat / 18
  cout_mad NUMERIC(12,2),                          -- poids × prix_achat_mad_g
  valeur_marche_mad NUMERIC(12,2),                 -- poids_18k_equiv × cours_18k
  gain_mad NUMERIC(12,2),                          -- valeur_marche − cout
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_achats_divers_date ON achats_divers(date DESC);
CREATE INDEX IF NOT EXISTS idx_achats_divers_categorie ON achats_divers(categorie);

ALTER TABLE achats_divers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users see own data" ON achats_divers;
CREATE POLICY "Users see own data" ON achats_divers FOR ALL USING (auth.uid() = user_id);
