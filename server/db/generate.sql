DROP DATABASE IF EXISTS GESTION_STOCK;
CREATE DATABASE IF NOT EXISTS GESTION_STOCK;
USE GESTION_STOCK;

-- Table Utilisateur
CREATE TABLE IF NOT EXISTS `Utilisateur` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
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
  `quantite` INT NOT NULL,
  `disponibilite` ENUM('disponible', 'indisponible') NOT NULL
);

-- Table Reservation
CREATE TABLE IF NOT EXISTS `Reservation` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `date_debut` DATETIME NOT NULL,
  `date_fin` DATETIME NOT NULL,
  `etat` ENUM('attente', 'validee', 'refusee') NOT NULL,
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