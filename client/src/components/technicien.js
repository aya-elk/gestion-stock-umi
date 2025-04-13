import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import '../css/technicien.css';

const Technicien = () => {
  // State for equipment list and form
  const [stockableEquipment, setStockableEquipment] = useState([]);
  const [soloEquipment, setSoloEquipment] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [formData, setFormData] = useState({
    id: '',
    nom: '',
    description: '',
    categorie: 'stockable', // Default category
    etat: 'disponible',
    quantite: '1'
  });
  
  // State for modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  
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
  const [activeView, setActiveView] = useState('equipment');
  const [activeTab, setActiveTab] = useState('inventory');
  const [activeEquipmentTab, setActiveEquipmentTab] = useState('stockable');
  const [showLowStock, setShowLowStock] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Equipment Repair Request',
      message: 'New repair request for Laptop HP EliteBook submitted by Sarah Johnson.',
      date: new Date(2023, 9, 15),
      read: false
    },
    {
      id: 2,
      title: 'Low Stock Alert',
      message: 'Projector inventory is running low. Only 2 units remaining.',
      date: new Date(2023, 9, 14),
      read: false
    },
    {
      id: 3,
      title: 'Maintenance Completed',
      message: 'NVIDIA GPU repairs have been completed and ready for verification.',
      date: new Date(2023, 9, 12),
      read: true
    }
  ]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Refs for sections and modals
  const equipmentRef = useRef(null);
  const reservationsRef = useRef(null);
  const modalRef = useRef(null);
  
  // Click outside modal handler
  useEffect(() => {
    function handleClickOutside(event) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setShowAddModal(false);
        setShowUpdateModal(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [modalRef]);
  
  useEffect(() => {
    const count = notifications.filter(n => !n.read).length;
    setUnreadCount(count);
  }, [notifications]);
  
  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    document.body.classList.toggle('dark-mode', newDarkMode);
  };

  // Mark notification as read
  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  // Format notification date
  const formatNotificationDate = (date) => {
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
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
    try {
      setIsLoading(true);
      setError(null);
      
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

  // Fetch reservation data
  const fetchReservations = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/reservations');
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

  // Open add modal with empty form
  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  // Open update modal with equipment data
  const openUpdateModal = (equipment) => {
    setFormData({
      id: equipment.id,
      nom: equipment.nom,
      description: equipment.description,
      categorie: equipment.categorie,
      etat: equipment.etat || 'disponible', // Use the enum value directly
      quantite: equipment.quantite || '1'
    });
    setShowUpdateModal(true);
  };

  // Close modals
  const closeModals = () => {
    setShowAddModal(false);
    setShowUpdateModal(false);
    setError(null);
    setSuccess(null);
  };

  // Handle form submission for adding equipment
  const handleAddEquipment = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch('http://localhost:8080/api/equipments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error('Failed to add equipment');
      }
      
      setSuccess('Equipment added successfully');
      fetchEquipments();
      
      // Close modal after short delay to show success message
      setTimeout(() => {
        setShowAddModal(false);
        resetForm();
      }, 1500);
    } catch (err) {
      setError('Error adding equipment: ' + err.message);
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
      const response = await fetch(`http://localhost:8080/api/equipments/${formData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error('Failed to update equipment');
      }
      
      setSuccess('Equipment updated successfully');
      fetchEquipments();
      
      // Close modal after short delay to show success message
      setTimeout(() => {
        setShowUpdateModal(false);
        resetForm();
      }, 1500);
    } catch (err) {
      setError('Error updating equipment: ' + err.message);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle equipment deletion
  const handleDeleteEquipment = async (id) => {
    if (!id) {
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
      const response = await fetch(`http://localhost:8080/api/equipments/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error('Failed to delete equipment');
      }
      
      setSuccess('Equipment deleted successfully');
      fetchEquipments();
    } catch (err) {
      setError('Error deleting equipment: ' + err.message);
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
      categorie: 'stockable',
      etat: 'disponible',
      quantite: '1'
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
      const response = await fetch(`http://localhost:8080/api/reservations/${id}`, {
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

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };
  
  // Toggle between stockable and solo equipment tabs
  const handleEquipmentTabChange = (tabType) => {
    setActiveEquipmentTab(tabType);
  };

  // Add this function to handle status updates
  const handleUpdateEquipmentStatus = async (id, newStatus) => {
    if (!id) {
      setError('No equipment selected for update');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch(`http://localhost:8080/api/equipments/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ etat: newStatus }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error('Failed to update equipment status');
      }
      
      setSuccess(`Equipment status updated to ${newStatus}`);
      fetchEquipments();
    } catch (err) {
      setError('Error updating equipment status: ' + err.message);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

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
              className={`sidebar-nav-item ${activeView === 'equipment' ? 'active' : ''}`}
              onClick={() => setActiveView('equipment')}
              title="Equipment Management"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
            </button>
            
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
              <h1>Technician Dashboard</h1>
              <p className="dashboard-subtitle">
                {activeView === 'equipment' 
                  ? 'Manage equipment inventory and technical status' 
                  : activeView === 'reservations'
                  ? 'Track and update reservation statuses'
                  : 'View system notifications and alerts'}
              </p>
            </div>
            <div className="dashboard-actions">
              <div className="user-profile">
                <span className="user-greeting">Welcome, Technician</span>
                <div className="user-avatar">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
              </div>
            </div>
          </header>
          
          {/* Equipment Management View */}
          {activeView === 'equipment' && (
            <div className="dashboard-content">
              <div className="dashboard-tabs">
                <button 
                  className={`dashboard-tab ${activeTab === 'inventory' ? 'active' : ''}`}
                  onClick={() => handleTabChange('inventory')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                  </svg>
                  Inventory Management
                </button>
                <button 
                  className={`dashboard-tab ${activeTab === 'maintenance' ? 'active' : ''}`}
                  onClick={() => handleTabChange('maintenance')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                  </svg>
                  Maintenance & Repairs
                </button>
              </div>

              <div className="dashboard-sections">
                {/* Equipment Inventory Section */}
                {activeTab === 'inventory' && (
                  <section id="inventory" className="dashboard-section active-section">
                    <div className="section-header">
                      <h2 className="section-title">Equipment Inventory</h2>
                      <div className="section-divider"></div>
                      <p className="section-description">
                        Add, update, and manage equipment in your inventory system
                      </p>
                    </div>
                    
                    {/* Equipment type tabs */}
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
                      {activeEquipmentTab === 'stockable' ? (
                        // For stockable equipment - only show low stock filter checkbox
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
                      ) : (
                        // For solo equipment - only show status filter
                        <>
                          <h3>Filter Equipment</h3>
                          <div className="filter-controls">
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
                                <option value="en_cours">Under Repair</option>
                                <option value="indisponible">Out of Service</option>
                              </select>
                            </div>
                            <button 
                              className="secondary-button" 
                              onClick={() => setFilterStatus('')}
                            >
                              Clear Filter
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                    
                    {/* Stockable Equipment Table */}
                    {activeEquipmentTab === 'stockable' && (
                      <div className="table-container glass-effect">
                        <div className="table-header">
                          <h3>Stockable Equipment List</h3>
                          <button 
                            className="add-button" 
                            onClick={() => {
                              setFormData(prev => ({ ...prev, categorie: 'stockable' }));
                              openAddModal();
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="12" y1="5" x2="12" y2="19"></line>
                              <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            Add Stockable Equipment
                          </button>
                        </div>
                        
                        <div className="responsive-table">
                          {isLoading && !stockableEquipment.length ? (
                            <div className="loading-spinner"></div>
                          ) : (
                            <table>
                              <thead>
                                <tr>
                                  <th>ID</th>
                                  <th>Name</th>
                                  <th>Description</th>
                                  <th>Category</th>
                                  <th>Quantity</th>
                                  <th>Status</th>
                                  <th>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {stockableEquipment.length === 0 ? (
                                  <tr>
                                    <td colSpan="7" className="centered-cell">No stockable equipment found</td>
                                  </tr>
                                ) : (
                                  stockableEquipment
                                    .filter(item => !showLowStock || item.quantite < 5)
                                    .map(equipment => (
                                    <tr key={equipment.id}>
                                      <td>{equipment.id}</td>
                                      <td>{equipment.nom}</td>
                                      <td>{equipment.description}</td>
                                      <td>
                                        <span className="category-badge">{equipment.categorie}</span>
                                      </td>
                                      <td>{equipment.quantite}</td>
                                      <td>
                                        <span className={`stock-level ${equipment.quantite < 5 ? 'low' : 'normal'}`}>
                                          {equipment.quantite < 5 ? 'Low Stock' : 'Normal'}
                                        </span>
                                      </td>
                                      <td className="action-buttons">
                                        <button 
                                          onClick={() => openUpdateModal(equipment)}
                                          className="edit-button"
                                          title="Edit"
                                        >
                                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M12 20h9"></path>
                                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                                          </svg>
                                        </button>
                                        <button 
                                          onClick={() => handleDeleteEquipment(equipment.id)}
                                          className="delete-button-small"
                                          title="Delete"
                                        >
                                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="3 6 5 6 21 6"></polyline>
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
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
                    )}
                    
                    {/* Solo Equipment Table */}
                    {activeEquipmentTab === 'solo' && (
                      <div className="table-container glass-effect">
                        <div className="table-header">
                          <h3>Solo Equipment List</h3>
                          <button 
                            className="add-button" 
                            onClick={() => {
                              setFormData(prev => ({ ...prev, categorie: 'solo' }));
                              openAddModal();
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="12" y1="5" x2="12" y2="19"></line>
                              <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            Add Solo Equipment
                          </button>
                        </div>
                        
                        <div className="responsive-table">
                          {isLoading && !soloEquipment.length ? (
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
                                  <th>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {soloEquipment.length === 0 ? (
                                  <tr>
                                    <td colSpan="6" className="centered-cell">No solo equipment found</td>
                                  </tr>
                                ) : (
                                  soloEquipment
                                    // Apply status filter if selected
                                    .filter(item => filterStatus === '' || item.etat === filterStatus)
                                    .map(equipment => (
                                    <tr key={equipment.id}>
                                      <td>{equipment.id}</td>
                                      <td>{equipment.nom}</td>
                                      <td>{equipment.description}</td>
                                      <td>
                                        <span className="category-badge">{equipment.categorie}</span>
                                      </td>
                                      <td>
                                        <span className={`status-badge status-${equipment.etat}`}>
                                          {equipment.etat === 'disponible' ? 'Available' : 
                                           equipment.etat === 'en_cours' ? 'Under Repair' : 'Out of Service'}
                                        </span>
                                      </td>
                                      <td className="action-buttons">
                                        <button 
                                          onClick={() => openUpdateModal(equipment)}
                                          className="edit-button"
                                          title="Edit"
                                        >
                                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M12 20h9"></path>
                                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                                          </svg>
                                        </button>
                                        <button 
                                          onClick={() => handleDeleteEquipment(equipment.id)}
                                          className="delete-button-small"
                                          title="Delete"
                                        >
                                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="3 6 5 6 21 6"></polyline>
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
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
                    )}
                  </section>
                )}

                {/* Maintenance Section */}
                {activeTab === 'maintenance' && (
                  <section id="maintenance" className="dashboard-section active-section">
                    <div className="section-header">
                      <h2 className="section-title">Maintenance & Repairs</h2>
                      <div className="section-divider"></div>
                      <p className="section-description">
                        Track and manage equipment that requires maintenance or is currently under repair
                      </p>
                    </div>
                    
                    <div className="table-container glass-effect">
                      <h3>Equipment Under Maintenance</h3>
                      <div className="responsive-table">
                        {isLoading ? (
                          <div className="loading-spinner"></div>
                        ) : (
                          <table>
                            <thead>
                              <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Category</th>
                                <th>Status</th>
                                <th>Description</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {soloEquipment.filter(item => item.etat === 'en_cours').length === 0 ? (
                                <tr>
                                  <td colSpan="6" className="centered-cell">No equipment currently under maintenance</td>
                                </tr>
                              ) : (
                                soloEquipment.filter(item => item.etat === 'en_cours').map(equipment => (
                                  <tr key={equipment.id}>
                                    <td>{equipment.id}</td>
                                    <td>{equipment.nom}</td>
                                    <td><span className="category-badge">{equipment.categorie}</span></td>
                                    <td><span className="status-badge status-en_cours">Under Repair</span></td>
                                    <td>{equipment.description}</td>
                                    <td className="action-buttons">
                                      <button 
                                        className="confirm-btn" 
                                        title="Mark as Available"
                                        onClick={() => handleUpdateEquipmentStatus(equipment.id, 'disponible')}
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                          <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                        </svg>
                                        Mark Available
                                      </button>
                                      <button 
                                        className="delete-button-small" 
                                        title="Mark as Unavailable"
                                        onClick={() => handleUpdateEquipmentStatus(equipment.id, 'indisponible')}
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <circle cx="12" cy="12" r="10"></circle>
                                          <line x1="15" y1="9" x2="9" y2="15"></line>
                                          <line x1="9" y1="9" x2="15" y2="15"></line>
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
                )}
              </div>
            </div>
          )}
          
          {/* Reservations View */}
          {activeView === 'reservations' && (
            <div className="dashboard-content reservations-view">
              <div className="section-header">
                <h2 className="section-title">Reservation Tracking</h2>
                <div className="section-divider"></div>
                <p className="section-description">
                  Manage and track equipment reservations and their statuses
                </p>
              </div>
              
              <div className="filter-section">
                <h3>Filter Reservations</h3>
                <div className="filter-controls">
                  <div className="form-group">
                    <label htmlFor="filter_status">Status:</label>
                    <select 
                      name="filter_status" 
                      id="filter_status"
                      className="form-control"
                    >
                      <option value="all">All Reservations</option>
                      <option value="en_attente">Pending</option>
                      <option value="en_cours">In Progress</option>
                      <option value="confirmé">Confirmed</option>
                    </select>
                  </div>
                  <button className="secondary-button">Clear Filters</button>
                </div>
              </div>
              
              <div className="table-container glass-effect">
                <h3>Reservation Management</h3>
                <div className="responsive-table">
                  {isLoading ? (
                    <div className="loading-spinner"></div>
                  ) : (
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
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Notifications View */}
          {activeView === 'notifications' && (
            <div className="dashboard-content notifications-view">
              <div className="section-header">
                <h2 className="section-title">System Notifications</h2>
                <p className="section-description">
                  View important alerts and messages related to equipment maintenance and reservations
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
                            {notification.read ? (
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            ) : (
                              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            )}
                            <circle cx="12" cy="12" r="3"></circle>
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
      
      {/* Add Equipment Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-container" ref={modalRef}>
            <div className="modal-header">
              <h3>Add New Equipment</h3>
              <button className="modal-close" onClick={closeModals}>×</button>
            </div>
            <div className="modal-body">
              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}
              
              <form className="equipment-form" onSubmit={handleAddEquipment}>
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
                    <label htmlFor="categorie">Type:</label>
                    <select
                      name="categorie"
                      id="categorie"
                      required
                      value={formData.categorie || 'stockable'}
                      onChange={handleInputChange}
                      className="form-control"
                    >
                      <option value="stockable">Stockable</option>
                      <option value="solo">Solo</option>
                    </select>
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
                      <option value="en_cours">Under Repair</option>
                      <option value="indisponible">Out of Service</option>
                    </select>
                  </div>
                </div>
                
                {formData.categorie === 'stockable' && (
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
                )}
                
                <div className="modal-actions">
                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="submit-button"
                  >
                    {isLoading ? 'Processing...' : 'Add Equipment'}
                  </button>
                  <button 
                    type="button" 
                    onClick={closeModals}
                    className="cancel-button"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Update Equipment Modal */}
      {showUpdateModal && (
        <div className="modal-overlay">
          <div className="modal-container" ref={modalRef}>
            <div className="modal-header">
              <h3>Update Equipment</h3>
              <button className="modal-close" onClick={closeModals}>×</button>
            </div>
            <div className="modal-body">
              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}
              
              <form className="equipment-form" onSubmit={handleUpdateEquipment}>
                <input type="hidden" name="id" value={formData.id || ''} />
                <div className="form-group">
                  <label htmlFor="update_nom">Name:</label>
                  <input 
                    type="text" 
                    name="nom" 
                    id="update_nom"
                    placeholder="Equipment name" 
                    required 
                    value={formData.nom || ''} 
                    onChange={handleInputChange} 
                    className="form-control"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="update_description">Description:</label>
                  <textarea 
                    name="description" 
                    id="update_description"
                    placeholder="Equipment description" 
                    required 
                    value={formData.description || ''} 
                    onChange={handleInputChange}
                    className="form-control" 
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="update_categorie">Type:</label>
                    <select
                      name="categorie"
                      id="update_categorie"
                      required
                      value={formData.categorie || 'stockable'}
                      onChange={handleInputChange}
                      className="form-control"
                      disabled
                    >
                      <option value="stockable">Stockable</option>
                      <option value="solo">Solo</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="update_etat">Status:</label>
                    <select 
                      name="etat" 
                      id="update_etat"
                      required 
                      value={formData.etat || 'disponible'} 
                      onChange={handleInputChange}
                      className="form-control"
                    >
                      <option value="disponible">Available</option>
                      <option value="en_cours">Under Repair</option>
                      <option value="indisponible">Out of Service</option>
                    </select>
                  </div>
                </div>
                
                {formData.categorie === 'stockable' && (
                  <div className="form-group">
                    <label htmlFor="update_quantite">Quantity:</label>
                    <input 
                      type="number" 
                      name="quantite" 
                      id="update_quantite"
                      placeholder="Quantity" 
                      required 
                      value={formData.quantite || '1'} 
                      onChange={handleInputChange}
                      className="form-control" 
                      min="1"
                    />
                  </div>
                )}
                
                <div className="modal-actions">
                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="update-button"
                  >
                    {isLoading ? 'Processing...' : 'Update Equipment'}
                  </button>
                  <button 
                    type="button" 
                    onClick={closeModals}
                    className="cancel-button"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
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

export default Technicien;