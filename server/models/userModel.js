const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
  nom: {
    type: String,
    required: true
  },
  prenom: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  mot_de_passe: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true,
    enum: ['etudiant', 'technicien', 'responsable']
  },
  date_inscription: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', userSchema);

module.exports = User;