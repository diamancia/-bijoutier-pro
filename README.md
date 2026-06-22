# Bijoutier Pro — Guide de mise en place

## Structure du projet

```
bijoutier-pro/
├── index.html                    ← Application principale
├── vercel.json                   ← Config déploiement Vercel
├── js/
│   ├── store.js                  ← Store central (données + événements)
│   ├── seed-data.js              ← Données initiales de démo
│   ├── supabase-client.js        ← Connexion Supabase
│   └── services/
│       └── metier.js             ← Logique métier (tous les services)
├── supabase/
│   └── migrations/
│       └── 001_schema.sql        ← Schéma base de données
└── README.md
```

## Étape 1 — GitHub

1. Aller sur https://github.com → **New repository**
2. Nom : `bijoutier-pro` — **Private**
3. Téléverser tous les fichiers ci-dessus dans le repo
4. Ou en ligne de commande :
   ```bash
   git init
   git add .
   git commit -m "P01: Store central + schéma SQL + services métier"
   git remote add origin https://github.com/TON_USER/bijoutier-pro.git
   git push -u origin main
   ```

## Étape 2 — Supabase

1. Aller sur https://supabase.com → **New Project**
2. Choisir un mot de passe fort pour la base
3. Région : **West EU (Ireland)** ou la plus proche
4. Une fois le projet créé :
   - Aller dans **SQL Editor** (menu gauche)
   - Coller tout le contenu de `supabase/migrations/001_schema.sql`
   - Cliquer **Run**
5. Aller dans **Settings > API** :
   - Copier **Project URL** → mettre dans `js/supabase-client.js`
   - Copier **anon public key** → mettre dans `js/supabase-client.js`

## Étape 3 — Vercel

1. Aller sur https://vercel.com → **Add New Project**
2. Importer le repo GitHub `bijoutier-pro`
3. Framework : **Other**
4. Cliquer **Deploy**
5. Vercel donne une URL type `bijoutier-pro-xxx.vercel.app`

## Étape 4 — Variables d'environnement (optionnel)

Dans Vercel > Settings > Environment Variables :
- `SUPABASE_URL` = ton URL Supabase
- `SUPABASE_ANON_KEY` = ta clé anon

---

## Prochaines étapes de développement

Voir le plan d'implémentation P01→P14 dans la conversation Claude.
