const Equipment = require('../models/equipmentModel');

// Get all equipment with optional filtering
exports.getEquipments = async (req, res) => {
  try {
    const filters = {};
    
    // Apply filters if provided
    if (req.query.category && req.query.category !== '') {
      filters.categorie = req.query.category;
    }
    
    if (req.query.status && req.query.status !== '') {
      filters.etat = req.query.status;
    }
    
    // Check if only available equipment is requested
    if (req.query.available === 'true') {
      filters.etat = 'disponible';
      filters.quantite_dispo = { $gt: 0 };
    }
    
    const equipments = await Equipment.find(filters);
    
    // Transform field names to match frontend expectations
    const transformedEquipments = equipments.map(eq => ({
      id_equipement: eq._id,
      nom: eq.nom,
      description: eq.description,
      catégorie: eq.categorie,
      état: eq.etat,
      quantite_dispo: eq.quantite_dispo
    }));
    
    res.status(200).json(transformedEquipments);
  } catch (error) {
    console.error('Error fetching equipment:', error);
    res.status(500).json({ message: 'Failed to fetch equipment data' });
  }
};

// Add new equipment
exports.addEquipment = async (req, res) => {
  try {
    const { nom, description, categorie, etat, quantite } = req.body;
    
    const newEquipment = new Equipment({
      nom,
      description,
      categorie,
      etat,
      quantite_dispo: parseInt(quantite, 10)
    });
    
    const savedEquipment = await newEquipment.save();
    res.status(201).json(savedEquipment);
  } catch (error) {
    console.error('Error adding equipment:', error);
    res.status(500).json({ message: 'Failed to add equipment' });
  }
};

// Update equipment by ID
exports.updateEquipment = async (req, res) => {
  try {
    const { nom, description, categorie, etat, quantite } = req.body;
    
    const updatedEquipment = await Equipment.findByIdAndUpdate(
      req.params.id,
      {
        nom,
        description,
        categorie,
        etat,
        quantite_dispo: parseInt(quantite, 10)
      },
      { new: true }
    );
    
    if (!updatedEquipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }
    
    res.status(200).json(updatedEquipment);
  } catch (error) {
    console.error('Error updating equipment:', error);
    res.status(500).json({ message: 'Failed to update equipment' });
  }
};

// Delete equipment by ID
exports.deleteEquipment = async (req, res) => {
  try {
    const deletedEquipment = await Equipment.findByIdAndDelete(req.params.id);
    
    if (!deletedEquipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }
    
    res.status(200).json({ message: 'Equipment deleted successfully' });
  } catch (error) {
    console.error('Error deleting equipment:', error);
    res.status(500).json({ message: 'Failed to delete equipment' });
  }
};