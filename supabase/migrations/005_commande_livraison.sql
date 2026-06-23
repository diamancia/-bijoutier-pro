-- ============================================================
-- Bijoutier Pro — Migration 005
-- Récap livraison commande : poids livré, gain (±g), réglé, poinçon douane.
-- ============================================================

ALTER TABLE commandes ADD COLUMN IF NOT EXISTS poids_livraison_g NUMERIC(10,3);
ALTER TABLE commandes ADD COLUMN IF NOT EXISTS gain_g NUMERIC(10,3);
ALTER TABLE commandes ADD COLUMN IF NOT EXISTS regle BOOLEAN DEFAULT false;
ALTER TABLE commandes ADD COLUMN IF NOT EXISTS poincon_douane BOOLEAN DEFAULT false;
