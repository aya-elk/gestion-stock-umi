import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import SignatureCanvas from 'react-signature-canvas';
import './css/App.css';
import './css/responsable.css';

const Responsable = () => {
  // State variables
  const [reservations, setReservations] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [signatureURL, setSignatureURL] = useState(null);
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [filterStatus, setFilterStatus] = useState('en_attente');
  const [showLowStock, setShowLowStock] = useState(false);

  // Refs for sections (for smooth scrolling)
  const pendingRef = useRef(null);
  const stockRef = useRef(null);
  const historyRef = useRef(null);
  const sigPadRef = useRef({});

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
    if (ref === pendingRef) setActiveTab('pending');
    else if (ref === stockRef) setActiveTab('stock');
    else if (ref === historyRef) setActiveTab('history');
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
        { ref: pendingRef, id: 'pending' },
        { ref: stockRef, id: 'stock' },
        { ref: historyRef, id: 'history' }
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

  // Fetch data on component mount
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
    
    fetchReservations();
    fetchStocks();
    
    return () => {
      document.querySelectorAll('.hidden').forEach(el => {
        observer.unobserve(el);
      });
    };
  }, [filterStatus]);

  // Fetch reservation data
  const fetchReservations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/reservations?status=${filterStatus}`);
      if (!response.ok) throw new Error('Failed to fetch reservation data');
      
      const data = await response.json();
      setReservations(data);
    } catch (err) {
      setError('Error loading reservation data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch stock data
  const fetchStocks = async () => {
    try {
      const response = await fetch('/api/equipments/stocks');
      if (!response.ok) throw new Error('Failed to fetch stock data');
      
      const data = await response.json();
      setStocks(data);
    } catch (err) {
      console.error('Error loading stock data:', err);
    }
  };

  // Handle filter change
  const handleFilterChange = (e) => {
    const { value } = e.target;
    setFilterStatus(value);
  };

  // Toggle low stock filter
  const toggleLowStockFilter = () => {
    setShowLowStock(!showLowStock);
  };

  // Open signature modal for approval/refusal
  const openSignatureModal = (action, reservation) => {
    setSelectedReservation(reservation);
    setPendingAction(action);
    setSignatureModalOpen(true);
    setSignatureURL(null);
  };

  // Clear signature pad
  const clearSignature = () => {
    sigPadRef.current.clear();
    setSignatureURL(null);
  };
  
  // Save signature as data URL
  const saveSignature = () => {
    if (sigPadRef.current.isEmpty()) {
      setError('Please provide a signature');
      return;
    }
    
    const dataURL = sigPadRef.current.getTrimmedCanvas().toDataURL('image/png');
    setSignatureURL(dataURL);
  };

  // Close signature modal
  const closeSignatureModal = () => {
    setSignatureModalOpen(false);
    setSelectedReservation(null);
    setPendingAction(null);
  };

  // Handle reservation approval with signature
  const handleReservationAction = async () => {
    if (!signatureURL) {
      setError('Please save your signature first');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const status = pendingAction === 'approve' ? 'confirmé' : 'refusé';
      const response = await fetch(`/api/reservations/${selectedReservation.id_reservation}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          statut: status,
          signature_responsable: signatureURL
        }),
      });
      
      if (!response.ok) throw new Error(`Failed to ${pendingAction} reservation`);
      
      setSuccess(`Reservation ${pendingAction === 'approve' ? 'approved' : 'refused'} successfully`);
      fetchReservations();
      closeSignatureModal();
    } catch (err) {
      setError(`Error ${pendingAction === 'approve' ? 'approving' : 'refusing'} reservation`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate stock level class
  const getStockLevelClass = (stock) => {
    const ratio = stock.quantite_dispo / stock.seuil_critique * 100;
    if (ratio <= 100) return 'stock-critical';
    if (ratio <= 150) return 'stock-warning';
    return 'stock-good';
  };

  // Filter stocks based on low stock toggle
  const filteredStocks = showLowStock 
    ? stocks.filter(stock => stock.quantite_dispo <= stock.seuil_critique * 1.5)
    : stocks;

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
                  onClick={() => scrollToSection(pendingRef)}
                  className={activeTab === 'pending' ? 'active' : ''}
                >
                  Pending
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  onClick={() => scrollToSection(stockRef)}
                  className={activeTab === 'stock' ? 'active' : ''}
                >
                  Stocks
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
          <span className="tag-line">MANAGER DASHBOARD</span>
          <h1 className="headline fade-in">
            Reservation <span className="highlight">Management</span>
          </h1>
          <p className="subheading fade-in hidden">
            Review and approve equipment reservations, monitor stock levels, and keep track of equipment utilization.
          </p>
          <div className="hero-actions">
            <a href="#" onClick={() => scrollToSection(pendingRef)} className="cta-button fade-in">
              Review Reservations
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </a>
            <a href="#" onClick={() => scrollToSection(stockRef)} className="secondary-button fade-in">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                <line x1="7" y1="7" x2="7.01" y2="7"></line>
              </svg>
              Monitor Stocks
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

      <section ref={pendingRef} id="pending" className="reservations-section">
        <div className="section-header hidden">
          <span className="section-tag">Review</span>
          <h2 className="section-title">Pending Reservations</h2>
          <div className="section-divider"></div>
          <p className="section-description">
            Review and approve or refuse equipment reservation requests
          </p>
        </div>
        
        <div className="filter-section hidden">
          <h3>Filter Reservations</h3>
          <div className="filter-controls">
            <div className="form-group">
              <label htmlFor="filter_status">Status:</label>
              <select 
                id="filter_status"
                value={filterStatus} 
                onChange={handleFilterChange}
                className="form-control"
              >
                <option value="en_attente">Pending</option>
                <option value="confirmé">Approved</option>
                <option value="refusé">Refused</option>
                <option value="all">All Reservations</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="table-container glass-effect hidden">
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          
          {isLoading ? (
            <div className="loading-spinner"></div>
          ) : (
            <div className="responsive-table">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>User</th>
                    <th>Equipment</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="centered-cell">No reservations found</td>
                    </tr>
                  ) : (
                    reservations.map(reservation => {
                      let statusClass = '';
                      if (reservation.statut === 'confirmé') statusClass = 'status-confirmed';
                      else if (reservation.statut === 'en_attente') statusClass = 'status-pending';
                      else if (reservation.statut === 'refusé') statusClass = 'status-refused';
                      
                      return (
                        <tr key={reservation.id_reservation}>
                          <td>{reservation.id_reservation}</td>
                          <td>{reservation.id_utilisateur}</td>
                          <td>{reservation.id_equipement}</td>
                          <td>{reservation.date_debut}</td>
                          <td>{reservation.date_fin}</td>
                          <td>
                            <span className={`status-badge ${statusClass}`}>
                              {reservation.statut === 'confirmé' ? 'Approved' : 
                               reservation.statut === 'refusé' ? 'Refused' : 'Pending'}
                            </span>
                          </td>
                          <td className="action-buttons">
                            {reservation.statut === 'en_attente' && (
                              <>
                                <button
                                  onClick={() => openSignatureModal('approve', reservation)}
                                  className="approve-btn"
                                  title="Approve"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                  </svg>
                                  Approve
                                </button>
                                <button
                                  onClick={() => openSignatureModal('refuse', reservation)}
                                  className="refuse-btn"
                                  title="Refuse"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="15" y1="9" x2="9" y2="15"></line>
                                    <line x1="9" y1="9" x2="15" y2="15"></line>
                                  </svg>
                                  Refuse
                                </button>
                              </>
                            )}
                            {reservation.statut !== 'en_attente' && (
                              <div className="signature-display">
                                {reservation.signature_responsable ? (
                                  <button 
                                    className="view-signature-btn"
                                    onClick={() => window.open(reservation.signature_responsable, '_blank')}
                                    title="View Signature"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                      <circle cx="12" cy="12" r="3"></circle>
                                    </svg>
                                    View Signature
                                  </button>
                                ) : (
                                  <span>No signature</span>
                                )}
                              </div>
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

      <section ref={stockRef} id="stock" className="stock-section">
        <div className="section-header hidden">
          <span className="section-tag">Inventory</span>
          <h2 className="section-title">Stock Monitoring</h2>
          <div className="section-divider"></div>
          <p className="section-description">
            Monitor equipment stock levels and identify items approaching critical thresholds
          </p>
        </div>
        
        <div className="filter-section hidden">
          <h3>Filter Stocks</h3>
          <button 
            className={`toggle-button ${showLowStock ? 'active' : ''}`}
            onClick={toggleLowStockFilter}
          >
            {showLowStock ? 'Show All Items' : 'Show Low Stock Only'}
          </button>
        </div>
        
        <div className="stocks-container hidden">
          {filteredStocks.length === 0 ? (
            <div className="no-data">No stock data available</div>
          ) : (
            <div className="stock-cards">
              {filteredStocks.map(stock => {
                const stockLevelClass = getStockLevelClass(stock);
                const percentage = Math.min((stock.quantite_dispo / stock.seuil_critique) * 100, 200);
                
                return (
                  <div className={`stock-card ${stockLevelClass}`} key={stock.id_equipement}>
                    <div className="stock-info">
                      <h3>{stock.nom}</h3>
                      <p className="stock-description">{stock.description}</p>
                      <div className="stock-meta">
                        <span className="category-badge">{stock.catégorie}</span>
                        <span className={`status-badge status-${stock.état}`}>
                          {stock.état === 'disponible' ? 'Available' : 
                           stock.état === 'hors_service' ? 'Out of Service' : 'Under Repair'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="stock-level">
                      <div className="gauge-container">
                        <div className="gauge-label">
                          <span>Stock Level</span>
                          <span className="stock-count">{stock.quantite_dispo} / {stock.seuil_critique * 2}</span>
                        </div>
                        <div className="gauge-track">
                          <div 
                            className="gauge-fill"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <div className="threshold-marker" style={{ left: '50%' }}>
                          <div className="marker-line"></div>
                          <div className="marker-label">Critical Threshold ({stock.seuil_critique})</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section ref={historyRef} id="history" className="history-section">
        <div className="section-header hidden">
          <span className="section-tag">Analytics</span>
          <h2 className="section-title">Equipment Usage History</h2>
          <div className="section-divider"></div>
          <p className="section-description">
            View historical data on equipment reservations and usage patterns
          </p>
        </div>
        
        <div className="chart-container glass-effect hidden">
          <div className="chart-wrapper">
            <h3>Monthly Reservation Trends</h3>
            <div className="placeholder-chart">
              <div className="chart-bars">
                <div className="chart-bar" style={{height: '65%'}}><span>Jan</span></div>
                <div className="chart-bar" style={{height: '40%'}}><span>Feb</span></div>
                <div className="chart-bar" style={{height: '75%'}}><span>Mar</span></div>
                <div className="chart-bar" style={{height: '85%'}}><span>Apr</span></div>
                <div className="chart-bar" style={{height: '50%'}}><span>May</span></div>
                <div className="chart-bar" style={{height: '90%'}}><span>Jun</span></div>
                <div className="chart-bar" style={{height: '70%'}}><span>Jul</span></div>
                <div className="chart-bar active" style={{height: '80%'}}><span>Aug</span></div>
                <div className="chart-bar" style={{height: '60%'}}><span>Sep</span></div>
                <div className="chart-bar" style={{height: '45%'}}><span>Oct</span></div>
                <div className="chart-bar" style={{height: '55%'}}><span>Nov</span></div>
                <div className="chart-bar" style={{height: '70%'}}><span>Dec</span></div>
              </div>
              <div className="chart-legend">
                <div className="legend-item">
                  <div className="legend-color primary"></div>
                  <span>Reservation Count</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="stats-container hidden">
          <div className="stat-card">
            <div className="stat-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13"></rect>
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                <circle cx="5.5" cy="18.5" r="2.5"></circle>
                <circle cx="18.5" cy="18.5" r="2.5"></circle>
              </svg>
            </div>
            <h3 className="counter" data-target="127">0</h3>
            <p>Active Reservations</p>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="7"></circle>
                <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
              </svg>
            </div>
            <h3 className="counter" data-target="45">0</h3>
            <p>Equipment Types</p>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <h3 className="counter" data-target="312">0</h3>
            <p>Registered Users</p>
          </div>
        </div>
      </section>
      
      {/* Signature Modal */}
      {signatureModalOpen && (
        <div className="modal-overlay">
          <div className="signature-modal">
            <div className="modal-header">
              <h2>{pendingAction === 'approve' ? 'Approve' : 'Refuse'} Reservation</h2>
              <button className="close-modal" onClick={closeSignatureModal}>×</button>
            </div>
            
            <div className="modal-content">
              <div className="reservation-details">
                <p><strong>User:</strong> {selectedReservation.id_utilisateur}</p>
                <p><strong>Equipment:</strong> {selectedReservation.id_equipement}</p>
                <p><strong>Period:</strong> {selectedReservation.date_debut} to {selectedReservation.date_fin}</p>
              </div>
              
              <div className="signature-section">
                <h3>Please sign to confirm:</h3>
                <div className="signature-pad-container">
                  <SignatureCanvas
                    ref={sigPadRef}
                    penColor={darkMode ? 'white' : 'black'}
                    canvasProps={{
                      className: 'signature-pad',
                      width: 500,
                      height: 200
                    }}
                  />
                </div>
                
                <div className="signature-actions">
                  <button className="secondary-button" onClick={clearSignature}>
                    Clear
                  </button>
                  <button className="cta-button" onClick={saveSignature}>
                    Save Signature
                  </button>
                </div>
                
                {signatureURL && (
                  <div className="signature-preview">
                    <h4>Signature Preview:</h4>
                    <img src={signatureURL} alt="Your signature" />
                  </div>
                )}
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="secondary-button" onClick={closeSignatureModal}>Cancel</button>
              <button 
                className={pendingAction === 'approve' ? 'approve-btn' : 'refuse-btn'}
                onClick={handleReservationAction}
                disabled={isLoading || !signatureURL}
              >
                {isLoading ? 'Processing...' : pendingAction === 'approve' ? 'Confirm Approval' : 'Confirm Refusal'}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="main-footer">
        <div className="footer-container">
          <div className="footer-top">
            <div className="footer-logo">GP<span className="accent-dot">.</span></div>
            <div className="footer-links">
              <div className="footer-col">
                <h4>Navigation</h4>
                <ul>
                  <li><Link to="/">Home</Link></li>
                  <li><a href="#" onClick={() => scrollToSection(pendingRef)}>Pending Reservations</a></li>
                  <li><a href="#" onClick={() => scrollToSection(stockRef)}>Stock Monitoring</a></li>
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

      {/* Mock API endpoints for development purposes */}
      {typeof window !== 'undefined' && (
        <script dangerouslySetInnerHTML={{ __html: `
          window.fetch = (url, options = {}) => {
            if (url.includes('/api/reservations')) {
              if (options.method === 'PATCH') {
                console.log('Updating reservation status:', url.split('/').pop(), JSON.parse(options.body));
                return Promise.resolve({ ok: true });
              } else {
                const queryParams = new URLSearchParams(url.split('?')[1] || '');
                const status = queryParams.get('status');
                
                let mockReservations = [
                  {
                    id_reservation: 1,
                    id_utilisateur: 'Ahmed Alami',
                    id_equipement: 'Server HP ProLiant',
                    date_debut: '2023-05-15',
                    date_fin: '2023-05-20',
                    statut: 'confirmé',
                    signature_responsable: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
                  },
                  {
                    id_reservation: 2,
                    id_utilisateur: 'Fatima Bennani',
                    id_equipement: 'APC Smart-UPS',
                    date_debut: '2023-06-01',
                    date_fin: '2023-06-05',
                    statut: 'en_attente'
                  },
                  {
                    id_reservation: 3,
                    id_utilisateur: 'Omar Chaoui',
                    id_equipement: 'NVIDIA RTX 4090',
                    date_debut: '2023-06-15',
                    date_fin: '2023-06-20',
                    statut: 'en_attente'
                  },
                  {
                    id_reservation: 4,
                    id_utilisateur: 'Laila Houssaini',
                    id_equipement: 'Dell PowerEdge R740',
                    date_debut: '2023-06-10',
                    date_fin: '2023-06-15',
                    statut: 'refusé',
                    signature_responsable: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
                  },
                  {
                    id_reservation: 5,
                    id_utilisateur: 'Karim Tazi',
                    id_equipement: 'Cisco Catalyst 9300',
                    date_debut: '2023-06-20',
                    date_fin: '2023-06-25',
                    statut: 'en_attente'
                  }
                ];
                
                if (status && status !== 'all') {
                  mockReservations = mockReservations.filter(r => r.statut === status);
                }
                
                return Promise.resolve({
                  ok: true,
                  json: () => Promise.resolve(mockReservations)
                });
              }
            } else if (url.includes('/api/equipments/stocks')) {
              return Promise.resolve({
                ok: true,
                json: () => Promise.resolve([
                  {
                    id_equipement: 1,
                    nom: 'Server HP ProLiant',
                    description: 'High performance server for enterprise applications',
                    catégorie: 'Serveur',
                    état: 'disponible',
                    quantite_dispo: 5,
                    seuil_critique: 3
                  },
                  {
                    id_equipement: 2,
                    nom: 'APC Smart-UPS',
                    description: 'Uninterruptible power supply for critical systems',
                    catégorie: 'Onduleur',
                    état: 'disponible',
                    quantite_dispo: 2,
                    seuil_critique: 3
                  },
                  {
                    id_equipement: 3,
                    nom: 'NVIDIA RTX 4090',
                    description: 'High-end graphics card for AI and rendering',
                    catégorie: 'Carte Graphique',
                    état: 'en_reparation',
                    quantite_dispo: 1,
                    seuil_critique: 2
                  },
                  {
                    id_equipement: 4,
                    nom: 'Dell PowerEdge R740',
                    description: 'Rack server for enterprise applications',
                    catégorie: 'Serveur',
                    état: 'disponible',
                    quantite_dispo: 3,
                    seuil_critique: 2
                  },
                  {
                    id_equipement: 5,
                    nom: 'Cisco Catalyst 9300',
                    description: 'Enterprise network switch',
                    catégorie: 'Réseau',
                    état: 'disponible',
                    quantite_dispo: 4,
                    seuil_critique: 2
                  },
                  {
                    id_equipement: 6,
                    nom: 'HP LaserJet Enterprise',
                    description: 'High-volume network printer',
                    catégorie: 'Imprimante',
                    état: 'disponible',
                    quantite_dispo: 0,
                    seuil_critique: 1
                  }
                ])
              });
            }
            return Promise.reject(new Error('Not implemented'));
          }
        `}} />
      )}
    </div>
  );
};

export default Responsable;