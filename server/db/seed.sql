USE GESTION_STOCK;

-- Insertion dans Utilisateur
INSERT INTO Utilisateur (nom, prenom, email, mot_de_passe, role) VALUES
  ('El Amrani', 'Yassine', 'yassine.elamrani@umi.ac.ma', 'pass123', 'etudiant'),
  ('Bennani', 'Fatima', 'fatima.bennani@umi.ac.ma', 'pass456', 'etudiant'),
  ('Touhami', 'Hamza', 'hamza.touhami@umi.ac.ma', 'pass789', 'technicien'),
  ('Zerouali', 'Naima', 'naima.zerouali@umi.ac.ma', 'pass999', 'responsable');

-- Insertion dans Equipement
INSERT INTO Equipement (nom, description, categorie, quantite) VALUES

  ('Kit Raspberry',
    'Raspberry Pi 5 – 4GB RAM 
    2.4GHz quad-core 64-bit Arm Cortex-A76 CPU  
    GIMSU VideoCore VII 
    802.11ac Wi-Fi + Bluetooth 5.0  
    Interface PCIe 2.0 x1  
    4 × Ports USB (2 x 3.0 & 2 x 2.0) Gigabit Ethernet 
    2 x 4 ports MIPI  
    MicroSD 32 Go 
    Boîtier  
    Adaptateur secteur 
    Dissipateur de chaleur 
    Cable adaptateur USB-C vers USB-3.0 
    Cable adaptateur USB-C vers HDMI',
    'stockable', 10),

  ('Camera Board v2 - 8 Megapixels compatible Raspberry Pi',
    'Dimensions: 25mm x 23mm x 9mm 
    Capture vidéo à 1080p30, 720p60 et 640x480p90 
    Logiciels pris en charge par Raspbian 
    Pixel de 1.12 μm X avec technologie OmniBSI  
    Taille optique de 1/4"',
    'stockable', 10),

  ('Ultrasonic sensor',
    'Dimensions: 25mm x 23mm x 9mm 
    Capture vidéo à 1080p30, 720p60 et 640x480p90 
    Logiciels pris en charge par Raspbian 
    Pixel de 1.12 μm X avec technologie OmniBSI  
    Taille optique de 1/4"',
    'stockable', 8),

  ('Détecteur de mouvement HC-SR501',
    'Compatible Arduino 
    Courant de repos: <2mA 
    Angle effectif: <15° 
    Distance de portée: 2cm - 500 cm 
    Résolution: 0.3 cm 
    Mode de connexion: VCC/ trig(T)/ Echo(R)/ GND',
    'stockable', 8),

  ('Capteur dhumidité du sol',
    'Compatible Arduino 
    Distance de détection : 3m - 7m 
    Angle de détection : 120 degrés 
    Temps de retard : 0.3 seconde - 5 minutes (réglable) 
    Modes de fonctionnement : Repeatable/Non-repeatable',
    'stockable', 15),

  ('Module Bluetooth HC-05',
    'Compatible Arduino 
    Sorties numérique et analogique : varie de 0V à 5V.  
    LED indiquant l\'alimentation électrique. 
    Potentiomètre de déclenchement',
    'stockable', 30),

  ('Câbles Dupont Jumper 30 cm',
    'Compatible Arduino 
    Male to female, 40 broches. 
    30 cm',
    'stockable', 4),

  ('Câbles Dupont Jumper 15 cm',
    'Compatible Arduino 
    Male to female, 40 broches. 
    15 cm',
    'stockable', 4),

  ('Imprimante 3D',
    'Technologie d impression: FDM 
    Volume de construction: 220x220x250mm 
    Précision d\'impression: 100 ± 0.1mm 
    Hauteur de la couche: 0.1-0.35mm 
    Diamètre du filament: 1.75mm 
    Diamètre de la buse: 0.4mm (compatible avec la buse 0.6/0.8mm) 
    Surface de construction: plaque de construction flexible PEI 
    Mode de mise à niveau: nivellement automatique mains libres 
    Écran d\'affichage: écran tactile couleur 4.3" 
    Al Caméra: Oui 
    Récupération de perte de puissance: Oui 
    Capteur de sortie de filament: Oui 
    Filaments pris en charge: ABS, PLA, PETG, PET, TPU, PA, ASA, PC, PLA-CF, PA-CF, PET-CF 
    Format de fichier imprimable: G-Code 
    Logiciel de tranchage: Creality Print, Cura 5.0 et version ultérieure 
    Formats de fichier pour trancher: STL, OBJ, 3MF 
    Langues de l\'interface utilisateur : anglais',
    'solo', 1),

  ('Pin connector kit',
    '1550 PCS 2.54mm dupont connectors 
    760 PCS 2.54mm JST-XH connectors 
    1.5m 10-wire ribbon cable. 
    terminal crimping tool',
    'solo', 1),

  ('Onduleur',
    'Puissance : 1500 VA / 865 W 
    Autonomie : 20 minutes  
    Technologie : Line-Interactive  
    Temps de commutation : inférieur à 8 ms 
    Protection contre les surtensions 
    Filtres EMI/RFI 
    Ports de communication : USB et serial 
    Logiciel de Gestion  
    Mode bypass',
    'solo', 1),

  ('Serveur',
    'CPU : Intel Xeon E-2136 
    RAM : 32 Go DDR4 ECC (2x 16 Go) 
    Carte Mère : Dell PowerEdge T140 Motherboard (supporte Intel Xeon E-100 series) 
    Stockage : 1 To SSD + 4 To HDD 
    Carte réseau : Intel Ethernet Server Adapter I350-T2 (dual-port) 
    Alimentation : Corsair RM750x 750W 80 PLUS Gold (x2) 
    Refroidissement : Noctua NF-F12 industrialPPC-2000 PWM (x4)',
    'solo', 1),

  ('NVIDIA Jetson Nano',
    'Memory: 4GB 64-bit LPDDR4 25.6GB/s 
    AI Performance: 472 GFLOPS 
    GIMSU: 128-core NVIDIA Maxwell architecture GIMSU 
    GIMSU Max Frequency: 921MHz 
    CPU: Quad-core ARM Cortex-A57 MPCore processor 
    Storage: 16GB eMMC 5.1 
    Sortie vidéo 1 x DisplayPort 
    USB 3.0 4 x USB 3.0  
    Ethernet 10/100/1000 (Gigabit)',
    'solo', 1),

  ('NVIDIA GeForce RTX 3090 Ti',
    'NVIDIA CUDA Cores 10752 
    Boost Clock 1.86 GHz 
    Memory Size 24 GB 
    Memory Type GDDR6X 
    Slot: 3-Slot 
    Supplementary Power Connectors: 3x PCIe 8-pin cables (adapter in box) OR 
    450W or greater PCIe Gen 5 cable',
    'solo', 1),

  ('XBee S2 ou S3 ZigBee',
    'Antenne fouet',
    'stockable', 10),

  ('XBee S2 ou S3 ZigBee',
    'Antenne intégrée',
    'stockable', 10),

  ('Afficheur LCD bleu',
    'HOPP1602-Écran LCD Bleu, Wild 5V pour Arduino, 16x2, 
    Rick PCF8574T PCF8574 IIC I2C, 1602',
    'stockable', 3),

  ('Câble de connexion (kit)',
    'mâle à mâle + mâle à femelle et femelle à femelle, fil de 
    raccordement pour Arduino, kit de bricolage, 
    10/20/30/40cm',
    'stockable', 6),

  ('Breadboard',
    'Sans soudure  
    Contacts à ressorts 
    400 points',
    'stockable', 15),

  ('Kit ESP32-WROVER + Caméra',
    'ESP32-WROVER: 
    RAM 520KB SRAM + 4M PSRAM 
    Bluetooth 4.2 BR/ Wi-Fi 802.11 b/g/n/ 
    Support interface UART/SPI/I2C/PWM 
    GIMSIO pin soudés  
    Security WPA/WPA2/WPA2-Enterprise/WPS 
    MicroSD card slot 
    Module Caméra ESP OV2640, 160 Degree 850nm 
    1GB Memory Card 
    USB cable program,  
    Carte de développement GIMSIO femelles',
    'stockable', 10),

  ('ESP32-WROVER seul',
    'RAM 520KB SRAM + 4M PSRAM 
    Bluetooth 4.2 BR/EDR and BLE standards 
    Wi-Fi 802.11 b/g/n/ 
    Support interface UART/SPI/I2C/PWM 
    GIMSIO pin soudés  
    Security WPA/WPA2/WPA2-Enterprise/WPS 
    MicroSD card slot',
    'stockable', 10);


INSERT INTO `Stockable` (id, quantite)
SELECT id, quantite FROM Equipement WHERE categorie = 'stockable';

INSERT INTO `Solo` (id, etat)
SELECT id, TRUE FROM Equipement WHERE categorie = 'solo';