-- Insertion dans Utilisateur
INSERT INTO Utilisateur (nom, prenom, email, mot_de_passe, role) VALUES
  ('El Amrani', 'Yassine', 'yassine.elamrani@umi.ac.ma', 'pass123', 'etudiant'),
  ('Bennani', 'Fatima', 'fatima.bennani@umi.ac.ma', 'pass456', 'etudiant'),
  ('Touhami', 'Hamza', 'hamza.touhami@umi.ac.ma', 'pass789', 'technicien'),
  ('Zerouali', 'Naima', 'naima.zerouali@umi.ac.ma', 'pass999', 'responsable');

-- Insertion dans Nom_Exemplaire
INSERT INTO Nom_Exemplaire (nom) VALUES 
    ('Kit Raspberry Pi 5 – 4GB RAM + accessoires'),
    ('Camera Board v2 - 8MP'),
    ('Ultrasonic sensor'),
    ('Détecteur de mouvement HC-SR501'),
    ('Capteur d''humidité du sol'),
    ('Module Bluetooth HC-05'),
    ('Câbles Dupont Jumper 30 cm'),
    ('Câbles Dupont Jumper 15 cm'),
    ('Imprimante 3D'),
    ('Pin connector kit'),
    ('Onduleur'),
    ('Serveur'),
    ('NVIDIA Jetson Nano'),
    ('NVIDIA GeForce RTX 3090 Ti'),
    ('XBee S2 ou S3 ZigBee (antenne fouet)'),
    ('XBee S2 ou S3 ZigBee (antenne intégrée)'),
    ('Afficheur LCD bleu'),
    ('Câble de connexion (kit)'),
    ('Breadboard'),
    ('Kit ESP32-WROVER + Caméra'),
    ('ESP32-WROVER seul');

-- Insertion dans Equipement
INSERT INTO Equipement (nom, description, quantite, disponibilite) VALUES 
    ('Kit Raspberry Pi 5 – 4GB RAM + accessoires', 'Description de l''équipement: Kit Raspberry Pi 5 – 4GB RAM + accessoires.', 10, 'disponible'),
    ('Camera Board v2 - 8MP', 'Description de l''équipement: Camera Board v2 - 8MP.', 10, 'disponible'),
    ('Ultrasonic sensor', 'Description de l''équipement: Ultrasonic sensor.', 8, 'disponible'),
    ('Détecteur de mouvement HC-SR501', 'Description de l''équipement: Détecteur de mouvement HC-SR501.', 8, 'disponible'),
    ('Capteur d''humidité du sol', 'Description de l''équipement: Capteur d''humidité du sol.', 15, 'disponible'),
    ('Module Bluetooth HC-05', 'Description de l''équipement: Module Bluetooth HC-05.', 30, 'disponible'),
    ('Câbles Dupont Jumper 30 cm', 'Description de l''équipement: Câbles Dupont Jumper 30 cm.', 4, 'disponible'),
    ('Câbles Dupont Jumper 15 cm', 'Description de l''équipement: Câbles Dupont Jumper 15 cm.', 4, 'disponible'),
    ('Imprimante 3D', 'Description de l''équipement: Imprimante 3D.', 1, 'disponible'),
    ('Pin connector kit', 'Description de l''équipement: Pin connector kit.', 1, 'disponible'),
    ('Onduleur', 'Description de l''équipement: Onduleur.', 1, 'disponible'),
    ('Serveur', 'Description de l''équipement: Serveur.', 1, 'disponible'),
    ('NVIDIA Jetson Nano', 'Description de l''équipement: NVIDIA Jetson Nano.', 1, 'disponible'),
    ('NVIDIA GeForce RTX 3090 Ti', 'Description de l''équipement: NVIDIA GeForce RTX 3090 Ti.', 1, 'disponible'),
    ('XBee S2 ou S3 ZigBee (antenne fouet)', 'Description de l''équipement: XBee S2 ou S3 ZigBee (antenne fouet).', 10, 'disponible'),
    ('XBee S2 ou S3 ZigBee (antenne intégrée)', 'Description de l''équipement: XBee S2 ou S3 ZigBee (antenne intégrée).', 10, 'disponible'),
    ('Afficheur LCD bleu', 'Description de l''équipement: Afficheur LCD bleu.', 3, 'disponible'),
    ('Câble de connexion (kit)', 'Description de l''équipement: Câble de connexion (kit).', 6, 'disponible'),
    ('Breadboard', 'Description de l''équipement: Breadboard.', 15, 'disponible'),
    ('Kit ESP32-WROVER + Caméra', 'Description de l''équipement: Kit ESP32-WROVER + Caméra.', 10, 'disponible'),
    ('ESP32-WROVER seul', 'Description de l''équipement: ESP32-WROVER seul.', 10, 'disponible');

-- Insertion dans Exemplaire
INSERT INTO Exemplaire (id_equipement, etat) 
SELECT id, 'disponible' FROM Equipement;
