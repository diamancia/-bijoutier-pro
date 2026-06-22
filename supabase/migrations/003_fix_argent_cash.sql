-- ============================================================
-- Bijoutier Pro — Migration 003
-- Correction : "argent" = paiement cash (pas le métal argent).
-- Retire l'infrastructure cours_argent (mauvaise interprétation initiale)
-- et ajoute le PIN d'authentification des artisans.
-- ============================================================

DROP VIEW IF EXISTS v_cours_argent_actif;
DROP TABLE IF EXISTS cours_argent;

ALTER TABLE artisans ADD COLUMN IF NOT EXISTS pin TEXT;
