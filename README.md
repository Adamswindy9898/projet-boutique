# Plateforme de gestion de boutique (Next.js)

Vitrine publique (produits, commande WhatsApp, appel, code QR) + espace gérant
(produits, gestion du stock, inventaires et historique des mouvements séparés, factures/devis imprimables, clients, chiffre d'affaires).
La configuration par défaut est orientée vente de produits électroniques : téléphones,
audio, informatique, chargeurs et accessoires.
Les factures et devis affichent un total unique sans TVA ni acompte.

## Démarrer
```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start   # production
```

## Personnaliser (un seul fichier : `src/config/shop.ts`)
- Nom, slogan, contacts du gérant (téléphone, WhatsApp, email, adresse), NINEA et RCCM
- **Logo** : le logo OUSMATECH est fourni dans `public/ousmatech-logo.png` ; modifiez `logo` dans `src/config/shop.ts` pour utiliser une autre image.
- **Connexion admin initiale** : identifiant `admin@gestcom.local`, mot de passe `Ousma2026!`. Changez-le dès la première connexion dans « Paramètres » ; l’administrateur peut aussi créer et supprimer des comptes utilisateurs. Les comptes initiaux précédents sont automatiquement migrés sans écraser un mot de passe personnalisé.

## Important
- Les données (produits, factures, clients et comptes) sont enregistrées **dans le navigateur** (localStorage) :
  elles ne sont pas partagées entre appareils. Les mots de passe sont dérivés avec PBKDF2, mais une
  authentification stockée côté navigateur ne protège pas les données contre une personne ayant accès à l’appareil.
  Pour la production ou un usage multi-appareils, brancher une base de données et une authentification côté serveur.
- Des données de démonstration sont chargées au premier lancement : bouton « Tout supprimer » sur le tableau de bord.
- « Excel » exporte un fichier CSV qui s'ouvre dans Excel ; « PDF » utilise l'impression du navigateur (Enregistrer au format PDF).
