# PROJECT_CONTEXT — Système Bijoutier

## Objectif

Créer un SaaS de gestion bijoutier basé sur un système de flux d’or (grammes) avec traçabilité complète et gestion financière client.

---

## Principe fondamental

Chaque module respecte :

ENTREE = quantité mesurée
SORTIE = quantité mesurée

Traçabilité obligatoire.

---

## Modules principaux

### 1. Commande Client

Entrée :

* client
* type (or ou argent)
* modèle 3D (prix)
* honoraires

Règles :

* si argent → conversion en or
* si or insuffisant → compléter via coffre

Sortie :

* commande créée
* crédit client mis à jour

---

### 2. Crédit Client

Entrée :

* prix modèle 3D
* honoraires
* or prêté
* montants non payés

Sortie :

* paiements

Objectif :

* solde = 0 en fin de commande

---

### 3. Coffre

Entrée :

* achat or
* retour fonderie
* retour artisans
* retour douane

Sortie :

* envoi fonderie
* affectation artisans

---

### 4. Fonderie

Entrée :

* or

Sortie :

* bijou brut

Règle :

* retour obligatoire vers coffre

---

### 5. Chef d’atelier

Rôle :

* contrôle
* décision

Entrée :

* pièces

Sortie :

* affectation artisan

---

### 6. Artisans

Types :

* préparation
* pré-polissage
* sertissage
* gravure

Entrée :

* grammes

Sortie :

* grammes modifiés (±)

---

### 7. Douane

Entrée :

* grammes exacts

Sortie :

* grammes exacts

Règle stricte :

* aucune variation

---

### 8. Finition

Entrée :

* pièce

Sortie :

* bijou fini

---

### 9. Sortie finale

* retour coffre
* ou livraison client

---

## Objectifs techniques

* suivi précis des grammes
* contrôle pertes/gains
* gestion crédit client
* architecture évolutive
