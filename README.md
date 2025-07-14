# GIMS - Gestion Informatique du Matériel et Stock

## Description du Projet

GIMS est une application web complète de gestion d'équipements universitaires pour l'Université Moulay Ismail. La plateforme permet la réservation, le suivi et la gestion des ressources techniques et scientifiques pour tous les acteurs de l'université.

## Structure du Projet

```txt
├── client/               # Application frontend React
│   ├── public/           # Ressources statiques
│   └── src/              # Code source React
│       ├── components/   # Composants réutilisables
│       ├── css/          # Fichiers de style
│       └── pages/        # Pages de l'application
└── server/               # Serveur backend Node.js
    ├── config/           # Configuration
    ├── controllers/      # Contrôleurs API
    ├── db/               # Scripts de base de données
    ├── routes/           # Routes API
    └── utilities/        # Utilitaires
```

## technologies Utilisées

### Frontend

- `React.js` - Bibliothèque JavaScript pour construire l'interface utilisateur
- `React Router` - Navigation entre les pages [`client/src/App.jsx`](client/src/App.jsx)
- `Chart.js` - Création de graphiques pour les tableaux de bord [`client/src/pages/responsable.jsx`](client/src/pages/responsable.jsx)
- `React Big Calendar` - Affichage des calendriers de réservation [`client/src/pages/etudiant.jsx`](client/src/pages/etudiant.jsx)
- `QRCode.react` - Génération de QR codes pour les équipements [`client/src/pages/technicien.jsx`](client/src/pages/technicien.jsx)
- `Moment.js` - Manipulation des dates [`client/src/pages/etudiant.jsx`](client/src/pages/etudiant.jsx)

### Backend

- `Node.js` - Environnement d'exécution JavaScript côté serveur
- `Express.js` - Framework web pour Node.js [`server/server.js`](server/server.js)
- `MySQL` - Système de gestion de base de données relationnelle [`server/config/dbConfig.js`](server/config/dbConfig.js)
- 'API RESTful' - Architecture pour les communications client-serveur

## Fonctionalités Principales

### Interface Étudiant [`client/src/pages/etudiant.jsx`](client/src/pages/etudiant.jsx)

- Parcourir les équipements disponibles
- Ajouter des équipements au panier
- Réserver des équipements pour une période donnée
- Consulter l'historique des réservations
- Afficher un calendrier des réservations
- Recevoir des notifications

### Interface Technicien [`client/src/pages/technicien.jsx`](client/src/pages/technicien.jsx)

- Gérer l'inventaire des équipements
- Ajouter, modifier ou supprimer des équipements
- Mettre à jour le statut des équipements (disponible, en réparation, etc.)
- Générer et télécharger des QR codes pour les équipements
- Traiter les retours d'équipements
- Gérer les utilisateurs

### Interface Responsable [`client/src/pages/responsable.jsx`](client/src/pages/responsable.jsx)

- Approuver ou refuser les demandes de réservation
- Surveiller les niveaux de stock
- Visualiser les statistiques d'utilisation via des graphiques
- Consulter l'historique des activités
- Gérer les notifications système

### Système de Notification [`server/controllers/notificationController.js`](server/controllers/notificationController.js)

- Notifications en temps réel pour les utilisateurs
- Alertes par email pour les changements de statut
- Interface de notification intégrée dans chaque tableau de bord

## Installation et Configuration

### Prérequis

- `Node.js` (v14 ou supérieur)
- `MySQL` (v8 ou supérieur)

### Installation du client

```zsh
cd client
npm install
npm start
```

### Installation du serveur

```zsh
cd server
npm install
# Configurer le fichier .env avec les informations de la base de données
npm start
```

## Interfaces Utilisateur

- Page d'accueil [`client/src/pages/home.jsx`](client/src/pages/home.jsx) - Présentation du système GIMS
- Tableau de bord étudiant [`client/src/pages/etudiant.jsx`](client/src/pages/etudiant.jsx) - Interface pour les réservations et suivi
- Tableau de bord technicien [`client/src/pages/technicien.jsx`](client/src/pages/technicien.jsx) - Gestion de l'inventaire et maintenance
- Tableau de bord responsable [`client/src/pages/responsable.jsx`](client/src/pages/responsable.jsx) - Supervision et approbation

## Modèle de Données

Le système gère plusieurs types d'équipements :

- Équipements stockables (quantité multiple)
- Équipements solo (articles individuels)

Les statuts des équipements incluent :

- Disponible
- En utilisation
- En réparation
- Indisponible
