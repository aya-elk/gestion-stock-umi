import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SignatureCanvas from 'react-signature-canvas';
import moment from 'moment';
import '../css/responsable.css';

const Responsable = () => {
  // Navigation for redirects
  const navigate = useNavigate();
  
  // Current user state for authentication
  const [currentUser, setCurrentUser] = useState(null);
  
  // State variables (keeping existing ones)
  const [reservations, setReservations] = useState([]);
  const [stockableEquipment, setStockableEquipment] = useState([]);
  const [soloEquipment, setSoloEquipment] = useState([]);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [activeEquipmentTab, setActiveEquipmentTab] = useState('stockable'); 
  const [signatureURL, setSignatureURL] = useState(null);
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [filterStatus, setFilterStatus] = useState('attente');
  const [showLowStock, setShowLowStock] = useState(false);
  const [activeView, setActiveView] = useState('reservations');
  const [notifications, setNotifications] = useState([]);
  const [activityHistory, setActivityHistory] = useState([]);

  // Refs for sections
  const pendingRef = useRef(null);
  const stockRef = useRef(null);
  const historyRef = useRef(null);
  const sigPadRef = useRef({});

  // Authentication check on component mount
  useEffect(() => {
    // Check if user is logged in and has role 'responsable'
    let userFromStorage;
    try {
      const localData = localStorage.getItem('userInfo');
      const sessionData = sessionStorage.getItem('userInfo');
      
      if (localData) {
        userFromStorage = JSON.parse(localData);
      } else if (sessionData) {
        userFromStorage = JSON.parse(sessionData);
      }
    } catch (parseErr) {
      console.error("Error parsing storage data:", parseErr);
      navigate('/login');
      return;
    }
    
    // If no user data or wrong role, redirect to login
    if (!userFromStorage) {
      navigate('/login');
      return;
    }
    
    // Check if user role is 'responsable'
    if (userFromStorage.role !== 'responsable') {
      // Wrong role, redirect to login
      navigate('/login');
      return;
    }
    
    // User is authenticated and has correct role
    setCurrentUser(userFromStorage);
  }, [navigate]);

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

  // Handle scroll for back to top button
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

  // Fetch data when user is authenticated and when filter changes
  useEffect(() => {
    if (currentUser) {
      fetchReservations();
      fetchStocks();
      fetchNotifications();
      if (activeTab === 'history') {
        fetchRecentActivity();
      }
    }
  }, [filterStatus, currentUser, activeTab]);

  // Scroll to top
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Fetch reservation data from API with proper grouping
  const fetchReservations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Build the endpoint with status filter if needed
      let endpoint = 'http://localhost:8080/api/reservations';
      if (filterStatus !== 'all') {
        endpoint += `?status=${filterStatus}`;
      }
      
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch reservations: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Raw reservation data:', data);
      
      if (data.length === 0) {
        setReservations([]);
        setIsLoading(false);
        return;
      }
      
      // Group by reservation ID to handle multiple equipment items per reservation
      const reservationMap = {};
      
      data.forEach(item => {
        if (!reservationMap[item.id_reservation]) {
          reservationMap[item.id_reservation] = {
            ...item,
            equipment_items: [{
              id: item.id_equipement,
              name: item.nom_equipement,
              quantity: item.quantite_reservee
            }]
          };
        } else {
          // Add additional equipment to existing reservation
          reservationMap[item.id_reservation].equipment_items.push({
            id: item.id_equipement,
            name: item.nom_equipement,
            quantity: item.quantite_reservee
          });
        }
      });
      
      const finalReservations = Object.values(reservationMap);
      console.log('Processed reservations:', finalReservations);
      
      setReservations(finalReservations);
    } catch (err) {
      setError("Error fetching reservations: " + err.message);
      console.error('Reservation fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Update the fetchRecentActivity function to get all validated reservations, not just recent ones
  const fetchRecentActivity = async () => {
    try {
      setIsLoading(true);
      
      // Get all approved reservations, not just recent ones
      const response = await fetch('http://localhost:8080/api/reservations?status=validee');
      
      if (!response.ok) {
        throw new Error('Failed to fetch activity history');
      }
      
      const data = await response.json();
      console.log('Activity history data:', data);
      
      // Set the activity data to state
      setActivityHistory(data);
    } catch (err) {
      console.error('Error fetching activity history:', err);
      setActivityHistory([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Updated fetch stocks function 
  const fetchStocks = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
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
      
      const equipment = await response.json();
      
      // Filter based on the database categories
      const stockable = equipment.filter(item => item.categorie === 'stockable');
      const solo = equipment.filter(item => item.categorie === 'solo');
      
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

  // Fetch real notifications from API
  const fetchNotifications = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/notifications/admin');
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
        return;
      }
      
      const data = await response.json();
      setNotifications(data);
    } catch (err) {
      console.error('Notification fetch error:', err);
      // Fallback to dummy data if API fails
      const dummyNotifications = [
        {
          id: 1,
          title: 'New reservation request',
          message: 'A new reservation has been submitted for approval',
          date: new Date(new Date().getTime() - 1000 * 60 * 30).toISOString(),
          read: false
        },
        {
          id: 2,
          title: 'Low stock alert',
          message: 'Laptops are running low. Currently at 3 units.',
          date: new Date(new Date().getTime() - 1000 * 60 * 60 * 2).toISOString(),
          read: false
        }
      ];
      setNotifications(dummyNotifications);
    }
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
    
    // Fetch activity history when switching to the history tab
    if (tab === 'history') {
      fetchRecentActivity();
    }
  };

  // Toggle between equipment types
  const handleEquipmentTabChange = (tabType) => {
    setActiveEquipmentTab(tabType);
  };

  // Handle reservation approval
  const handleApproveReservation = async (reservationId) => {
    await handleReservationStatusUpdate(reservationId, 'validee');
  };

  // Handle reservation rejection
  const handleRejectReservation = async (reservationId) => {
    await handleReservationStatusUpdate(reservationId, 'refusee');
  };

  // Generic function for updating reservation status
  const handleReservationStatusUpdate = async (reservationId, newStatus) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch(`http://localhost:8080/api/reservations/${reservationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ statut: newStatus })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to update reservation status to ${newStatus}`);
      }
      
      setSuccess(`Reservation ${reservationId} has been ${newStatus === 'validee' ? 'approved' : 'rejected'} successfully`);
      
      // Refresh the reservations list
      setTimeout(() => {
        fetchReservations();
        fetchStocks(); // Refresh stock as it might have changed
        fetchNotifications(); // Check for new system notifications
        if (activeTab === 'history') {
          fetchRecentActivity(); // Refresh activity history if we're on that tab
        }
      }, 1000);
      
    } catch (err) {
      setError(`Error updating reservation: ${err.message}`);
      console.error('Update reservation error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add these helper functions before the return statement
  const getActivityStatus = (activity) => {
    // For equipment activities, check if the equipment is in repair
    if (activity.etat === 'en_reparation') {
      return 'In Repair';
    }
    
    const now = new Date();
    const startDate = new Date(activity.date_debut);
    const endDate = new Date(activity.date_fin);
    
    if (now < startDate) {
      return 'Scheduled';
    } else if (now > endDate) {
      return 'Returned';
    } else {
      return 'In Use';
    }
  };

  const getActivityStatusClass = (activity) => {
    if (activity.etat === 'en_reparation') {
      return 'status-repair';
    }
    
    const now = new Date();
    const startDate = new Date(activity.date_debut);
    const endDate = new Date(activity.date_fin);
    
    if (now < startDate) {
      return 'status-scheduled';
    } else if (now > endDate) {
      return 'status-confirmed';
    } else {
      return 'status-current';
    }
  };

  // If not authenticated yet, show loading
  if (!currentUser) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Verifying authentication...</p>
      </div>
    );
  }

  return (
    <div className={darkMode ? "dark-mode" : ""}>
      <div className="dashboard-layout">
        {/* Sidebar */}
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
            <Link to="/login" className="sidebar-logout" title="Logout" onClick={() => {
              localStorage.removeItem('userInfo');
              sessionStorage.removeItem('userInfo');
            }}>
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
                <span className="user-greeting">Welcome, {currentUser.prenom || 'Manager'}</span>
                <div className="user-avatar">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
              </div>
            </div>
          </header>
          
          {/* Success and error messages */}
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          
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
                {/* Pending Reservations Section */}
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
                            <option value="attente">Pending</option>
                            <option value="validee">Approved</option>
                            <option value="refusee">Refused</option>
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
                              <th>Start Date</th>
                              <th>End Date</th>
                              <th>Status</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {isLoading ? (
                              <tr>
                                <td colSpan="7" className="centered-cell">Loading reservations...</td>
                              </tr>
                            ) : reservations.length === 0 ? (
                              <tr>
                                <td colSpan="7" className="centered-cell">No reservations found</td>
                              </tr>
                            ) : (
                              reservations.map(reservation => {
                                let statusClass = '';
                                if (reservation.statut === 'validee') statusClass = 'status-confirmed';
                                else if (reservation.statut === 'attente') statusClass = 'status-pending';
                                else if (reservation.statut === 'refusee') statusClass = 'status-rejected';
                                
                                return (
                                  <tr key={reservation.id_reservation}>
                                    <td>#{reservation.id_reservation}</td>
                                    <td>
                                      {reservation.nom_utilisateur} {reservation.prenom_utilisateur}
                                    </td>
                                    <td>
                                      {reservation.equipment_items ? (
                                        <div className="equipment-list">
                                          {reservation.equipment_items.map((item, idx) => (
                                            <div key={idx} className="equipment-item">
                                              {item.name || `Item #${item.id}`}
                                              {item.quantity > 1 && <span className="quantity-badge"> x{item.quantity}</span>}
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        reservation.nom_equipement || reservation.id_equipement
                                      )}
                                    </td>
                                    <td>{moment(reservation.date_debut).format('MMM DD, YYYY')}</td>
                                    <td>{moment(reservation.date_fin).format('MMM DD, YYYY')}</td>
                                    <td>
                                      <span className={`status-badge ${statusClass}`}>
                                        {reservation.statut === 'validee' ? 'Approved' : 
                                         reservation.statut === 'attente' ? 'Pending' : 'Rejected'}
                                      </span>
                                    </td>
                                    <td>
                                      {reservation.statut === 'attente' && (
                                        <div className="action-buttons">
                                          <button 
                                            className="approve-btn"
                                            onClick={() => handleApproveReservation(reservation.id_reservation)}
                                            disabled={isSubmitting}
                                          >
                                            {isSubmitting ? 'Processing...' : 'Approve'}
                                          </button>
                                          <button 
                                            className="reject-btn"
                                            onClick={() => handleRejectReservation(reservation.id_reservation)}
                                            disabled={isSubmitting}
                                          >
                                            {isSubmitting ? 'Processing...' : 'Reject'}
                                          </button>
                                        </div>
                                      )}
                                      {reservation.statut !== 'attente' && (
                                        <span className="status-text">
                                          {reservation.statut === 'validee' ? 'Approved' : 'Rejected'}
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </section>
                )}

                {/* Stock Monitoring Section */}
                {activeTab === 'stock' && (
                  <section id="stock" className="dashboard-section active-section">
                    <div className="section-header">
                      <h2 className="section-title">Stock Monitoring</h2>
                      <div className="section-divider"></div>
                      <p className="section-description">
                        Monitor equipment stock levels and identify items approaching critical thresholds
                      </p>
                    </div>
                    
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
                        Solo Equipment
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
                                <th>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {isLoading ? (
                                <tr>
                                  <td colSpan="5" className="centered-cell">Loading equipment...</td>
                                </tr>
                              ) : stockableEquipment.length === 0 ? (
                                <tr>
                                  <td colSpan="5" className="centered-cell">No stockable equipment found</td>
                                </tr>
                              ) : (
                                stockableEquipment
                                  .filter(item => !showLowStock || item.quantite < 5)
                                  .map(item => (
                                    <tr key={item.id}>
                                      <td>#{item.id}</td>
                                      <td>{item.nom}</td>
                                      <td>{item.description}</td>
                                      <td>{item.quantite}</td>
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

                    {activeEquipmentTab === 'solo' && (
                      <div className="table-container glass-effect">
                        <h3>Solo Equipment Inventory</h3>
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
                                         item.etat === 'en_reparation' ? 'In Repair' :
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

                {/* History Section - UPDATED to show real data */}
                {activeTab === 'history' && (
                  <section id="history" className="dashboard-section active-section">
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
                            {isLoading ? (
                              <tr>
                                <td colSpan="5" className="centered-cell">Loading activity history...</td>
                              </tr>
                            ) : activityHistory.length === 0 ? (
                              <tr>
                                <td colSpan="5" className="centered-cell">No equipment activity found</td>
                              </tr>
                            ) : (
                              activityHistory.map((activity) => (
                                <tr key={`${activity.id_reservation}-${activity.id_equipement}`}>
                                  <td>{activity.nom_equipement}</td>
                                  <td>{activity.prenom_utilisateur} {activity.nom_utilisateur}</td>
                                  <td>{moment(activity.date_debut).format('MMM DD, YYYY')}</td>
                                  <td>{moment(activity.date_fin).format('MMM DD, YYYY')}</td>
                                  <td>
                                    <span className={`status-badge ${getActivityStatusClass(activity)}`}>
                                      {getActivityStatus(activity)}
                                    </span>
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
              </div>
            </div>
          )}
          
          {/* Notifications View */}
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
      
      {/* Back to top button */}
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