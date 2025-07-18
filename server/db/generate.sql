DROP DATABASE IF EXISTS GESTION_STOCK;
CREATE DATABASE IF NOT EXISTS GESTION_STOCK;
USE GESTION_STOCK;

-- Table Utilisateur
CREATE TABLE IF NOT EXISTS `Utilisateur` (
  `id` INT PRIMARY KEY,
  `nom` VARCHAR(255) NOT NULL,
  `prenom` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) UNIQUE NOT NULL,
  `mot_de_passe` VARCHAR(255) NOT NULL,
  `role` ENUM('etudiant', 'technicien', 'responsable') NOT NULL
);

-- Table Equipement
CREATE TABLE IF NOT EXISTS `Equipement` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nom` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `categorie` ENUM('stockable', 'solo') NOT NULL,
  `quantite` INT
);

-- Table stockable
CREATE TABLE IF NOT EXISTS `Stockable` (
  `id` INT PRIMARY KEY,
  `quantite` INT,
  `qr_code` TEXT,
  FOREIGN KEY (`id`) REFERENCES `Equipement`(`id`)
);
-- Table unique
CREATE TABLE IF NOT EXISTS `Solo` (
  `id` INT PRIMARY KEY,
  `etat` ENUM('disponible','en_cours', 'en_reparation','indisponible') NOT NULL DEFAULT 'disponible',
  FOREIGN KEY (`id`) REFERENCES `Equipement`(`id`)
);

-- Table Reservation
CREATE TABLE IF NOT EXISTS `Reservation` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `date_debut` DATETIME NOT NULL,
  `date_fin` DATETIME NOT NULL,
  `etat` ENUM('attente', 'validee', 'refusee', 'retournee') NOT NULL,
  `id_utilisateur` INT,
  FOREIGN KEY (`id_utilisateur`) REFERENCES `Utilisateur`(`id`)
);

-- Table Notification
CREATE TABLE IF NOT EXISTS `Notification` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `id_utilisateur` INT,
  `message` TEXT NOT NULL,
  `date_envoi` DATETIME NOT NULL,
  `statut` ENUM('envoye', 'lu') NOT NULL,
  FOREIGN KEY (`id_utilisateur`) REFERENCES `Utilisateur`(`id`)
);

-- Table associative pour gérer la relation N-N entre Reservation et Equipement
CREATE TABLE IF NOT EXISTS `Reservation_Equipement` (
  `id_reservation` INT,
  `id_equipement` INT,
  `quantite_reservee` INT NOT NULL,
  PRIMARY KEY (`id_reservation`, `id_equipement`),
  FOREIGN KEY (`id_reservation`) REFERENCES `Reservation`(`id`),
  FOREIGN KEY (`id_equipement`) REFERENCES `Equipement`(`id`)
);