import React, { useState, useEffect, useRef } from 'react';
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
  const [success, setSuccess] = useState(null);
  
  // UI state variables
  const [darkMode, setDarkMode] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('equipment');
  
  // Refs for sections (for smooth scrolling)
  const equipmentRef = useRef(null);
  const reservationsRef = useRef(null);
  
  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    document.body.classList.toggle('dark-mode', newDarkMode);
  };

  // Scroll to section
  const scrollToSection = (ref) => {
    ref.current.scrollIntoView({ behavior: 'smooth' });
    // Update active tab based on the section being scrolled to
    if (ref === equipmentRef) setActiveTab('equipment');
    else if (ref === reservationsRef) setActiveTab('reservations');
  };

  // Handle scroll for back to top button and active tab
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      
      // Show or hide back to top button
      if (scrollPosition > 300) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
      
      // Update active tab based on scroll position
      const sections = [
        { ref: equipmentRef, id: 'equipment' },
        { ref: reservationsRef, id: 'reservations' }
      ];
      
      // Find the current section in view
      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section.ref.current) {
          const rect = section.ref.current.getBoundingClientRect();
          if (rect.top <= 100) {
            setActiveTab(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Scroll to top
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Load equipment data when component mounts or filters change
  useEffect(() => {
    // Animate elements on scroll
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('show');
        }
      });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.hidden').forEach(el => {
      observer.observe(el);
    });
    
    // Check dark mode
    const isDarkMode = document.body.classList.contains('dark-mode');
    setDarkMode(isDarkMode);
    
    fetchEquipments();
    fetchReservations();
    
    return () => {
      document.querySelectorAll('.hidden').forEach(el => {
        observer.unobserve(el);
      });
    };
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
    setSuccess(null);
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
      setSuccess('Equipment added successfully');
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
    setSuccess(null);
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
      setSuccess('Equipment updated successfully');
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
    setSuccess(null);
    try {
      // In a real app, replace this with an actual API call
      const response = await fetch(`/api/equipments/${formData.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete equipment');
      }
      
      // Refresh equipment list and reset form
      setSuccess('Equipment deleted successfully');
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
  
  // Handle reservation status update
  const handleUpdateReservationStatus = async (id, status) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/reservations/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ statut: status }),
      });
      
      if (!response.ok) throw new Error('Failed to update reservation status');
      
      setSuccess(`Reservation status updated to ${status}`);
      fetchReservations();
    } catch (err) {
      setError('Error updating reservation status');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={darkMode ? "dark-mode" : ""}>
      <header className="sticky-header">
        <div className="nav-container">
          <div className="logo">GP<span className="accent-dot">.</span></div>
          <nav>
            <ul className={`nav-links ${menuOpen ? 'active' : ''}`}>
              <li><Link to="/">Home</Link></li>
              <li>
                <a 
                  href="#" 
                  onClick={() => scrollToSection(equipmentRef)}
                  className={activeTab === 'equipment' ? 'active' : ''}
                >
                  Equipment
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  onClick={() => scrollToSection(reservationsRef)}
                  className={activeTab === 'reservations' ? 'active' : ''}
                >
                  Reservations
                </a>
              </li>
            </ul>
          </nav>
          <div className="nav-actions">
            <button className="theme-toggle" onClick={toggleDarkMode}>
              {darkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"></circle>
                  <line x1="12" y1="1" x2="12" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="23"></line>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                  <line x1="1" y1="12" x2="3" y2="12"></line>
                  <line x1="21" y1="12" x2="23" y2="12"></line>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              )}
            </button>
            <Link to="/login" className="cta-button">Log Out</Link>
            <button className="mobile-menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {menuOpen ? (
                  <path d="M18 6L6 18M6 6l12 12"/>
                ) : (
                  <path d="M3 12h18M3 6h18M3 18h18"/>
                )}
              </svg>
            </button>
          </div>
        </div>
      </header>

      <section className="hero-section">
        <div className="hero-background">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>
        <div className="hero-content">
          <span className="tag-line">TECHNICIAN PORTAL</span>
          <h1 className="headline fade-in">
            Equipment <span className="highlight">Management</span>
          </h1>
          <p className="subheading fade-in hidden">
            Manage your inventory, track equipment status, and handle reservation requests efficiently.
          </p>
          <div className="hero-actions">
            <a href="#" onClick={() => scrollToSection(equipmentRef)} className="cta-button fade-in">
              Manage Equipment
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </a>
            <a href="#" onClick={() => scrollToSection(reservationsRef)} className="secondary-button fade-in">
              View Reservations
            </a>
          </div>
        </div>
        <div className="scroll-indicator">
          <div className="mouse">
            <div className="wheel"></div>
          </div>
          <div className="scroll-text">Scroll Down</div>
        </div>
      </section>

      <section ref={equipmentRef} id="equipment" className="equipment-section">
        <div className="section-header hidden">
          <span className="section-tag">Inventory</span>
          <h2 className="section-title">Manage Equipment</h2>
          <div className="section-divider"></div>
          <p className="section-description">
            Add, update, or remove equipment from your inventory system
          </p>
        </div>
        
        <div className="form-container glass-effect hidden">
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          
          <form className="equipment-form">
            <input 
              type="hidden" 
              name="id" 
              value={formData.id || ''} 
            />
            <div className="form-group">
              <label htmlFor="nom">Name:</label>
              <input 
                type="text" 
                name="nom" 
                id="nom"
                placeholder="Equipment name" 
                required 
                value={formData.nom || ''} 
                onChange={handleInputChange} 
                className="form-control"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="description">Description:</label>
              <textarea 
                name="description" 
                id="description"
                placeholder="Equipment description" 
                required 
                value={formData.description || ''} 
                onChange={handleInputChange}
                className="form-control" 
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="categorie">Category:</label>
                <input 
                  type="text" 
                  name="categorie" 
                  id="categorie"
                  placeholder="Category" 
                  required 
                  value={formData.categorie || ''} 
                  onChange={handleInputChange}
                  className="form-control" 
                />
              </div>
              <div className="form-group">
                <label htmlFor="etat">Status:</label>
                <select 
                  name="etat" 
                  id="etat"
                  required 
                  value={formData.etat || 'disponible'} 
                  onChange={handleInputChange}
                  className="form-control"
                >
                  <option value="disponible">Available</option>
                  <option value="hors_service">Out of Service</option>
                  <option value="en_reparation">Under Repair</option>
                </select>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="quantite">Quantity:</label>
              <input 
                type="number" 
                name="quantite" 
                id="quantite"
                placeholder="Quantity" 
                required 
                value={formData.quantite || '1'} 
                onChange={handleInputChange}
                className="form-control" 
                min="1"
              />
            </div>
            
            <div className="button-group">
              <button 
                type="button" 
                onClick={handleAddEquipment} 
                disabled={formData.id || isLoading}
                className="submit-button"
              >
                {isLoading ? 'Processing...' : 'Add Equipment'}
              </button>
              <button 
                type="button" 
                onClick={handleUpdateEquipment} 
                disabled={!formData.id || isLoading}
                className="update-button"
              >
                {isLoading ? 'Processing...' : 'Update'}
              </button>
              <button 
                type="button" 
                onClick={handleDeleteEquipment} 
                disabled={!formData.id || isLoading}
                className="delete-button"
              >
                {isLoading ? 'Processing...' : 'Delete'}
              </button>
              <button 
                type="button" 
                onClick={resetForm} 
                disabled={isLoading}
                className="secondary-button"
              >
                Clear Form
              </button>
            </div>
          </form>

          <div className="filter-section">
            <h3>Filter Equipment</h3>
            <div className="filter-controls">
              <div className="form-group">
                <label htmlFor="filter_category">Category:</label>
                <select 
                  name="filter_category" 
                  id="filter_category"
                  value={filterCategory} 
                  onChange={handleFilterChange}
                  className="form-control"
                >
                  <option value="">All Categories</option>
                  <option value="Serveur">Serveur</option>
                  <option value="Onduleur">Onduleur</option>
                  <option value="Carte Graphique">Carte Graphique</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="filter_status">Status:</label>
                <select 
                  name="filter_status" 
                  id="filter_status"
                  value={filterStatus} 
                  onChange={handleFilterChange}
                  className="form-control"
                >
                  <option value="">All Status</option>
                  <option value="disponible">Available</option>
                  <option value="hors_service">Out of Service</option>
                  <option value="en_reparation">Under Repair</option>
                </select>
              </div>
              <button 
                className="secondary-button" 
                onClick={() => {
                  setFilterCategory('');
                  setFilterStatus('');
                }}
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
        
        <div className="table-container hidden">
          <h3>Equipment List</h3>
          <div className="responsive-table">
            {isLoading && !equipments.length ? (
              <div className="loading-spinner"></div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Quantity</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {equipments.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="centered-cell">No equipment found</td>
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
                        <td>
                          <span className="category-badge">{equipment.catégorie}</span>
                        </td>
                        <td>
                          <span className={`status-badge status-${equipment.état}`}>
                            {equipment.état === 'disponible' ? 'Available' : 
                             equipment.état === 'hors_service' ? 'Out of Service' : 'Under Repair'}
                          </span>
                        </td>
                        <td>{equipment.quantite_dispo}</td>
                        <td>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectEquipment(equipment);
                            }}
                            className="table-action-btn"
                            title="Edit"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 20h9"></path>
                              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </section>

      <section ref={reservationsRef} id="reservations" className="reservations-section">
        <div className="section-header hidden">
          <span className="section-tag">Bookings</span>
          <h2 className="section-title">Manage Reservations</h2>
          <div className="section-divider"></div>
          <p className="section-description">
            View and update equipment reservation requests
          </p>
        </div>
        
        <div className="table-container hidden">
          {isLoading ? (
            <div className="loading-spinner"></div>
          ) : (
            <div className="responsive-table">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>User</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="centered-cell">No reservations found</td>
                    </tr>
                  ) : (
                    reservations.map(reservation => {
                      let statusClass = '';
                      if (reservation.statut === 'confirmé') statusClass = 'status-confirmed';
                      else if (reservation.statut === 'en_cours') statusClass = 'status-pending';
                      else if (reservation.statut === 'en_attente') statusClass = 'status-pending';
                      
                      return (
                        <tr key={reservation.id_reservation}>
                          <td>{reservation.id_reservation}</td>
                          <td>{reservation.id_utilisateur}</td>
                          <td>{reservation.date_debut}</td>
                          <td>{reservation.date_fin}</td>
                          <td>
                            <span className={`status-badge ${statusClass}`}>
                              {reservation.statut === 'confirmé' ? 'Confirmed' : 
                               reservation.statut === 'en_cours' ? 'In Progress' : 'Pending'}
                            </span>
                          </td>
                          <td className="action-buttons">
                            {reservation.statut !== 'confirmé' && (
                              <button
                                onClick={() => handleUpdateReservationStatus(reservation.id_reservation, 'confirmé')}
                                className="confirm-btn"
                                title="Confirm"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                </svg>
                                Confirm
                              </button>
                            )}
                            {reservation.statut === 'en_attente' && (
                              <button
                                onClick={() => handleUpdateReservationStatus(reservation.id_reservation, 'en_cours')}
                                className="progress-btn"
                                title="Mark In Progress"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="12" cy="12" r="10"></circle>
                                  <polyline points="12 6 12 12 16 14"></polyline>
                                </svg>
                                In Progress
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <footer className="main-footer">
        <div className="footer-container">
          <div className="footer-top">
            <div className="footer-logo">GP<span className="accent-dot">.</span></div>
            <div className="footer-links">
              <div className="footer-col">
                <h4>Navigation</h4>
                <ul>
                  <li><Link to="/">Home</Link></li>
                  <li><a href="#" onClick={() => scrollToSection(equipmentRef)}>Equipment</a></li>
                  <li><a href="#" onClick={() => scrollToSection(reservationsRef)}>Reservations</a></li>
                </ul>
              </div>
              <div className="footer-col">
                <h4>Help</h4>
                <ul>
                  <li><a href="#faq">FAQ</a></li>
                  <li><a href="#contact">Contact Support</a></li>
                  <li><a href="#terms">Terms & Conditions</a></li>
                </ul>
              </div>
              <div className="footer-col">
                <h4>Contact</h4>
                <ul>
                  <li>Email: support@gpequipment.com</li>
                  <li>Phone: +1 (555) 123-4567</li>
                  <li>Hours: Mon-Fri 8am-5pm</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© {new Date().getFullYear()} GP Equipment Management. All rights reserved.</p>
            <div className="social-icons">
              <a href="#" aria-label="Facebook">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
              </a>
              <a href="#" aria-label="Twitter">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                </svg>
              </a>
              <a href="#" aria-label="Instagram">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
              <a href="#" aria-label="LinkedIn">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                  <rect x="2" y="9" width="4" height="12"></rect>
                  <circle cx="4" cy="4" r="2"></circle>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>

      <button 
        id="back-to-top" 
        title="Back to Top" 
        className={showBackToTop ? 'show' : ''}
        onClick={scrollToTop}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="18 15 12 9 6 15"></polyline>
        </svg>
      </button>
    </div>
  );
};

// // Mock data (keep these as is)
// const mockEquipments = [
//   {
//     id_equipement: 1,
//     nom: 'Server HP ProLiant',
//     description: 'High performance server for enterprise applications',
//     catégorie: 'Serveur',
//     état: 'disponible',
//     quantite_dispo: 5
//   },
//   {
//     id_equipement: 2,
//     nom: 'APC Smart-UPS',
//     description: 'Uninterruptible power supply for critical systems',
//     catégorie: 'Onduleur',
//     état: 'disponible',
//     quantite_dispo: 3
//   },
//   {
//     id_equipement: 3,
//     nom: 'NVIDIA RTX 4090',
//     description: 'High-end graphics card for AI and rendering',
//     catégorie: 'Carte Graphique',
//     état: 'en_reparation',
//     quantite_dispo: 1
//   }
// ];

// const mockReservations = [
//   {
//     id_reservation: 1,
//     id_utilisateur: 101,
//     date_debut: '2023-05-15',
//     date_fin: '2023-05-20',
//     statut: 'confirmé'
//   },
//   {
//     id_reservation: 2,
//     id_utilisateur: 102,
//     date_debut: '2023-06-01',
//     date_fin: '2023-06-05',
//     statut: 'en_cours'
//   }
// ];

// // Mock API endpoints (keep these as is)
// if (typeof window !== 'undefined') {
//   window.fetch = (url, options = {}) => {
//     if (url.includes('/api/equipments')) {
//       // Handle equipment API endpoints
//       if (options.method === 'POST') {
//         // Add equipment
//         console.log('Adding equipment:', JSON.parse(options.body));
//         return Promise.resolve({ ok: true });
//       } else if (options.method === 'PUT') {
//         // Update equipment
//         console.log('Updating equipment:', JSON.parse(options.body));
//         return Promise.resolve({ ok: true });
//       } else if (options.method === 'DELETE') {
//         // Delete equipment
//         console.log('Deleting equipment ID:', url.split('/').pop());
//         return Promise.resolve({ ok: true });
//       } else {
//         // Get equipment (with optional filtering)
//         const queryParams = new URLSearchParams(url.split('?')[1]);
//         const category = queryParams.get('category') || '';
//         const status = queryParams.get('status') || '';
        
//         let filteredData = [...mockEquipments];
        
//         if (category) {
//           filteredData = filteredData.filter(e => e.catégorie === category);
//         }
        
//         if (status) {
//           filteredData = filteredData.filter(e => e.état === status);
//         }
        
//         return Promise.resolve({
//           ok: true,
//           json: () => Promise.resolve(filteredData)
//         });
//       }
//     } else if (url.includes('/api/reservations')) {
//       // Handle reservation API endpoints
//       if (options.method === 'PATCH') {
//         // Update reservation status
//         console.log('Updating reservation status:', url.split('/').pop(), JSON.parse(options.body));
//         return Promise.resolve({ ok: true });
//       }
//       return Promise.resolve({
//         ok: true,
//         json: () => Promise.resolve(mockReservations)
//       });
//     }
    
//     // Default fallback
//     return Promise.reject(new Error('Not implemented'));
//   };
// }

export default Technicien;