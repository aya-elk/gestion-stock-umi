import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './css/technicien.css';

const Technicien = () => {
  // State for equipment list and form
  const [equipments, setEquipments] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [formData, setFormData] = useState({
    id: '',
    nom: '',
    description: '',
    categorie: '',
    etat: 'disponible',
    quantite: '1'
  });
  
  // State for filters
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  // State for loading and error handling
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load equipment data when component mounts or filters change
  useEffect(() => {
    fetchEquipments();
    fetchReservations();
  }, [filterCategory, filterStatus]);

  // Fetch equipment data with filters applied
  const fetchEquipments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // In a real app, replace this with an actual API call
      // This is a mock API call that mimics the PHP behavior
      const response = await fetch(`/api/equipments?category=${filterCategory}&status=${filterStatus}`);
      if (!response.ok) {
        throw new Error('Failed to fetch equipment data');
      }
      const data = await response.json();
      setEquipments(data);
    } catch (err) {
      setError('Error loading equipment data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch reservation data
  const fetchReservations = async () => {
    try {
      // In a real app, replace this with an actual API call
      const response = await fetch('/api/reservations');
      if (!response.ok) {
        throw new Error('Failed to fetch reservation data');
      }
      const data = await response.json();
      setReservations(data);
    } catch (err) {
      console.error('Error loading reservation data:', err);
    }
  };

  // Handle changes in form inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  // Handle form submission for adding equipment
  const handleAddEquipment = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      // In a real app, replace this with an actual API call
      const response = await fetch('/api/equipments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add equipment');
      }
      
      // Refresh equipment list and reset form
      fetchEquipments();
      resetForm();
    } catch (err) {
      setError('Error adding equipment');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission for updating equipment
  const handleUpdateEquipment = async (e) => {
    e.preventDefault();
    if (!formData.id) {
      setError('No equipment selected for update');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      // In a real app, replace this with an actual API call
      const response = await fetch(`/api/equipments/${formData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update equipment');
      }
      
      // Refresh equipment list and reset form
      fetchEquipments();
      resetForm();
    } catch (err) {
      setError('Error updating equipment');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission for deleting equipment
  const handleDeleteEquipment = async (e) => {
    e.preventDefault();
    if (!formData.id) {
      setError('No equipment selected for deletion');
      return;
    }
    
    if (!window.confirm('Are you sure you want to delete this equipment?')) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      // In a real app, replace this with an actual API call
      const response = await fetch(`/api/equipments/${formData.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete equipment');
      }
      
      // Refresh equipment list and reset form
      fetchEquipments();
      resetForm();
    } catch (err) {
      setError('Error deleting equipment');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form to initial state
  const resetForm = () => {
    setFormData({
      id: '',
      nom: '',
      description: '',
      categorie: '',
      etat: 'disponible',
      quantite: '1'
    });
  };

  // Handle selecting a row to edit
  const handleSelectEquipment = (equipment) => {
    setFormData({
      id: equipment.id_equipement,
      nom: equipment.nom,
      description: equipment.description,
      categorie: equipment.catégorie,
      etat: equipment.état,
      quantite: equipment.quantite_dispo
    });
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    if (e.target.name === 'filter_category') {
      setFilterCategory(e.target.value);
    } else if (e.target.name === 'filter_status') {
      setFilterStatus(e.target.value);
    }
  };

  return (
    <div>
      <header className="sticky-header">
        <div className="nav-container">
          <div className="logo">GP<span>.</span></div>
          <nav>
            <ul className="nav-links">
              <li><Link to="/">Home</Link></li>
              <li><a href="#about">About</a></li>
              <li><a href="#services">Services</a></li>
              <li><a href="#contact">Contact</a></li>
            </ul>
          </nav>
        </div>
        <h1>Technicien Dashboard</h1>
      </header>

      <section className="equipment-section">
        <h2>Manage Equipments</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form className="equipment-form">
          <input 
            type="hidden" 
            name="id" 
            value={formData.id || ''} 
          />
          <input 
            type="text" 
            name="nom" 
            placeholder="Name" 
            required 
            value={formData.nom || ''} 
            onChange={handleInputChange} 
          />
          <textarea 
            name="description" 
            placeholder="Description" 
            required 
            value={formData.description || ''} 
            onChange={handleInputChange} 
          />
          <input 
            type="text" 
            name="categorie" 
            placeholder="Category" 
            required 
            value={formData.categorie || ''} 
            onChange={handleInputChange} 
          />
          <select 
            name="etat" 
            required 
            value={formData.etat || 'disponible'} 
            onChange={handleInputChange}
          >
            <option value="disponible">Available</option>
            <option value="hors_service">Out of Service</option>
            <option value="en_reparation">Under Repair</option>
          </select>
          <input 
            type="number" 
            name="quantite" 
            placeholder="Quantity" 
            required 
            value={formData.quantite || '1'} 
            onChange={handleInputChange} 
          />
          
          <div className="button-group">
            <button 
              type="button" 
              onClick={handleAddEquipment} 
              disabled={formData.id || isLoading}
            >
              Add
            </button>
            <button 
              type="button" 
              onClick={handleUpdateEquipment} 
              disabled={!formData.id || isLoading}
            >
              Update
            </button>
            <button 
              type="button" 
              onClick={handleDeleteEquipment} 
              disabled={!formData.id || isLoading}
            >
              Delete
            </button>
            <button 
              type="button" 
              onClick={resetForm} 
              disabled={isLoading}
            >
              Clear
            </button>
          </div>
        </form>

        <h3>Equipment List</h3>
        
        {isLoading ? (
          <p>Loading equipment data...</p>
        ) : (
          <table border="1" className="equipment-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Description</th>
                <th>
                  Category
                  <div className="filter-container">
                    <select 
                      name="filter_category" 
                      value={filterCategory} 
                      onChange={handleFilterChange}
                    >
                      <option value="">All</option>
                      <option value="Serveur">Serveur</option>
                      <option value="Onduleur">Onduleur</option>
                      <option value="Carte Graphique">Carte Graphique</option>
                    </select>
                  </div>
                </th>
                <th>
                  Status
                  <div className="filter-container">
                    <select 
                      name="filter_status" 
                      value={filterStatus} 
                      onChange={handleFilterChange}
                    >
                      <option value="">All</option>
                      <option value="disponible">Available</option>
                      <option value="hors_service">Out of Service</option>
                      <option value="en_reparation">Under Repair</option>
                    </select>
                  </div>
                </th>
                <th>Quantity</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {equipments.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{textAlign: 'center'}}>No equipment found</td>
                </tr>
              ) : (
                equipments.map(equipment => (
                  <tr 
                    key={equipment.id_equipement} 
                    onClick={() => handleSelectEquipment(equipment)}
                    className={formData.id === equipment.id_equipement ? 'selected-row' : ''}
                  >
                    <td>{equipment.id_equipement}</td>
                    <td>{equipment.nom}</td>
                    <td>{equipment.description}</td>
                    <td>{equipment.catégorie}</td>
                    <td>{equipment.état}</td>
                    <td>{equipment.quantite_dispo}</td>
                    <td>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectEquipment(equipment);
                        }}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </section>

      <section className="reservations-section">
        <h2>Manage Reservations</h2>
        <table border="1" className="reservations-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>User ID</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {reservations.length === 0 ? (
              <tr>
                <td colSpan="5" style={{textAlign: 'center'}}>No reservations found</td>
              </tr>
            ) : (
              reservations.map(reservation => (
                <tr key={reservation.id_reservation}>
                  <td>{reservation.id_reservation}</td>
                  <td>{reservation.id_utilisateur}</td>
                  <td>{reservation.date_debut}</td>
                  <td>{reservation.date_fin}</td>
                  <td>{reservation.statut}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

    </div>
  );
};

// Mock data for development purposes
// In production, these would be fetched from real API endpoints
const mockEquipments = [
  {
    id_equipement: 1,
    nom: 'Server HP ProLiant',
    description: 'High performance server for enterprise applications',
    catégorie: 'Serveur',
    état: 'disponible',
    quantite_dispo: 5
  },
  {
    id_equipement: 2,
    nom: 'APC Smart-UPS',
    description: 'Uninterruptible power supply for critical systems',
    catégorie: 'Onduleur',
    état: 'disponible',
    quantite_dispo: 3
  },
  {
    id_equipement: 3,
    nom: 'NVIDIA RTX 4090',
    description: 'High-end graphics card for AI and rendering',
    catégorie: 'Carte Graphique',
    état: 'en_reparation',
    quantite_dispo: 1
  }
];

const mockReservations = [
  {
    id_reservation: 1,
    id_utilisateur: 101,
    date_debut: '2023-05-15',
    date_fin: '2023-05-20',
    statut: 'confirmé'
  },
  {
    id_reservation: 2,
    id_utilisateur: 102,
    date_debut: '2023-06-01',
    date_fin: '2023-06-05',
    statut: 'en_cours'
  }
];

// Mock API endpoints
if (typeof window !== 'undefined') {
  window.fetch = (url, options = {}) => {
    if (url.includes('/api/equipments')) {
      // Handle equipment API endpoints
      if (options.method === 'POST') {
        // Add equipment
        console.log('Adding equipment:', JSON.parse(options.body));
        return Promise.resolve({ ok: true });
      } else if (options.method === 'PUT') {
        // Update equipment
        console.log('Updating equipment:', JSON.parse(options.body));
        return Promise.resolve({ ok: true });
      } else if (options.method === 'DELETE') {
        // Delete equipment
        console.log('Deleting equipment ID:', url.split('/').pop());
        return Promise.resolve({ ok: true });
      } else {
        // Get equipment (with optional filtering)
        const queryParams = new URLSearchParams(url.split('?')[1]);
        const category = queryParams.get('category') || '';
        const status = queryParams.get('status') || '';
        
        let filteredData = [...mockEquipments];
        
        if (category) {
          filteredData = filteredData.filter(e => e.catégorie === category);
        }
        
        if (status) {
          filteredData = filteredData.filter(e => e.état === status);
        }
        
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(filteredData)
        });
      }
    } else if (url.includes('/api/reservations')) {
      // Handle reservation API endpoints
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockReservations)
      });
    }
    
    // Default fallback
    return Promise.reject(new Error('Not implemented'));
  };
}

export default Technicien;