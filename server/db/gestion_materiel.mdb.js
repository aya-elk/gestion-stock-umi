//! This database is deprecated and changed to an SQL one and will be removed in future versions.
// Create database (runs implicitly when collections are created)
// use gestion_materiel

// Create collections with schema validation
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["nom", "prenom", "email", "mot_de_passe", "role"],
      properties: {
        nom: { bsonType: "string" },
        prenom: { bsonType: "string" },
        email: { bsonType: "string" },
        mot_de_passe: { bsonType: "string" },
        role: { enum: ["etudiant", "technicien", "responsable"] },
        date_inscription: { bsonType: "date" }
      }
    }
  }
});

db.createCollection("equipment", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["nom", "categorie", "etat"],
      properties: {
        nom: { bsonType: "string" },
        description: { bsonType: "string" },
        categorie: { bsonType: "string" },
        etat: { enum: ["disponible", "hors_service", "en_reparation"] },
        seuil_alerte: { bsonType: "int" },
        qr_code: { bsonType: "string" },
        quantite_dispo: { bsonType: "int" }
      }
    }
  }
});

db.createCollection("notifications", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["user_id", "type", "message", "date_envoi"],
      properties: {
        user_id: { bsonType: "objectId" },
        type: { bsonType: "string" },
        message: { bsonType: "string" },
        date_envoi: { bsonType: "date" },
        lue: { bsonType: "bool" }
      }
    }
  }
});

db.createCollection("reservations", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["user_id", "date_debut", "date_fin", "statut"],
      properties: {
        user_id: { bsonType: "objectId" },
        date_debut: { bsonType: "date" },
        date_fin: { bsonType: "date" },
        statut: { enum: ["en_attente", "validée", "refusée", "terminée"] },
        signature_responsable: { bsonType: "string" },
        qr_code_reservation: { bsonType: "string" },
        date_creation: { bsonType: "date" },
        equipements: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["equipment_id", "quantite_demandee"],
            properties: {
              equipment_id: { bsonType: "objectId" },
              quantite_demandee: { bsonType: "int" }
            }
          }
        }
      }
    }
  }
});

// Insert Users data
const users = [
  {
    nom: "El Amrani",
    prenom: "Yassine",
    email: "yassine.elamrani@umi.ac.ma",
    mot_de_passe: "pass123",
    role: "etudiant",
    date_inscription: new Date("2024-10-01")
  },
  {
    nom: "Bennani",
    prenom: "Fatima",
    email: "fatima.bennani@umi.ac.ma",
    mot_de_passe: "pass456",
    role: "etudiant",
    date_inscription: new Date("2024-10-05")
  },
  {
    nom: "Touhami",
    prenom: "Hamza",
    email: "hamza.touhami@umi.ac.ma",
    mot_de_passe: "pass789",
    role: "technicien",
    date_inscription: new Date("2023-12-01")
  },
  {
    nom: "Zerouali",
    prenom: "Naima",
    email: "naima.zerouali@umi.ac.ma",
    mot_de_passe: "pass999",
    role: "responsable",
    date_inscription: new Date("2023-01-10")
  }
];

const userIds = db.users.insertMany(users).insertedIds;

// Insert Equipment data
const equipmentData = [
  {
    nom: "Serveur Dell PowerEdge T140",
    description: "CPU: Intel Xeon E-2136, RAM: 32Go DDR4 ECC, 1To SSD + 4To HDD, Alim Corsair RM750x",
    categorie: "Serveur",
    etat: "disponible",
    seuil_alerte: 1,
    qr_code: "QR-SRV-001",
    quantite_dispo: 1
  },
  {
    nom: "Onduleur 1500VA",
    description: "865W, autonomie 20min, USB + Serial, Line-Interactive, EMI/RFI",
    categorie: "Onduleur",
    etat: "disponible",
    seuil_alerte: 1,
    qr_code: "QR-OND-001",
    quantite_dispo: 1
  },
  {
    nom: "NVIDIA RTX 3090 Ti",
    description: "24Go GDDR6X, Boost Clock 1.86GHz, 3x PCIe 8-pin",
    categorie: "Carte Graphique",
    etat: "disponible",
    seuil_alerte: 1,
    qr_code: "QR-GPU-001",
    quantite_dispo: 1
  },
  // Adding more equipment items...
  {
    nom: "Raspberry Pi 4",
    description: "4Go RAM, USB-C, micro-HDMI, Wi-Fi/Bluetooth",
    categorie: "Microordinateur",
    etat: "disponible",
    seuil_alerte: 2,
    qr_code: "QR-RPI4-001",
    quantite_dispo: 5
  },
  {
    nom: "Caméra OV7670",
    description: "Caméra VGA pour Arduino",
    categorie: "Caméra",
    etat: "disponible",
    seuil_alerte: 2,
    qr_code: "QR-CAM-001",
    quantite_dispo: 6
  }
  // Additional equipment items would be added here...
];

const equipmentIds = db.equipment.insertMany(equipmentData).insertedIds;

// Insert Notifications data
db.notifications.insertMany([
  {
    user_id: userIds[0],
    type: "alerte_stock",
    message: "Le stock de Raspberry Pi est critique.",
    date_envoi: new Date("2025-04-01T08:30:00"),
    lue: false
  },
  {
    user_id: userIds[1],
    type: "confirmation",
    message: "Votre réservation a été approuvée.",
    date_envoi: new Date("2025-04-02T09:00:00"),
    lue: false
  },
  {
    user_id: userIds[2],
    type: "rappel",
    message: "N'oubliez pas de rendre le matériel demain.",
    date_envoi: new Date("2025-04-03T18:00:00"),
    lue: false
  }
]);

// Insert Reservations data with embedded equipment references
db.reservations.insertMany([
  {
    user_id: userIds[0],
    date_debut: new Date("2025-04-10T09:00:00"),
    date_fin: new Date("2025-04-12T18:00:00"),
    statut: "validée",
    signature_responsable: "signature_fatima.png",
    qr_code_reservation: "QR-RES-1001",
    date_creation: new Date(),
    equipements: [
      { equipment_id: equipmentIds[0], quantite_demandee: 1 },
      { equipment_id: equipmentIds[1], quantite_demandee: 2 }
    ]
  },
  {
    user_id: userIds[1],
    date_debut: new Date("2025-04-15T10:00:00"),
    date_fin: new Date("2025-04-17T16:00:00"),
    statut: "en_attente",
    qr_code_reservation: "QR-RES-1002",
    date_creation: new Date(),
    equipements: [
      { equipment_id: equipmentIds[0], quantite_demandee: 1 }
    ]
  }
]);

// Create indexes for better query performance
db.users.createIndex({ email: 1 }, { unique: true });
db.equipment.createIndex({ qr_code: 1 }, { unique: true });
db.reservations.createIndex({ user_id: 1 });
db.notifications.createIndex({ user_id: 1 });

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect('mongodb://127.0.0.1:27017/gestion_materiel', {});
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;