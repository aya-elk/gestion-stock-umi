import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './css/App.css'; 
import './css/etudiant.css';

const Etudiant = () => {
  // State variables
  const [equipements, setEquipements] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [formData, setFormData] = useState({
    id_utilisateur: 1,
    id_equipement: '',
    date_debut: '',
    date_fin: ''
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('calendar');
  
  // Refs for sections (for smooth scrolling)
  const calendarRef = useRef(null);
  const formRef = useRef(null);
  const historyRef = useRef(null);
  const faqRef = useRef(null);

  // Calendar localizer and events
  const localizer = momentLocalizer(moment);
  const calendarEvents = reservations.map(reservation => ({
    title: `Équipement: ${reservation.id_equipement}`,
    start: new Date(reservation.date_debut),
    end: new Date(reservation.date_fin),
    resource: reservation,
    status: reservation.statut
  }));

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
    if (ref === calendarRef) setActiveTab('calendar');
    else if (ref === formRef) setActiveTab('reserve');
    else if (ref === historyRef) setActiveTab('history');
    else if (ref === faqRef) setActiveTab('faq');
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
        { ref: calendarRef, id: 'calendar' },
        { ref: formRef, id: 'reserve' },
        { ref: historyRef, id: 'history' },
        { ref: faqRef, id: 'faq' }
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

  // Fetch equipment and reservations on component mount
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
    
    fetchEquipements();
    fetchReservations();
    
    return () => {
      document.querySelectorAll('.hidden').forEach(el => {
        observer.unobserve(el);
      });
    };
  }, []);
  
  // Fetch and handler functions (unchanged)
  const fetchEquipements = async () => {
    setIsLoading(true);
    try {
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

  const fetchReservations = async () => {
    try {
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleReservationSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      if (!formData.id_equipement || !formData.date_debut || !formData.date_fin) {
        throw new Error('Please fill in all required fields');
      }

      const startDate = new Date(formData.date_debut);
      const endDate = new Date(formData.date_fin);
      if (startDate >= endDate) {
        throw new Error('End date must be after start date');
      }

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
      
      setSuccess('Reservation submitted successfully! You will receive a confirmation shortly.');
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

  // Custom event styling for calendar
  const eventStyleGetter = (event) => {
    let style = {
      borderRadius: '4px',
      opacity: 0.8,
      border: 'none',
      display: 'block',
      color: 'white'
    };
    
    // Style based on status
    if (event.status === 'confirmé') {
      style.background = 'linear-gradient(135deg, #2ecc71, #27ae60)';
    } else {
      style.background = 'linear-gradient(135deg, #f39c12, #e67e22)';
    }
    
    return {
      style
    };
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
                  onClick={() => scrollToSection(calendarRef)}
                  className={activeTab === 'calendar' ? 'active' : ''}
                >
                  Calendar
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  onClick={() => scrollToSection(formRef)}
                  className={activeTab === 'reserve' ? 'active' : ''}
                >
                  Reserve
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  onClick={() => scrollToSection(historyRef)}
                  className={activeTab === 'history' ? 'active' : ''}
                >
                  History
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  onClick={() => scrollToSection(faqRef)}
                  className={activeTab === 'faq' ? 'active' : ''}
                >
                  FAQ
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
          <span className="tag-line">STUDENT PORTAL</span>
          <h1 className="headline fade-in">
            Equipment <span className="highlight">Reservations</span>
          </h1>
          <p className="subheading fade-in hidden">
            Manage your equipment reservations with our intuitive dashboard. Reserve devices, check availability, and track request status all in one place.
          </p>
          <div className="hero-actions">
            <a href="#" onClick={() => scrollToSection(formRef)} className="cta-button fade-in">
              Make Reservation
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </a>
            <a href="#" onClick={() => scrollToSection(calendarRef)} className="secondary-button fade-in">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              View Calendar
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

      <section ref={calendarRef} id="calendar" className="calendar-section">
        <div className="section-header hidden">
          <span className="section-tag">Schedule</span>
          <h2 className="section-title">Reservation Calendar</h2>
          <div className="section-divider"></div>
          <p className="section-description">
            View all your current and upcoming equipment reservations
          </p>
        </div>
        <div className="calendar-container glass-effect hidden">
          {isLoading ? (
            <div className="loading-spinner"></div>
          ) : (
            <Calendar
              localizer={localizer}
              events={calendarEvents}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '600px' }}
              className="custom-calendar"
              eventPropGetter={eventStyleGetter}
              views={['month', 'week', 'day', 'agenda']}
              popup
              selectable
            />
          )}
        </div>
      </section>

      <section ref={formRef} id="reservation-form" className="form-section">
        <div className="section-header hidden">
          <span className="section-tag">Reserve</span>
          <h2 className="section-title">Equipment Reservation</h2>
          <div className="section-divider"></div>
          <p className="section-description">
            Select equipment and specify dates for your reservation
          </p>
        </div>
        
        <div className="form-container glass-effect hidden">
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          
          <form className="contact-form" onSubmit={handleReservationSubmit}>
            <input 
              type="hidden" 
              name="id_utilisateur" 
              value={formData.id_utilisateur} 
            />
            
            <div className="form-group">
              <label htmlFor="id_equipement">Equipment Type:</label>
              <select 
                name="id_equipement" 
                id="id_equipement" 
                required 
                value={formData.id_equipement} 
                onChange={handleInputChange}
                className="form-control"
              >
                <option value="">Select equipment</option>
                {equipements.map(eq => (
                  <option key={eq.id_equipement} value={eq.id_equipement}>
                    {eq.nom} ({eq.quantite_dispo} available)
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="date_debut">Start Date:</label>
                <input 
                  type="date" 
                  name="date_debut" 
                  id="date_debut" 
                  required 
                  value={formData.date_debut} 
                  onChange={handleInputChange}
                  className="form-control"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="date_fin">End Date:</label>
                <input 
                  type="date" 
                  name="date_fin" 
                  id="date_fin" 
                  required 
                  value={formData.date_fin} 
                  onChange={handleInputChange}
                  className="form-control"
                  min={formData.date_debut || new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
            
            <button type="submit" className="submit-button" disabled={isLoading}>
              {isLoading ? 'Processing...' : 'Reserve Now'} 
              {!isLoading && (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              )}
            </button>
          </form>
        </div>
      </section>

      <section ref={historyRef} id="history" className="history-section">
        <div className="section-header hidden">
          <span className="section-tag">History</span>
          <h2 className="section-title">Reservation History</h2>
          <div className="section-divider"></div>
          <p className="section-description">
            View the status of all your past and current equipment reservations
          </p>
        </div>
        
        <div className="table-container glass-effect hidden">
          {isLoading ? (
            <div className="loading-spinner"></div>
          ) : (
            <div className="responsive-table">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Equipment</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.length === 0 ? (
                    <tr>
                      <td colSpan="5">No reservations found</td>
                    </tr>
                  ) : (
                    reservations.map(reservation => {
                      let statusClass = '';
                      if (reservation.statut === 'confirmé') statusClass = 'status-confirmed';
                      else if (reservation.statut === 'en_attente') statusClass = 'status-pending';
                      
                      return (
                        <tr key={reservation.id_reservation}>
                          <td>{reservation.id_reservation}</td>
                          <td>{reservation.id_equipement}</td>
                          <td>{moment(reservation.date_debut).format('MMM DD, YYYY')}</td>
                          <td>{moment(reservation.date_fin).format('MMM DD, YYYY')}</td>
                          <td>
                            <span className={`status-badge ${statusClass}`}>
                              {reservation.statut === 'confirmé' ? 'Confirmed' : 'Pending'}
                            </span>
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

      <section ref={faqRef} id="faq" className="faq-section">
        <div className="section-header hidden">
          <span className="section-tag">Help</span>
          <h2 className="section-title">Frequently Asked Questions</h2>
          <div className="section-divider"></div>
          <p className="section-description">
            Find answers to common questions about equipment reservations
          </p>
        </div>
        
        <div className="faq-container hidden">
          <div className="features">
            <div className="feature-card">
              <div className="feature-icon">
                <div className="icon-circle">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                </div>
              </div>
              <h4>How to Reserve Equipment?</h4>
              <p>Navigate to the reservation form, select the equipment you need, specify start and end dates, then click "Reserve Now" to submit your request.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <div className="icon-circle">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                </div>
              </div>
              <h4>Where to Collect Equipment?</h4>
              <p>Reserved equipment can be collected from the technician's office during operating hours. Bring your student ID and reservation confirmation.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <div className="icon-circle">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                  </svg>
                </div>
              </div>
              <h4>How to Cancel a Reservation?</h4>
              <p>To cancel a reservation, please contact the technician at least 24 hours before your scheduled pick-up time. Late cancellations may incur penalties.</p>
            </div>
          </div>
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
                  <li><a href="#" onClick={() => scrollToSection(calendarRef)}>Calendar</a></li>
                  <li><a href="#" onClick={() => scrollToSection(formRef)}>Reservation</a></li>
                </ul>
              </div>
              <div className="footer-col">
                <h4>Help</h4>
                <ul>
                  <li><a href="#" onClick={() => scrollToSection(faqRef)}>FAQ</a></li>
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

      {/* Mock API endpoints for development purposes (unchanged) */}
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
                  },
                  {
                    id_equipement: 4,
                    nom: 'Dell PowerEdge R740',
                    description: 'Rack server for enterprise applications',
                    catégorie: 'Serveur',
                    état: 'disponible',
                    quantite_dispo: 2
                  },
                  {
                    id_equipement: 5,
                    nom: 'Cisco Catalyst 9300',
                    description: 'Enterprise network switch',
                    catégorie: 'Réseau',
                    état: 'disponible',
                    quantite_dispo: 4
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
                    },
                    {
                      id_reservation: 3,
                      id_utilisateur: 1,
                      id_equipement: 'NVIDIA RTX 4090',
                      date_debut: '2023-06-15',
                      date_fin: '2023-06-20',
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