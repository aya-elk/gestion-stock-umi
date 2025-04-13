import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import SignatureCanvas from 'react-signature-canvas';
import './css/responsable.css'; // Import the new CSS file

const Responsable = () => {
  // State variables
  const [reservations, setReservations] = useState([]);
  const [stockableEquipment, setStockableEquipment] = useState([]);
  const [soloEquipment, setSoloEquipment] = useState([]); // Changed from uniqueEquipment
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [activeEquipmentTab, setActiveEquipmentTab] = useState('stockable'); 
  const [signatureURL, setSignatureURL] = useState(null);
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [filterStatus, setFilterStatus] = useState('en_attente');
  const [showLowStock, setShowLowStock] = useState(false);
  const [activeView, setActiveView] = useState('reservations');
  const [notifications, setNotifications] = useState([]);

  // Refs for sections (for smooth scrolling)
  const pendingRef = useRef(null);
  const stockRef = useRef(null);
  const historyRef = useRef(null);
  const sigPadRef = useRef({});

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Scroll to section
  const scrollToSection = (ref) => {
    if (ref && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Handle scroll for back to top button and active tab
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to top
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchReservations();
    fetchStocks();
    fetchNotifications();
  }, [filterStatus]);

  // Fetch reservation data
  const fetchReservations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:8080/api/reservations');
      if (!response.ok) {
        throw new Error('Failed to fetch reservations');
      }
      const data = await response.json();
      setReservations(data);
    } catch (err) {
      setError("Error fetching reservations: " + err.message);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Updated fetch stocks function with correct server URL
  const fetchStocks = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Fetching equipment data from server...');
      // Use the full URL with port 8080
      const response = await fetch('http://localhost:8080/api/equipments', {
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`Failed to fetch equipment data: ${response.status} ${response.statusText}`);
      }
      
      // Parse JSON directly (removed text debugging step for cleaner code)
      const equipment = await response.json();
      console.log('Equipment data parsed successfully:', equipment.length, 'items');
      
      // Filter based on the database categories
      const stockable = equipment.filter(item => item.categorie === 'stockable');
      const solo = equipment.filter(item => item.categorie === 'solo');
      
      console.log(`Categorized: ${stockable.length} stockable, ${solo.length} solo items`);
      
      setStockableEquipment(stockable);
      setSoloEquipment(solo);

    } catch (err) {
      setError("Error fetching equipment: " + err.message);
      console.error('Equipment fetch error:', err);
      setStockableEquipment([]);
      setSoloEquipment([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch notifications (placeholder)
  const fetchNotifications = async () => {
    // Simulate API call
    setTimeout(() => {
      const dummyNotifications = [
        {
          id: 1,
          title: 'New reservation request',
          message: 'A new reservation has been submitted for approval',
          date: new Date(new Date().getTime() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
          read: false
        },
        {
          id: 2,
          title: 'Low stock alert',
          message: 'Laptops are running low. Currently at 3 units.',
          date: new Date(new Date().getTime() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
          read: false
        },
        {
          id: 3,
          title: 'System maintenance',
          message: 'System will be down for maintenance this weekend.',
          date: new Date(new Date().getTime() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
          read: true
        },
      ];
      setNotifications(dummyNotifications);
    }, 500);
  };

  // Format date for notifications
  const formatNotificationDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return `Today at ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
    } else if (diffInDays === 1) {
      return `Yesterday at ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return date.toLocaleDateString([], {day: '2-digit', month: 'short', year: 'numeric'});
    }
  };

  // Mark notification as read
  const markAsRead = (id) => {
    setNotifications(notifications.map(notification => 
      notification.id === id ? {...notification, read: true} : notification
    ));
  };

  // Count unread notifications
  const unreadCount = notifications.filter(n => !n.read).length;

  // Set active tab and handle scrolling
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Toggle between stockable and unique equipment tabs
  const handleEquipmentTabChange = (tabType) => {
    setActiveEquipmentTab(tabType);
  };

  return (
    <div className={darkMode ? "dark-mode" : ""}>
      <div className="dashboard-layout">
        {/* Sidebar - No changes needed */}
        <aside className="dashboard-sidebar">
          <div className="sidebar-header">
            <div className="logo-icon">GP<span className="accent-dot">.</span></div>
          </div>
          
          <nav className="sidebar-nav">
            <button 
              className={`sidebar-nav-item ${activeView === 'reservations' ? 'active' : ''}`}
              onClick={() => setActiveView('reservations')}
              title="Reservations"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </button>
            
            <button 
              className={`sidebar-nav-item ${activeView === 'notifications' ? 'active' : ''}`}
              onClick={() => setActiveView('notifications')}
              title="Notifications"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
            </button>
          </nav>
          
          <div className="sidebar-footer">
            <button className="theme-toggle" onClick={toggleDarkMode} title={darkMode ? "Light Mode" : "Dark Mode"}>
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
            <Link to="/login" className="sidebar-logout" title="Logout">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </Link>
          </div>
        </aside>

        {/* Main Content */}
        <main className="dashboard-main">
          <header className="dashboard-header">
            <div className="dashboard-title">
              <h1>Manager Dashboard</h1>
              <p className="dashboard-subtitle">
                {activeView === 'reservations' 
                  ? 'Manage equipment reservations and monitor stock levels' 
                  : 'View notifications and system messages'}
              </p>
            </div>
            <div className="dashboard-actions">
              <div className="user-profile">
                <span className="user-greeting">Welcome, Manager</span>
                <div className="user-avatar">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
              </div>
            </div>
          </header>
          
          {/* Reservations View */}
          {activeView === 'reservations' && (
            <div className="dashboard-content reservations-view">
              <div className="dashboard-tabs">
                <button 
                  className={`dashboard-tab ${activeTab === 'pending' ? 'active' : ''}`}
                  onClick={() => handleTabChange('pending')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  Pending Requests
                </button>
                <button 
                  className={`dashboard-tab ${activeTab === 'stock' ? 'active' : ''}`}
                  onClick={() => handleTabChange('stock')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 11 12 14 22 4"></polyline>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                  </svg>
                  Stock Monitoring
                </button>
                <button 
                  className={`dashboard-tab ${activeTab === 'history' ? 'active' : ''}`}
                  onClick={() => handleTabChange('history')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                  </svg>
                  Usage History
                </button>
              </div>

              <div className="dashboard-sections">
                {/* Only show the active section */}
                {activeTab === 'pending' && (
                  <section id="pending" className="dashboard-section active-section">
                    <div className="section-header">
                      <h2 className="section-title">Pending Reservations</h2>
                      <div className="section-divider"></div>
                      <p className="section-description">
                        Review and approve or refuse equipment reservation requests
                      </p>
                    </div>
                    
                    <div className="filter-section">
                      <h3>Filter Reservations</h3>
                      <div className="filter-controls">
                        <div className="form-group">
                          <label htmlFor="filter_status">Status:</label>
                          <select 
                            id="filter_status"
                            value={filterStatus} 
                            onChange={(e) => setFilterStatus(e.target.value)}
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
                    
                    <div className="table-container glass-effect">
                      <h3>Reservation Requests</h3>
                      <div className="responsive-table">
                        <table>
                          <thead>
                            <tr>
                              <th>ID</th>
                              <th>Student</th>
                              <th>Equipment</th>
                              <th>Date</th>
                              <th>Status</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {isLoading ? (
                              <tr>
                                <td colSpan="6" className="centered-cell">Loading reservations...</td>
                              </tr>
                            ) : reservations.length === 0 ? (
                              <tr>
                                <td colSpan="6" className="centered-cell">No reservations found</td>
                              </tr>
                            ) : (
                              reservations.map(reservation => (
                                <tr key={reservation.id}>
                                  <td>#{reservation.id}</td>
                                  <td>John Doe</td>
                                  <td>Laptop</td>
                                  <td>2023-10-15</td>
                                  <td>
                                    <span className="status-badge status-pending">Pending</span>
                                  </td>
                                  <td>
                                    <div className="action-buttons">
                                      <button className="approve-btn">Approve</button>
                                      <button className="reject-btn">Reject</button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </section>
                )}

                {activeTab === 'stock' && (
                  <section id="stock" className="dashboard-section active-section">
                    <div className="section-header">
                      <h2 className="section-title">Stock Monitoring</h2>
                      <div className="section-divider"></div>
                      <p className="section-description">
                        Monitor equipment stock levels and identify items approaching critical thresholds
                      </p>
                    </div>
                    
                    {/* Equipment type tabs - Updated labels */}
                    <div className="equipment-tabs">
                      <button
                        className={`equipment-tab ${activeEquipmentTab === 'stockable' ? 'active' : ''}`}
                        onClick={() => handleEquipmentTabChange('stockable')}
                      >
                        Stockable Equipment
                      </button>
                      <button
                        className={`equipment-tab ${activeEquipmentTab === 'solo' ? 'active' : ''}`}
                        onClick={() => handleEquipmentTabChange('solo')}
                      >
                        Solo Equipment {/* Changed from "Unique Equipment" */}
                      </button>
                    </div>
                    
                    <div className="filter-section">
                      <div className="filter-controls">
                        <div className="form-group">
                          <label className="checkbox-container">
                            <input 
                              type="checkbox" 
                              checked={showLowStock} 
                              onChange={() => setShowLowStock(!showLowStock)}
                            />
                            <span className="checkmark"></span>
                            Show only low stock items
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    {/* Stockable Equipment Table - Updated to match API structure */}
                    {activeEquipmentTab === 'stockable' && (
                      <div className="table-container glass-effect">
                        <h3>Stockable Equipment Inventory</h3>
                        <div className="responsive-table">
                          <table>
                            <thead>
                              <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Description</th>
                                <th>Quantity</th>
                                <th>QR Code</th>
                                <th>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {isLoading ? (
                                <tr>
                                  <td colSpan="6" className="centered-cell">Loading equipment...</td>
                                </tr>
                              ) : stockableEquipment.length === 0 ? (
                                <tr>
                                  <td colSpan="6" className="centered-cell">No stockable equipment found</td>
                                </tr>
                              ) : (
                                stockableEquipment
                                  .filter(item => !showLowStock || item.quantite < 5) // Use quantite instead of quantite_dispo
                                  .map(item => (
                                    <tr key={item.id}>
                                      <td>#{item.id}</td>
                                      <td>{item.nom}</td>
                                      <td>{item.description}</td>
                                      <td>{item.quantite}</td> {/* Use quantite instead of quantite_dispo */}
                                      <td>
                                        {item.qr_code ? 
                                          <button className="qr-button">View QR</button> : 
                                          <span>No QR Code</span>
                                        }
                                      </td>
                                      <td>
                                        <span className={`stock-level ${item.quantite < 5 ? 'low' : 'normal'}`}>
                                          {item.quantite < 5 ? 'Low Stock' : 'Normal'}
                                        </span>
                                      </td>
                                    </tr>
                                  ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Solo Equipment Table - Updated from Unique to Solo */}
                    {activeEquipmentTab === 'solo' && (
                      <div className="table-container glass-effect">
                        <h3>Solo Equipment Inventory</h3> {/* Changed from "Unique Equipment" */}
                        <div className="responsive-table">
                          <table>
                            <thead>
                              <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Description</th>
                                <th>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {isLoading ? (
                                <tr>
                                  <td colSpan="4" className="centered-cell">Loading equipment...</td>
                                </tr>
                              ) : soloEquipment.length === 0 ? (
                                <tr>
                                  <td colSpan="4" className="centered-cell">No solo equipment found</td>
                                </tr>
                              ) : (
                                soloEquipment.map(item => (
                                  <tr key={item.id}>
                                    <td>#{item.id}</td>
                                    <td>{item.nom}</td>
                                    <td>{item.description}</td>
                                    <td>
                                      <span className={`status-badge status-${item.etat}`}>
                                        {item.etat === 'disponible' ? 'Available' : 
                                         item.etat === 'en_cours' ? 'In Use' :
                                         'Unavailable'}
                                      </span>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </section>
                )}

                {activeTab === 'history' && (
                  <section id="history" className="dashboard-section active-section">
                    {/* History content - No changes needed */}
                    <div className="section-header">
                      <h2 className="section-title">Equipment Usage History</h2>
                      <div className="section-divider"></div>
                      <p className="section-description">
                        View historical data on equipment reservations and usage patterns
                      </p>
                    </div>
                    
                    <div className="chart-container glass-effect">
                      <h3>Monthly Usage Statistics</h3>
                      <div className="chart-placeholder">
                        <p>Graph will be displayed here</p>
                      </div>
                    </div>
                    
                    <div className="table-container glass-effect">
                      <h3>Recent Equipment Activity</h3>
                      <div className="responsive-table">
                        <table>
                          <thead>
                            <tr>
                              <th>Equipment</th>
                              <th>Student</th>
                              <th>Checkout Date</th>
                              <th>Return Date</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td>Laptop HP EliteBook</td>
                              <td>Sarah Johnson</td>
                              <td>2023-10-01</td>
                              <td>2023-10-08</td>
                              <td><span className="status-badge status-confirmed">Returned</span></td>
                            </tr>
                            <tr>
                              <td>Projector Epson</td>
                              <td>Michael Chang</td>
                              <td>2023-09-28</td>
                              <td>2023-10-05</td>
                              <td><span className="status-badge status-confirmed">Returned</span></td>
                            </tr>
                            <tr>
                              <td>Arduino Kit</td>
                              <td>Emma Wilson</td>
                              <td>2023-09-25</td>
                              <td>2023-10-02</td>
                              <td><span className="status-badge status-confirmed">Returned</span></td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </section>
                )}
              </div>
            </div>
          )}
          
          {/* Notifications View - No changes needed */}
          {activeView === 'notifications' && (
            <div className="dashboard-content notifications-view">
              <div className="section-header">
                <h2 className="section-title">System Notifications</h2>
                <p className="section-description">
                  View important alerts and messages related to equipment and reservations
                </p>
              </div>
              
              <div className="notifications-container">
                {notifications.length === 0 ? (
                  <div className="no-data">No notifications available</div>
                ) : (
                  <div className="notification-list">
                    {notifications.map(notification => (
                      <div 
                        key={notification.id} 
                        className={`notification-item ${notification.read ? '' : 'unread'}`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="notification-icon">
                          {!notification.read && <div className="unread-indicator"></div>}
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                          </svg>
                        </div>
                        <div className="notification-content">
                          <h3>{notification.title}</h3>
                          <p>{notification.message}</p>
                          <div className="notification-meta">
                            <span className="notification-time">{formatNotificationDate(notification.date)}</span>
                          </div>
                        </div>
                        <div className="notification-actions">
                          <button className="mark-read-btn" title={notification.read ? "Mark as unread" : "Mark as read"}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              {notification.read ? (
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                              ) : (
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                              )}
                              <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
      
      {/* Back to top button - No changes needed */}
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

export default Responsable;