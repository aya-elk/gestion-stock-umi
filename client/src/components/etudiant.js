import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../css/etudiant.css';

const Etudiant = () => {
  const navigate = useNavigate();
  // User authentication state
  const [currentUser, setCurrentUser] = useState(null);
  
  // State variables
  const [equipements, setEquipements] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [formData, setFormData] = useState({
    id_utilisateur: null, // Will be set from authenticated user
    date_debut: '',
    date_fin: ''
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  
  // Dashboard state variables
  const [activeView, setActiveView] = useState('browse');
  const [activeTab, setActiveTab] = useState('upcoming');
  
  // Cart functionality
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Notifications
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [filterStatus, setFilterStatus] = useState('all');

  // Check authentication when component mounts
  useEffect(() => {
    // Check for user in localStorage or sessionStorage
    const userFromStorage = JSON.parse(localStorage.getItem('userInfo')) || 
                            JSON.parse(sessionStorage.getItem('userInfo'));
    
    if (!userFromStorage) {
      // No user found, redirect to login
      navigate('/login');
      return;
    }
    
    // Check if user role is 'etudiant'
    if (userFromStorage.role !== 'etudiant') {
      // Wrong role, redirect to login
      navigate('/login');
      return;
    }
    
    // User is authenticated and has correct role
    setCurrentUser(userFromStorage);
    
    // Set user ID in form data
    setFormData(prev => ({
      ...prev,
      id_utilisateur: userFromStorage.id
    }));
    
  }, [navigate]);

  // Fetch equipment data independently (not dependent on authentication)
  useEffect(() => {
    // Always fetch equipment data regardless of authentication status
    fetchEquipments();
  }, []); // Empty dependency array means this runs once on component mount

  // Fetch user-specific data when user is authenticated
  useEffect(() => {
    if (currentUser && formData.id_utilisateur) {
      fetchReservations();
      fetchNotifications();
    }
  }, [currentUser, formData.id_utilisateur]);

  // Calendar localizer and events
  const localizer = momentLocalizer(moment);
  const calendarEvents = reservations.map(reservation => ({
    title: `Equipment: ${reservation.nom_equipement || reservation.id_equipement}`,
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

  // Scroll to top
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle tab changes
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Fetch equipment data from backend
  const fetchEquipments = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching equipment data from server...');
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
      
      const data = await response.json();
      console.log('Equipment data parsed successfully:', data.length, 'items');
      setEquipements(data);
    } catch (err) {
      setError('Error loading equipment data: ' + err.message);
      console.error('Equipment fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if equipment is available
  const isEquipmentAvailable = (equipment) => {
    if (equipment.categorie === 'stockable') {
      return equipment.quantite > 0;
    } else {
      return equipment.etat === 'disponible';
    }
  };

  // Get availability status text
  const getAvailabilityStatus = (equipment) => {
    if (equipment.categorie === 'stockable') {
      return equipment.quantite > 0 ? 'Available' : 'Out of Stock';
    } else {
      return equipment.etat === 'disponible' ? 'Available' : 
             equipment.etat === 'en_cours' ? 'In Use' :
             equipment.etat === 'en_reparation' ? 'In Repair' :
             'Unavailable';
    }
  };

  // Get status class for equipment
  const getStatusClass = (equipment) => {
    if (equipment.categorie === 'stockable') {
      return equipment.quantite > 0 ? 'status-disponible' : 'status-indisponible';
    } else {
      return `status-${equipment.etat || 'indisponible'}`;
    }
  };

  // Cart functions
  const addToCart = (equipment) => {
    // Check if item is already in cart
    if (!cart.some(item => item.id === equipment.id)) {
      setCart([...cart, { ...equipment, quantity: 1 }]);
      setSuccess(`${equipment.nom} added to cart`);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } else {
      setError("This item is already in your cart");
      
      // Clear error message after 3 seconds
      setTimeout(() => {
        setError(null);
      }, 3000);
    }
  };
  
  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };
  
  const clearCart = () => {
    setCart([]);
  };
  
  const updateQuantity = (id, quantity) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    
    // Find the current item to get its max quantity
    const item = cart.find(item => item.id === id);
    if (!item) return;
    
    // For stockable items, limit by available quantity
    const maxQuantity = item.categorie === 'stockable' ? item.quantite : 1;
    
    // Ensure we don't exceed maximum available quantity
    const newQuantity = Math.min(quantity, maxQuantity);
    
    setCart(cart.map(item => 
      item.id === id ? { ...item, quantity: newQuantity } : item
    ));
  };
  
  // Filter functions
  const handleFilterChange = (e) => {
    setFilterCategory(e.target.value);
  };
  
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  // Filter equipment based on category and search term
  const filteredEquipment = equipements.filter(equipment => {
    const matchesCategory = filterCategory === '' || equipment.categorie === filterCategory;
    const matchesSearch = searchTerm === '' || 
      equipment.nom.toLowerCase().includes(searchTerm.toLowerCase()) || 
      equipment.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  // Fetch reservation data from backend
  const fetchReservations = async () => {
    try {
      // Get user ID with multiple fallbacks - similar to handleReservationSubmit
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
      }
      
      // Use same fallback pattern as in reservation submission
      const userId = userFromStorage?.id || 
                    userFromStorage?.userId || 
                    userFromStorage?._id || 
                    (currentUser ? currentUser.id : null);
      
      if (!userId) {
        console.error("No user ID available for fetching reservations");
        return;
      }
      
      console.log("Fetching reservations for user ID:", userId);
      
      // Continue with your existing fetch logic
      const response = await fetch(`http://localhost:8080/api/reservations?userId=${userId}`, {
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`Failed to fetch reservation data: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Raw reservation data from API:', data);
      
      if (data.length === 0) {
        console.log("No reservations found for this user");
        setReservations([]);
        return;
      }
      
      // Group by reservation ID - no need to filter by user as the API already did
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
          reservationMap[item.id_reservation].equipment_items.push({
            id: item.id_equipement,
            name: item.nom_equipement,
            quantity: item.quantite_reservee
          });
        }
      });
      
      const finalReservations = Object.values(reservationMap);
      console.log('Final processed reservations:', finalReservations);
      
      // Update state
      setReservations(finalReservations);
    } catch (err) {
      console.error('Reservation fetch error:', err);
      setReservations([]);
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const userId = formData.id_utilisateur;
      if (!userId) return; // Don't fetch if no user ID
      
      const response = await fetch(`http://localhost:8080/api/notifications?userId=${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      
      const data = await response.json();
      setNotifications(data);
      
      // Count unread notifications
      const unread = data.filter(notification => notification.statut === 'envoye').length;
      setUnreadCount(unread);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  // Mark notification as read
  const markAsRead = async (id) => {
    try {
      const response = await fetch(`http://localhost:8080/api/notifications/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ statut: 'lu' }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }
      
      setNotifications(prevNotifications =>
        prevNotifications.map(notification =>
          notification.id === id ? { ...notification, statut: 'lu' } : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  // Format notification date
  const formatNotificationDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.round(diffMs / 60000);
    const diffHrs = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);
    
    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHrs < 24) {
      return `${diffHrs} hour${diffHrs !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
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
      // More robust storage check with error handling
      let userFromStorage;
      try {
        const localData = localStorage.getItem('userInfo');
        const sessionData = sessionStorage.getItem('userInfo');
        
        if (localData) {
          userFromStorage = JSON.parse(localData);
        } else if (sessionData) {
          userFromStorage = JSON.parse(sessionData);
        }
        
        console.log("User data found:", userFromStorage); // Debug output
      } catch (parseErr) {
        console.error("Error parsing storage data:", parseErr);
        throw new Error('Session data is corrupted. Please login again.');
      }
      
      // Check for user ID with fallbacks for different field names
      const userId = userFromStorage?.id || 
                     userFromStorage?.userId || 
                     userFromStorage?._id;
                     
      if (!userId) {
        // Use currentUser state as fallback if it exists
        if (currentUser && currentUser.id) {
          console.log("Using currentUser as fallback");
          userFromStorage = currentUser;
        } else {
          throw new Error('Unable to identify user. Please login again.');
        }
      }
      
      // Rest of your existing code...
      if (cart.length === 0) {
        throw new Error('Your cart is empty. Please add equipment before reserving.');
      }
      
      if (!formData.date_debut || !formData.date_fin) {
        throw new Error('Please select start and end dates for your reservation');
      }

      const startDate = new Date(formData.date_debut);
      const endDate = new Date(formData.date_fin);
      if (startDate >= endDate) {
        throw new Error('End date must be after start date');
      }

      // Create a single reservation with multiple equipment items
      const response = await fetch('http://localhost:8080/api/reservations/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_utilisateur: userId,
          date_debut: formData.date_debut,
          date_fin: formData.date_fin,
          items: cart.map(item => ({
            id_equipement: item.id,
            quantite: item.quantity || 1
          }))
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create reservation');
      }

      setSuccess('Reservation submitted successfully! Your request is pending approval.');
      
      // Give the server a moment to complete the transaction
      setTimeout(() => {
        fetchReservations(); // Reload the reservations to show the new ones
        fetchNotifications(); // Check for new notifications
      }, 1000);
      
      clearCart();
      setFormData(prevState => ({
        ...prevState,
        date_debut: '',
        date_fin: ''
      }));
      
      // Change to history view to let user see their reservations
      setTimeout(() => {
        setActiveView('history');
      }, 2000);
    } catch (err) {
      setError(err.message);
      console.error('Reservation submission error:', err);
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
    
    if (event.status === 'validee') {
      style.background = 'linear-gradient(135deg, #2ecc71, #27ae60)';
    } else if (event.status === 'refusee') {
      style.background = 'linear-gradient(135deg, #e74c3c, #c0392b)';
    } else {
      style.background = 'linear-gradient(135deg, #f39c12, #e67e22)';
    }
    
    return { style };
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
              className={`sidebar-nav-item ${activeView === 'browse' ? 'active' : ''}`}
              onClick={() => setActiveView('browse')}
              title="Browse Equipment"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
            </button>

            <button 
              className={`sidebar-nav-item ${activeView === 'calendar' ? 'active' : ''}`}
              onClick={() => setActiveView('calendar')}
              title="Calendar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </button>
            
            <button 
              className={`sidebar-nav-item ${activeView === 'reserve' ? 'active' : ''}`}
              onClick={() => setActiveView('reserve')}
              title="Complete Reservation"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="14 2 18 6 7 17 3 17 3 13 14 2"></polygon>
                <line x1="3" y1="22" x2="21" y2="22"></line>
              </svg>
            </button>
            
            <button 
              className={`sidebar-nav-item ${activeView === 'history' ? 'active' : ''}`}
              onClick={() => {
                setActiveView('history');
                fetchReservations(); // Force a refresh when viewing history
              }}
              title="Reservation History"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
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
            
            <button 
              className={`sidebar-nav-item ${activeView === 'help' ? 'active' : ''}`}
              onClick={() => setActiveView('help')}
              title="Help & FAQ"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
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
              // Clear user session when logging out
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
              <h1>Student Dashboard</h1>
              <p className="dashboard-subtitle">
                {activeView === 'browse' ? 'Browse and select available equipment' :
                 activeView === 'calendar' ? 'View and plan your equipment reservations' : 
                 activeView === 'reserve' ? 'Review cart and complete your reservation' :
                 activeView === 'history' ? 'Track your reservation history and status' :
                 activeView === 'notifications' ? 'View system notifications and alerts' :
                 'Get help with equipment reservations'}
              </p>
            </div>
            <div className="dashboard-actions">
              {activeView !== 'reserve' && (
                <div className="cart-button-container">
                  <button 
                    className="cart-button" 
                    onClick={() => setShowCart(!showCart)}
                    title="View Cart"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="9" cy="21" r="1"></circle>
                      <circle cx="20" cy="21" r="1"></circle>
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                    </svg>
                    {cart.length > 0 && (
                      <span className="cart-badge">{cart.length}</span>
                    )}
                  </button>
                </div>
              )}
              <div className="user-profile">
                <span className="user-greeting">Welcome, {currentUser.prenom || 'Student'}</span>
                <div className="user-avatar">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
              </div>
            </div>
          </header>
          
          {/* Shopping Cart Overlay */}
          {showCart && (
            <div className="cart-overlay">
              <div className="cart-container glass-effect">
                <div className="cart-header">
                  <h2>Your Reservation Cart</h2>
                  <button className="close-button" onClick={() => setShowCart(false)}>×</button>
                </div>
                
                <div className="cart-content">
                  {cart.length === 0 ? (
                    <p className="empty-cart">Your cart is empty. Browse equipment to add items to your reservation.</p>
                  ) : (
                    <>
                      <ul className="cart-items">
                        {cart.map(item => (
                          <li key={item.id} className="cart-item">
                            <div className="item-details">
                              <h4>{item.nom}</h4>
                              <span className="category-badge">{item.categorie}</span>
                            </div>
                            <div className="item-controls">
                              {item.categorie === 'stockable' && (
                                <div className="quantity-control">
                                  <button 
                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                    disabled={item.quantity <= 1}
                                  >-</button>
                                  <span>{item.quantity}</span>
                                  <button 
                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                    disabled={item.quantity >= item.quantite}
                                  >+</button>
                                </div>
                              )}
                              <button 
                                className="remove-btn" 
                                onClick={() => removeFromCart(item.id)}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <line x1="18" y1="6" x2="6" y2="18"></line>
                                  <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                      
                      <div className="cart-footer">
                        <button 
                          className="clear-cart-btn" 
                          onClick={clearCart}
                        >
                          Clear Cart
                        </button>
                        <button 
                          className="checkout-btn"
                          onClick={() => {
                            setActiveView('reserve');
                            setShowCart(false);
                          }}
                        >
                          Checkout
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Browse Equipment View */}
          {activeView === 'browse' && (
            <div className="dashboard-content">
              <div className="section-header">
                <h2 className="section-title">Available Equipment</h2>
                <div className="section-divider"></div>
                <p className="section-description">
                  Browse available equipment and add items to your reservation cart
                </p>
              </div>
              
              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}
              
              <div className="filter-section glass-effect">
                <h3>Filter Equipment</h3>
                <div className="filter-controls">
                  <div className="form-group">
                    <div className="search-container">
                      <input 
                        type="text" 
                        placeholder="Search equipment..." 
                        className="form-control"
                        value={searchTerm}
                        onChange={handleSearchChange}
                      />
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="search-icon">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                      </svg>
                    </div>
                  </div>
                  <div className="form-group">
                    <select 
                      className="form-control"
                      value={filterCategory}
                      onChange={handleFilterChange}
                    >
                      <option value="">All Categories</option>
                      <option value="stockable">Stockable Equipment</option>
                      <option value="solo">Solo Equipment</option>
                    </select>
                  </div>
                </div>
              </div>
              
              {isLoading ? (
                <div className="loading-spinner"></div>
              ) : (
                <div className="equipment-grid">
                  {filteredEquipment.length === 0 ? (
                    <div className="no-data">No equipment available matching your criteria</div>
                  ) : (
                    filteredEquipment.map(equipment => (
                      <div key={equipment.id} className="equipment-card glass-effect">
                        <div className="equipment-icon">
                          <div className="icon-circle">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              {equipment.categorie === 'stockable' ? (
                                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                              ) : (
                                <>
                                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                                  <line x1="8" y1="21" x2="16" y2="21"></line>
                                  <line x1="12" y1="17" x2="12" y2="21"></line>
                                </>
                              )}
                            </svg>
                          </div>
                        </div>
                        <h3 className="equipment-name">{equipment.nom}</h3>
                        <div className="equipment-meta">
                          <span className="category-badge">{equipment.categorie}</span>
                          {equipment.categorie === 'stockable' ? (
                            <span className={`stock-level ${equipment.quantite < 5 ? 'low' : 'normal'}`}>
                              {equipment.quantite} Available
                            </span>
                          ) : (
                            <span className={`status-badge ${getStatusClass(equipment)}`}>
                              {getAvailabilityStatus(equipment)}
                            </span>
                          )}
                        </div>
                        <p className="equipment-description">{equipment.description}</p>
                        <button 
                          className="add-to-cart-btn"
                          onClick={() => addToCart(equipment)}
                          disabled={!isEquipmentAvailable(equipment) || 
                                   cart.some(item => item.id === equipment.id)}
                        >
                          {cart.some(item => item.id === equipment.id) ? 'In Cart' : 'Add to Cart'}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Calendar View */}
          {activeView === 'calendar' && (
            <div className="dashboard-content">
              <div className="dashboard-tabs">
                <button 
                  className={`dashboard-tab ${activeTab === 'upcoming' ? 'active' : ''}`}
                  onClick={() => handleTabChange('upcoming')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  Upcoming Reservations
                </button>
                <button 
                  className={`dashboard-tab ${activeTab === 'monthly' ? 'active' : ''}`}
                  onClick={() => handleTabChange('monthly')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  Monthly View
                </button>
              </div>
              
              <div className="section-header">
                <h2 className="section-title">Reservation Calendar</h2>
                <div className="section-divider"></div>
                <p className="section-description">
                  View all your current and upcoming equipment reservations
                </p>
              </div>
              
              <div className="calendar-container glass-effect">
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
                    view={activeTab === 'monthly' ? 'month' : 'agenda'}
                    popup
                    selectable
                  />
                )}
              </div>
            </div>
          )}
          
          {/* Complete Reservation View */}
          {activeView === 'reserve' && (
            <div className="dashboard-content">
              <div className="section-header">
                <h2 className="section-title">Complete Your Reservation</h2>
                <div className="section-divider"></div>
                <p className="section-description">
                  Review your cart items and select dates for your reservation
                </p>
              </div>
              
              <div className="form-container glass-effect">
                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}
                
                <form className="reservation-form" onSubmit={handleReservationSubmit}>
                  <input 
                    type="hidden" 
                    name="id_utilisateur" 
                    value={formData.id_utilisateur} 
                  />
                  
                  <div className="cart-review">
                    <h3>Review Selected Equipment</h3>
                    {cart.length === 0 ? (
                      <div className="empty-cart-message">
                        <p>Your cart is empty. Please browse and select equipment before proceeding.</p>
                        <button 
                          type="button"
                          className="secondary-button"
                          onClick={() => setActiveView('browse')}
                        >
                          Browse Equipment
                        </button>
                      </div>
                    ) : (
                      <div className="cart-review-list">
                        {cart.map(item => (
                          <div key={item.id} className="cart-review-item">
                            <div className="item-details">
                              <h4>{item.nom}</h4>
                              <div className="item-meta">
                                <span className="category-badge">{item.categorie}</span>
                                {item.categorie === 'stockable' && (
                                  <span className="quantity-badge">Qty: {item.quantity}</span>
                                )}
                              </div>
                            </div>
                            <button 
                              type="button"
                              className="remove-btn" 
                              onClick={() => removeFromCart(item.id)}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                              </svg>
                            </button>
                          </div>
                        ))}
                        
                        <button 
                          type="button"
                          className="edit-cart-btn"
                          onClick={() => setActiveView('browse')}
                        >
                          Edit Cart
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="date-section">
                    <h3>Select Reservation Dates</h3>
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
                  </div>
                  
                  <div className="calendar-preview">
                    <h3>Date Preview</h3>
                    <div className="mini-calendar glass-effect">
                      <Calendar
                        localizer={localizer}
                        events={[
                          ...calendarEvents,
                          formData.date_debut && formData.date_fin ? {
                            title: 'New Reservation',
                            start: new Date(formData.date_debut),
                            end: new Date(formData.date_fin),
                            status: 'new'
                          } : null
                        ].filter(Boolean)}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: '300px' }}
                        className="custom-calendar"
                        eventPropGetter={(event) => ({
                          style: event.status === 'new' 
                            ? { background: 'linear-gradient(135deg, #3498db, #2980b9)', color: 'white', borderRadius: '4px' }
                            : eventStyleGetter(event).style
                        })}
                        views={['month']}
                        view="month"
                      />
                    </div>
                  </div>
                  
                  <button 
                    type="submit" 
                    className="submit-button" 
                    disabled={isLoading || cart.length === 0}
                  >
                    {isLoading ? 'Processing...' : 'Complete Reservation'} 
                    {!isLoading && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}
          
          {/* History View */}
          {activeView === 'history' && (
            <div className="dashboard-content">
              <div className="section-header">
                <h2 className="section-title">Reservation History</h2>
                <div className="section-divider"></div>
                <p className="section-description">
                  View the status of all your past and current equipment reservations
                </p>
              </div>
              
              <div className="filter-section">
                <h3>Filter Reservations</h3>
                <div className="filter-controls">
                  <div className="form-group">
                    <label htmlFor="filter_status">Status:</label>
                    <select 
                      id="filter_status"
                      className="form-control"
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <option value="all">All Reservations</option>
                      <option value="attente">Pending</option>
                      <option value="validee">Approved</option>
                      <option value="refusee">Rejected</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="table-container glass-effect">
                {isLoading ? (
                  <div className="loading-spinner"></div>
                ) : (
                  <div className="responsive-table">
                    {reservations.length === 0 ? (
                      <div className="no-data">No reservations found. Create a new reservation to see it here.</div>
                    ) : (
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
                          {reservations
                            .filter(res => filterStatus === 'all' || res.statut === filterStatus)
                            .map(reservation => {
                              let statusClass = '';
                              if (reservation.statut === 'validee') statusClass = 'status-confirmed';
                              else if (reservation.statut === 'attente') statusClass = 'status-pending';
                              else if (reservation.statut === 'refusee') statusClass = 'status-rejected';
                              
                              return (
                                <tr key={reservation.id_reservation}>
                                  <td>{reservation.id_reservation}</td>
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
                                      {reservation.statut === 'validee' ? 'Confirmed' : 
                                       reservation.statut === 'attente' ? 'Pending' : 'Rejected'}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Notifications View */}
          {activeView === 'notifications' && (
            <div className="dashboard-content notifications-view">
              <div className="section-header">
                <h2 className="section-title">Notifications</h2>
                <div className="section-divider"></div>
                <p className="section-description">
                  View important alerts and messages about your equipment reservations
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
                        className={`notification-item ${notification.statut === 'lu' ? '' : 'unread'}`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="notification-icon">
                          {notification.statut !== 'lu' && <div className="unread-indicator"></div>}
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                          </svg>
                        </div>
                        <div className="notification-content">
                          <h3>{notification.titre || 'System Notification'}</h3>
                          <p>{notification.message}</p>
                          <div className="notification-meta">
                            <span className="notification-time">{formatNotificationDate(notification.date_envoi)}</span>
                          </div>
                        </div>
                        <div className="notification-actions">
                          <button className="mark-read-btn" title={notification.statut === 'lu' ? "Mark as unread" : "Mark as read"}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              {notification.statut === 'lu' ? (
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
          
          {/* Help & FAQ View */}
          {activeView === 'help' && (
            <div className="dashboard-content">
              <div className="section-header">
                <h2 className="section-title">Frequently Asked Questions</h2>
                <div className="section-divider"></div>
                <p className="section-description">
                  Find answers to common questions about equipment reservations
                </p>
              </div>
              
              <div className="faq-container">
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
                    <p>Browse available equipment, add items to your cart, specify reservation dates, and submit your request. You'll receive a confirmation once approved.</p>
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
                
                <div className="contact-info glass-effect">
                  <h3>Need More Help?</h3>
                  <p>Contact the equipment management team:</p>
                  <ul>
                    <li>Email: support@gpequipment.com</li>
                    <li>Phone: +1 (555) 123-4567</li>
                    <li>Hours: Mon-Fri 8am-5pm</li>
                  </ul>
                </div>
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

export default Etudiant;