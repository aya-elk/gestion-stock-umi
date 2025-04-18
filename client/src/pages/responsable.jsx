import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import moment from 'moment';
import '../css/responsable.css';

const Responsable = () => {
  // Navigation pour les redirections
  const navigate = useNavigate();

  // État de l'utilisateur actuel pour l'authentification
  const [currentUser, setCurrentUser] = useState(null);

  // Variables d'état (conservation des existantes)
  const [reservations, setReservations] = useState([]);
  const [stockableEquipment, setStockableEquipment] = useState([]);
  const [soloEquipment, setSoloEquipment] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [activeEquipmentTab, setActiveEquipmentTab] = useState('stockable');
  const [filterStatus, setFilterStatus] = useState('attente');
  const [showLowStock, setShowLowStock] = useState(false);
  const [activeView, setActiveView] = useState('reservations');
  const [notifications, setNotifications] = useState([]);
  const [activityHistory, setActivityHistory] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Vérification d'authentification au montage du composant
  useEffect(() => {
    // Vérifier si l'utilisateur est connecté et a le rôle 'responsable'
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
      console.error("Erreur d'analyse des données stockées:", parseErr);
      navigate('/login');
      return;
    }

    // Si aucune donnée utilisateur ou mauvais rôle, rediriger vers la page de connexion
    if (!userFromStorage) {
      navigate('/login');
      return;
    }

    // Vérifier si le rôle de l'utilisateur est 'responsable'
    if (userFromStorage.role !== 'responsable') {
      // Mauvais rôle, rediriger vers la page de connexion
      navigate('/login');
      return;
    }

    // L'utilisateur est authentifié et a le bon rôle
    setCurrentUser(userFromStorage);
  }, [navigate]);

  // Chargement initial des données
  useEffect(() => {
    fetchStocks();
    fetchNotifications();
    fetchRecentActivity();
  }, []);

  // Basculer le mode sombre
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Gérer le défilement pour le bouton retour en haut
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

  // Récupérer les données lorsque l'utilisateur est authentifié et lorsque le filtre change
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

  // Défiler vers le haut
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Récupérer les données de réservation depuis l'API avec un regroupement approprié
  const fetchReservations = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Construire le point de terminaison avec filtre de statut si nécessaire
      let endpoint = 'http://localhost:8080/api/reservations';
      if (filterStatus !== 'all') {
        endpoint += `?status=${filterStatus}`;
      }

      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error(`Échec de récupération des réservations: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Données brutes de réservation:', data);

      if (data.length === 0) {
        setReservations([]);
        setIsLoading(false);
        return;
      }

      // Regrouper par ID de réservation pour gérer plusieurs équipements par réservation
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
          // Ajouter des équipements supplémentaires à la réservation existante
          reservationMap[item.id_reservation].equipment_items.push({
            id: item.id_equipement,
            name: item.nom_equipement,
            quantity: item.quantite_reservee
          });
        }
      });

      const finalReservations = Object.values(reservationMap);
      console.log('Réservations traitées:', finalReservations);

      setReservations(finalReservations);
    } catch (err) {
      setError("Erreur lors de la récupération des réservations: " + err.message);
      console.error('Erreur de récupération des réservations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Mettre à jour la fonction fetchRecentActivity pour obtenir toutes les réservations validées, pas seulement les récentes
  const fetchRecentActivity = async () => {
    try {
      setIsLoading(true);

      // Obtenir toutes les réservations approuvées, pas seulement les récentes
      const response = await fetch('http://localhost:8080/api/reservations?status=validee');

      if (!response.ok) {
        throw new Error('Échec de récupération de l\'historique des activités');
      }

      const data = await response.json();
      console.log('Données d\'historique d\'activité:', data);

      // Définir les données d'activité dans l'état
      setActivityHistory(data);
    } catch (err) {
      console.error('Erreur lors de la récupération de l\'historique des activités:', err);
      setActivityHistory([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction de récupération des stocks mise à jour 
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
        console.error('Réponse d\'erreur API:', errorText);
        throw new Error(`Échec de récupération des données d'équipement: ${response.status} ${response.statusText}`);
      }

      const equipment = await response.json();

      // Filtrer en fonction des catégories de la base de données
      const stockable = equipment.filter(item => item.categorie === 'stockable');
      const solo = equipment.filter(item => item.categorie === 'solo');

      setStockableEquipment(stockable);
      setSoloEquipment(solo);

    } catch (err) {
      setError("Erreur lors de la récupération des équipements: " + err.message);
      console.error('Erreur de récupération des équipements:', err);
      setStockableEquipment([]);
      setSoloEquipment([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction fetchNotifications améliorée
  const fetchNotifications = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/notifications/admin');

      if (!response.ok) {
        throw new Error('Échec de récupération des notifications');
      }

      const data = await response.json();
      console.log('Notifications récupérées:', data);

      // Transformer les données pour correspondre au format attendu dans l'interface utilisateur
      const formattedNotifications = data.map(notification => ({
        id: notification.id,
        title: 'Notification Système', // Ajouter un titre par défaut car la base de données n'en a pas
        message: notification.message,
        date: notification.date_envoi,
        read: notification.statut === 'lu' // Convertir 'envoye'/'lu' en booléen
      }));

      setNotifications(formattedNotifications);

      // Compter les notifications non lues
      const unreadCount = data.filter(n => n.statut === 'envoye').length;
      setUnreadCount(unreadCount);
    } catch (err) {
      console.error('Erreur de récupération des notifications:', err);
      // Vous pouvez conserver les données de secours si nécessaire
    }
  };

  // Formater la date pour les notifications
  const formatNotificationDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return `Aujourd'hui à ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffInDays === 1) {
      return `Hier à ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffInDays < 7) {
      return `Il y a ${diffInDays} jours`;
    } else {
      return date.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
    }
  };

  // Mettre à jour la fonction markAsRead pour envoyer une requête au serveur
  const markAsRead = async (id) => {
    try {
      const response = await fetch(`http://localhost:8080/api/notifications/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Échec de marquage de la notification comme lue');
      }

      // Mettre à jour l'état local
      setNotifications(prevNotifications =>
        prevNotifications.map(notification =>
          notification.id === id ? { ...notification, read: true } : notification
        )
      );

      // Mettre à jour le nombre de non lus
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Erreur lors du marquage de la notification comme lue:', err);
    }
  };

  // Définir l'onglet actif et gérer le défilement
  const handleTabChange = (tab) => {
    setActiveTab(tab);

    // Récupérer l'historique des activités lors du passage à l'onglet historique
    if (tab === 'history') {
      fetchRecentActivity();
    }
  };

  // Basculer entre les types d'équipement
  const handleEquipmentTabChange = (tabType) => {
    setActiveEquipmentTab(tabType);
  };

  // Gérer l'approbation de réservation
  const handleApproveReservation = async (reservationId) => {
    await handleReservationStatusUpdate(reservationId, 'validee');
  };

  // Gérer le rejet de réservation
  const handleRejectReservation = async (reservationId) => {
    await handleReservationStatusUpdate(reservationId, 'refusee');
  };

  // Fonction générique pour mettre à jour le statut de réservation
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
        body: JSON.stringify({
          statut: newStatus,
          responsable_id: currentUser.id || currentUser._id // Inclure l'ID du responsable pour les notifications
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Échec de mise à jour du statut de réservation à ${newStatus}`);
      }

      setSuccess(`La réservation ${reservationId} a été ${newStatus === 'validee' ? 'approuvée' : 'rejetée'} avec succès`);

      // Rafraîchir la liste des réservations
      setTimeout(() => {
        fetchReservations();
        fetchStocks(); // Rafraîchir le stock car il pourrait avoir changé
        fetchNotifications(); // Vérifier les nouvelles notifications système
        if (activeTab === 'history') {
          fetchRecentActivity(); // Rafraîchir l'historique des activités si nous sommes sur cet onglet
        }
      }, 1000);

    } catch (err) {
      setError(`Erreur lors de la mise à jour de la réservation: ${err.message}`);
      console.error('Erreur de mise à jour de réservation:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Ajouter ces fonctions d'aide avant l'instruction return
  const getActivityStatus = (activity) => {
    // Pour les activités d'équipement, vérifier si l'équipement est en réparation
    if (activity.etat === 'en_reparation') {
      return 'En Réparation';
    }

    const now = new Date();
    const startDate = new Date(activity.date_debut);
    const endDate = new Date(activity.date_fin);

    if (now < startDate) {
      return 'Planifié';
    } else if (now > endDate) {
      return 'Retourné';
    } else {
      return 'En Utilisation';
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

  // Si non encore authentifié, afficher le chargement
  if (!currentUser) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Vérification de l'authentification...</p>
      </div>
    );
  }

  return (
    <div className={darkMode ? "dark-mode" : ""}>
      <div className="dashboard-layout">
        {/* Barre latérale */}
        <aside className="dashboard-sidebar">
          <div className="sidebar-header">
            <div className="logo-icon">GP<span className="accent-dot">.</span></div>
          </div>

          <nav className="sidebar-nav">
            <button
              className={`sidebar-nav-item ${activeView === 'reservations' ? 'active' : ''}`}
              onClick={() => setActiveView('reservations')}
              title="Réservations"
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
            <button className="theme-toggle" onClick={toggleDarkMode} title={darkMode ? "Mode Clair" : "Mode Sombre"}>
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
            <Link to="/login" className="sidebar-logout" title="Déconnexion" onClick={() => {
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

        {/* Contenu Principal */}
        <main className="dashboard-main">
          <header className="dashboard-header">
            <div className="dashboard-title">
              <h1>Tableau de Bord du Responsable</h1>
              <p className="dashboard-subtitle">
                {activeView === 'reservations'
                  ? 'Gérer les réservations d\'équipement et surveiller les niveaux de stock'
                  : 'Consulter les notifications et les messages système'}
              </p>
            </div>
            <div className="dashboard-actions">
              <div className="user-profile">
                <span className="user-greeting">Bienvenue, {currentUser.prenom || 'Responsable'}</span>
                <div className="user-avatar">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
              </div>
            </div>
          </header>

          {/* Messages de succès et d'erreur */}
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          {/* Vue des Réservations */}
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
                  Demandes en Attente
                </button>
                <button
                  className={`dashboard-tab ${activeTab === 'stock' ? 'active' : ''}`}
                  onClick={() => handleTabChange('stock')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 11 12 14 22 4"></polyline>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                  </svg>
                  Surveillance des Stocks
                </button>
                <button
                  className={`dashboard-tab ${activeTab === 'history' ? 'active' : ''}`}
                  onClick={() => handleTabChange('history')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                  </svg>
                  Historique d'Utilisation
                </button>
              </div>

              <div className="dashboard-sections">
                {/* Section des Réservations en Attente */}
                {activeTab === 'pending' && (
                  <section id="pending" className="dashboard-section active-section">
                    <div className="section-header">
                      <h2 className="section-title">Réservations en Attente</h2>
                      <div className="section-divider"></div>
                      <p className="section-description">
                        Examiner et approuver ou refuser les demandes de réservation d'équipement
                      </p>
                    </div>

                    <div className="filter-section">
                      <h3>Filtrer les Réservations</h3>
                      <div className="filter-controls">
                        <div className="form-group">
                          <label htmlFor="filter_status">Statut:</label>
                          <select
                            id="filter_status"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="form-control"
                          >
                            <option value="attente">En Attente</option>
                            <option value="validee">Approuvée</option>
                            <option value="refusee">Refusée</option>
                            <option value="all">Toutes les Réservations</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="table-container glass-effect">
                      <h3>Demandes de Réservation</h3>
                      <div className="responsive-table">
                        <table>
                          <thead>
                            <tr>
                              <th>ID</th>
                              <th>Étudiant</th>
                              <th>Équipement</th>
                              <th>Date de début</th>
                              <th>Date de fin</th>
                              <th>Statut</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {isLoading ? (
                              <tr>
                                <td colSpan="7" className="centered-cell">Chargement des réservations...</td>
                              </tr>
                            ) : reservations.length === 0 ? (
                              <tr>
                                <td colSpan="7" className="centered-cell">Aucune réservation trouvée</td>
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
                                              {item.name || `Équipement #${item.id}`}
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
                                        {reservation.statut === 'validee' ? 'Approuvée' :
                                          reservation.statut === 'attente' ? 'En Attente' : 'Refusée'}
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
                                            {isSubmitting ? 'Traitement...' : 'Approuver'}
                                          </button>
                                          <button
                                            className="reject-btn"
                                            onClick={() => handleRejectReservation(reservation.id_reservation)}
                                            disabled={isSubmitting}
                                          >
                                            {isSubmitting ? 'Traitement...' : 'Refuser'}
                                          </button>
                                        </div>
                                      )}
                                      {reservation.statut !== 'attente' && (
                                        <span className="status-text">
                                          {reservation.statut === 'validee' ? 'Approuvée' : 'Refusée'}
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

                {/* Section de Surveillance des Stocks */}
                {activeTab === 'stock' && (
                  <section id="stock" className="dashboard-section active-section">
                    <div className="section-header">
                      <h2 className="section-title">Surveillance des Stocks</h2>
                      <div className="section-divider"></div>
                      <p className="section-description">
                        Surveiller les niveaux de stock d'équipement et identifier les articles approchant des seuils critiques
                      </p>
                    </div>

                    <div className="equipment-tabs">
                      <button
                        className={`equipment-tab ${activeEquipmentTab === 'stockable' ? 'active' : ''}`}
                        onClick={() => handleEquipmentTabChange('stockable')}
                      >
                        Équipement Stockable
                      </button>
                      <button
                        className={`equipment-tab ${activeEquipmentTab === 'solo' ? 'active' : ''}`}
                        onClick={() => handleEquipmentTabChange('solo')}
                      >
                        Équipement Individuel
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
                            Afficher uniquement les articles à stock faible
                          </label>
                        </div>
                      </div>
                    </div>

                    {activeEquipmentTab === 'stockable' && (
                      <div className="table-container glass-effect">
                        <h3>Inventaire des Équipements Stockables</h3>
                        <div className="responsive-table">
                          <table>
                            <thead>
                              <tr>
                                <th>ID</th>
                                <th>Nom</th>
                                <th>Description</th>
                                <th>Quantité</th>
                                <th>Statut</th>
                              </tr>
                            </thead>
                            <tbody>
                              {isLoading ? (
                                <tr>
                                  <td colSpan="5" className="centered-cell">Chargement des équipements...</td>
                                </tr>
                              ) : stockableEquipment.length === 0 ? (
                                <tr>
                                  <td colSpan="5" className="centered-cell">Aucun équipement stockable trouvé</td>
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
                                          {item.quantite < 5 ? 'Stock Faible' : 'Normal'}
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
                        <h3>Inventaire des Équipements Individuels</h3>
                        <div className="responsive-table">
                          <table>
                            <thead>
                              <tr>
                                <th>ID</th>
                                <th>Nom</th>
                                <th>Description</th>
                                <th>Statut</th>
                              </tr>
                            </thead>
                            <tbody>
                              {isLoading ? (
                                <tr>
                                  <td colSpan="4" className="centered-cell">Chargement des équipements...</td>
                                </tr>
                              ) : soloEquipment.length === 0 ? (
                                <tr>
                                  <td colSpan="4" className="centered-cell">Aucun équipement individuel trouvé</td>
                                </tr>
                              ) : (
                                soloEquipment.map(item => (
                                  <tr key={item.id}>
                                    <td>#{item.id}</td>
                                    <td>{item.nom}</td>
                                    <td>{item.description}</td>
                                    <td>
                                      <span className={`status-badge status-${item.etat}`}>
                                        {item.etat === 'disponible' ? 'Disponible' :
                                          item.etat === 'en_cours' ? 'En Utilisation' :
                                            item.etat === 'en_reparation' ? 'En Réparation' :
                                              'Indisponible'}
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

                {/* Section Historique - MISE À JOUR pour afficher des données réelles */}
                {activeTab === 'history' && (
                  <section id="history" className="dashboard-section active-section">
                    <div className="section-header">
                      <h2 className="section-title">Historique d'Utilisation des Équipements</h2>
                      <div className="section-divider"></div>
                      <p className="section-description">
                        Consulter les données historiques sur les réservations d'équipement et les modèles d'utilisation
                      </p>
                    </div>

                    <div className="chart-container glass-effect">
                      <h3>Statistiques d'Utilisation Mensuelle</h3>
                      <div className="chart-placeholder">
                        <p>Le graphique sera affiché ici</p>
                      </div>
                    </div>

                    <div className="table-container glass-effect">
                      <h3>Activité Récente des Équipements</h3>
                      <div className="responsive-table">
                        <table>
                          <thead>
                            <tr>
                              <th>Équipement</th>
                              <th>Étudiant</th>
                              <th>Date de Retrait</th>
                              <th>Date de Retour</th>
                              <th>Statut</th>
                            </tr>
                          </thead>
                          <tbody>
                            {isLoading ? (
                              <tr>
                                <td colSpan="5" className="centered-cell">Chargement de l'historique d'activité...</td>
                              </tr>
                            ) : activityHistory.length === 0 ? (
                              <tr>
                                <td colSpan="5" className="centered-cell">Aucune activité d'équipement trouvée</td>
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
                                      {getActivityStatus(activity) === 'En Réparation' ? 'En Réparation' :
                                        getActivityStatus(activity) === 'Planifié' ? 'Planifié' :
                                          getActivityStatus(activity) === 'Retourné' ? 'Retourné' : 'En Utilisation'}
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

          {/* Vue des Notifications */}
          {activeView === 'notifications' && (
            <div className="dashboard-content notifications-view">
              <div className="section-header">
                <h2 className="section-title">Notifications Système</h2>
                <p className="section-description">
                  Consulter les alertes importantes et les messages relatifs aux équipements et réservations
                </p>
              </div>

              <div className="notifications-container">
                {notifications.length === 0 ? (
                  <div className="no-data">Aucune notification disponible</div>
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
                          <button className="mark-read-btn" title={notification.read ? "Marquer comme non lu" : "Marquer comme lu"}>
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

      {/* Bouton retour en haut */}
      <button
        id="back-to-top"
        title="Retour en Haut"
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