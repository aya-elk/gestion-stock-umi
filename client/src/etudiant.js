import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
// import './css/etudiant.css'; // Reusing some styles from technicien.css

const Etudiant = () => {
  // State variables
  const [equipements, setEquipements] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [formData, setFormData] = useState({
    id_utilisateur: 1, // Example user ID, should be from authentication
    id_equipement: '',
    date_debut: '',
    date_fin: ''
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Calendar localizer and events
  const localizer = momentLocalizer(moment);
  const calendarEvents = reservations.map(reservation => ({
    title: `Réservation ${reservation.id_reservation}`,
    start: new Date(reservation.date_debut),
    end: new Date(reservation.date_fin),
    resource: reservation
  }));

  // Fetch equipment and reservations on component mount
  useEffect(() => {
    fetchEquipements();
    fetchReservations();
  }, []);
  
  // Fetch available equipment
  const fetchEquipements = async () => {
    setIsLoading(true);
    try {
      // In a real app, replace with actual API call
      // Mock API call for development
      const response = await fetch('/api/equipments?available=true');
      if (!response.ok) throw new Error('Failed to fetch equipment data');
      
      const data = await response.json();
      setEquipements(data);
    } catch (err) {
      setError('Error loading equipment data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch user's reservations
  const fetchReservations = async () => {
    try {
      // In a real app, replace with actual API call
      // Mock API call for development
      const userId = formData.id_utilisateur;
      const response = await fetch(`/api/reservations?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch reservation data');
      
      const data = await response.json();
      setReservations(data);
    } catch (err) {
      setError('Error loading reservation data');
      console.error(err);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  // Handle reservation form submission
  const handleReservationSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Validate form data
      if (!formData.id_equipement || !formData.date_debut || !formData.date_fin) {
        throw new Error('Please fill in all required fields');
      }

      // Validate dates
      const startDate = new Date(formData.date_debut);
      const endDate = new Date(formData.date_fin);
      if (startDate >= endDate) {
        throw new Error('End date must be after start date');
      }

      // In a real app, replace with actual API call
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          statut: 'en_attente'
        }),
      });
      
      if (!response.ok) throw new Error('Failed to create reservation');
      
      // Success - refresh data and reset form (partially)
      setSuccess('Reservation submitted successfully!');
      fetchReservations();
      setFormData(prevState => ({
        ...prevState,
        id_equipement: '',
        date_debut: '',
        date_fin: ''
      }));
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setIsLoading(false);
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
        <h1>Étudiant Dashboard</h1>
      </header>

      <section className="equipment-section">
        <h2>Calendrier des Réservations</h2>
        <div style={{ height: 500 }}>
          <Calendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
          />
        </div>
      </section>

      <section className="equipment-section">
        <h2>Formulaire de Réservation</h2>
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        <form className="equipment-form" onSubmit={handleReservationSubmit}>
          <input 
            type="hidden" 
            name="id_utilisateur" 
            value={formData.id_utilisateur} 
          />
          
          <label htmlFor="id_equipement">Matériel:</label>
          <select 
            name="id_equipement" 
            id="id_equipement" 
            required 
            value={formData.id_equipement} 
            onChange={handleInputChange}
          >
            <option value="">Sélectionner un équipement</option>
            {equipements.map(eq => (
              <option key={eq.id_equipement} value={eq.id_equipement}>
                {eq.nom}
              </option>
            ))}
          </select>
          
          <label htmlFor="date_debut">Date de début:</label>
          <input 
            type="date" 
            name="date_debut" 
            id="date_debut" 
            required 
            value={formData.date_debut} 
            onChange={handleInputChange}
          />
          
          <label htmlFor="date_fin">Date de fin:</label>
          <input 
            type="date" 
            name="date_fin" 
            id="date_fin" 
            required 
            value={formData.date_fin} 
            onChange={handleInputChange}
          />
          
          <div className="button-group">
            <button type="submit" disabled={isLoading}>Réserver</button>
          </div>
        </form>
      </section>

      <section className="equipment-section">
        <h2>Historique des Réservations</h2>
        <table border="1">
          <thead>
            <tr>
              <th>ID</th>
              <th>Matériel</th>
              <th>Date de début</th>
              <th>Date de fin</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {reservations.length === 0 ? (
              <tr>
                <td colSpan="5" style={{textAlign: 'center'}}>Aucune réservation trouvée</td>
              </tr>
            ) : (
              reservations.map(reservation => (
                <tr key={reservation.id_reservation}>
                  <td>{reservation.id_reservation}</td>
                  <td>{reservation.id_equipement}</td>
                  <td>{reservation.date_debut}</td>
                  <td>{reservation.date_fin}</td>
                  <td>{reservation.statut}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      <section className="equipment-section">
        <h2>FAQ</h2>
        <div>
          <h3>Assistant FAQ</h3>
          <p><strong>Comment réserver ?</strong> Cliquez sur le formulaire de réservation, choisissez le matériel et les dates, puis cliquez sur "Réserver".</p>
          <p><strong>Où trouver le matériel ?</strong> Le matériel réservé peut être récupéré au bureau du technicien.</p>
          <p><strong>Comment annuler une réservation ?</strong> Contactez le technicien pour annuler une réservation.</p>
        </div>
      </section>

      {/* Mock API endpoints for development purposes */}
      {typeof window !== 'undefined' && (
        <script dangerouslySetInnerHTML={{ __html: `
          window.fetch = (url, options = {}) => {
            if (url.includes('/api/equipments')) {
              return Promise.resolve({
                ok: true,
                json: () => Promise.resolve([
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
                    description: 'Uninterruptible power supply',
                    catégorie: 'Onduleur',
                    état: 'disponible',
                    quantite_dispo: 3
                  },
                  {
                    id_equipement: 3,
                    nom: 'NVIDIA RTX 4090',
                    description: 'High-end graphics card',
                    catégorie: 'Carte Graphique',
                    état: 'disponible',
                    quantite_dispo: 1
                  }
                ])
              });
            } else if (url.includes('/api/reservations')) {
              if (options.method === 'POST') {
                console.log('Creating reservation:', JSON.parse(options.body));
                return Promise.resolve({ ok: true });
              } else {
                return Promise.resolve({
                  ok: true,
                  json: () => Promise.resolve([
                    {
                      id_reservation: 1,
                      id_utilisateur: 1,
                      id_equipement: 'Server HP ProLiant',
                      date_debut: '2023-05-15',
                      date_fin: '2023-05-20',
                      statut: 'confirmé'
                    },
                    {
                      id_reservation: 2,
                      id_utilisateur: 1,
                      id_equipement: 'APC Smart-UPS',
                      date_debut: '2023-06-01',
                      date_fin: '2023-06-05',
                      statut: 'en_attente'
                    }
                  ])
                });
              }
            }
            return Promise.reject(new Error('Not implemented'));
          }
        `}} />
      )}
    </div>
  );
};

export default Etudiant;