import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../css/etudiant.css';

const Etudiant = () => {
  const navigate = useNavigate();
  // État d'authentification de l'utilisateur
  const [currentUser, setCurrentUser] = useState(null);

  // Variables d'état
  const [equipements, setEquipements] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [formData, setFormData] = useState({
    id_utilisateur: null, // Sera défini à partir de l'utilisateur authentifié
    date_debut: '',
    date_fin: ''
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Variables d'état du tableau de bord
  const [activeView, setActiveView] = useState('browse');
  const [activeTab, setActiveTab] = useState('upcoming');

  // Fonctionnalité du panier
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Notifications
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [filterStatus, setFilterStatus] = useState('all');

  // Vérifier l'authentification au montage du composant
  useEffect(() => {
    // Vérifier la présence de l'utilisateur dans localStorage ou sessionStorage
    const userFromStorage = JSON.parse(localStorage.getItem('userInfo')) ||
      JSON.parse(sessionStorage.getItem('userInfo'));

    if (!userFromStorage) {
      // Aucun utilisateur trouvé, rediriger vers la connexion
      navigate('/login');
      return;
    }

    // Vérifier si le rôle de l'utilisateur est 'etudiant'
    if (userFromStorage.role !== 'etudiant') {
      // Mauvais rôle, rediriger vers la connexion
      navigate('/login');
      return;
    }

    // L'utilisateur est authentifié et a le rôle correct
    setCurrentUser(userFromStorage);

    // Définir l'ID utilisateur dans les données du formulaire - gère les champs id et _id
    setFormData(prev => ({
      ...prev,
      id_utilisateur: userFromStorage.id || userFromStorage._id
    }));

  }, [navigate]);

  // Récupérer les données d'équipement indépendamment (non dépendant de l'authentification)
  useEffect(() => {
    // Toujours récupérer les données d'équipement indépendamment du statut d'authentification
    fetchEquipments();
  }, []); // Un tableau de dépendances vide signifie que cela s'exécute une seule fois au montage du composant

  // Récupérer les données spécifiques à l'utilisateur lorsque celui-ci est authentifié
  useEffect(() => {
    if (currentUser && formData.id_utilisateur) {
      fetchReservations();
      fetchNotifications();
    }
  }, [currentUser, formData.id_utilisateur]);

  // Localisateur de calendrier et événements
  const localizer = momentLocalizer(moment);
  const calendarEvents = reservations.map(reservation => ({
    title: `Équipement: ${reservation.nom_equipement || reservation.id_equipement}`,
    start: new Date(reservation.date_debut),
    end: new Date(reservation.date_fin),
    resource: reservation,
    status: reservation.statut
  }));

  // Basculer le mode sombre
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    document.body.classList.toggle('dark-mode', newDarkMode);
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

  // Défiler vers le haut
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Gérer les changements d'onglet
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Récupérer les données d'équipement depuis le backend
  const fetchEquipments = async () => {
    setIsLoading(true);
    try {
      console.log('Récupération des données d\'équipement depuis le serveur...');
      const response = await fetch('http://localhost:8080/api/equipments', {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erreur de réponse API:', errorText);
        throw new Error(`Échec de récupération des données d'équipement: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Données d\'équipement analysées avec succès:', data.length, 'éléments');
      setEquipements(data);
    } catch (err) {
      setError('Erreur lors du chargement des données d\'équipement : ' + err.message);
      console.error('Erreur de récupération d\'équipement:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Vérifier si l'équipement est disponible
  const isEquipmentAvailable = (equipment) => {
    if (equipment.categorie === 'stockable') {
      return equipment.quantite > 0;
    } else {
      return equipment.etat === 'disponible';
    }
  };

  // Obtenir le texte de statut de disponibilité
  const getAvailabilityStatus = (equipment) => {
    if (equipment.categorie === 'stockable') {
      return equipment.quantite > 0 ? 'Disponible' : 'Rupture de stock';
    } else {
      return equipment.etat === 'disponible' ? 'Disponible' :
        equipment.etat === 'en_cours' ? "En cours d'utilisation" :
          equipment.etat === 'en_reparation' ? 'En réparation' :
            'Indisponible';
    }
  };

  // Obtenir la classe de statut pour l'équipement
  const getStatusClass = (equipment) => {
    if (equipment.categorie === 'stockable') {
      return equipment.quantite > 0 ? 'status-disponible' : 'status-indisponible';
    } else {
      return `status-${equipment.etat || 'indisponible'}`;
    }
  };

  // Fonctions du panier
  const addToCart = (equipment) => {
    // Vérifier si l'élément est déjà dans le panier
    if (!cart.some(item => item.id === equipment.id)) {
      setCart([...cart, { ...equipment, quantity: 1 }]);
      setSuccess(`${equipment.nom} ajouté au panier`);

      // Effacer le message de succès après 3 secondes
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } else {
      setError("Cet article est déjà dans votre panier");

      // Effacer le message d'erreur après 3 secondes
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

    // Trouver l'élément actuel pour obtenir sa quantité maximale
    const item = cart.find(item => item.id === id);
    if (!item) return;

    // Pour les articles stockables, limiter par la quantité disponible
    const maxQuantity = item.categorie === 'stockable' ? item.quantite : 1;

    // S'assurer de ne pas dépasser la quantité maximale disponible
    const newQuantity = Math.min(quantity, maxQuantity);

    setCart(cart.map(item =>
      item.id === id ? { ...item, quantity: newQuantity } : item
    ));
  };

  // Fonctions de filtrage
  const handleFilterChange = (e) => {
    setFilterCategory(e.target.value);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Filtrer les équipements selon la catégorie et le terme de recherche
  const filteredEquipment = equipements.filter(equipment => {
    const matchesCategory = filterCategory === '' || equipment.categorie === filterCategory;
    const matchesSearch = searchTerm === '' ||
      equipment.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      equipment.description.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  // Récupérer les données de réservation depuis le backend
  const fetchReservations = async () => {
    try {
      // Obtenir l'ID utilisateur avec plusieurs solutions de secours - similaire à handleReservationSubmit
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
        console.error("Erreur lors de l'analyse des données de stockage:", parseErr);
      }

      // Utiliser le même modèle de secours que dans la soumission de réservation
      const userId = userFromStorage?.id ||
        userFromStorage?.userId ||
        userFromStorage?._id ||
        (currentUser ? currentUser.id : null);

      if (!userId) {
        console.error("Aucun ID utilisateur disponible pour récupérer les réservations");
        return;
      }

      console.log("Récupération des réservations pour l'ID utilisateur:", userId);

      // Continuer avec votre logique de récupération existante
      const response = await fetch(`http://localhost:8080/api/reservations?userId=${userId}`, {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erreur de réponse API:', errorText);
        throw new Error(`Échec de récupération des données de réservation: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Données brutes de réservation de l\'API:', data);

      if (data.length === 0) {
        console.log("Aucune réservation trouvée pour cet utilisateur");
        setReservations([]);
        return;
      }

      // Regrouper par ID de réservation - pas besoin de filtrer par utilisateur car l'API l'a déjà fait
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
      console.log('Réservations finales traitées:', finalReservations);

      // Mettre à jour l'état
      setReservations(finalReservations);
    } catch (err) {
      console.error('Erreur de récupération des réservations:', err);
      setReservations([]);
    }
  };

  // Récupérer les notifications
  const fetchNotifications = async () => {
    try {
      // Obtenir l'ID utilisateur avec plusieurs solutions de secours - similaire à fetchReservations
      let userId = formData.id_utilisateur;

      // Si non trouvé dans formData, essayer currentUser ou storage
      if (!userId) {
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
          console.error("Erreur lors de l'analyse des données de stockage:", parseErr);
        }

        // Utiliser le même modèle de secours que dans la soumission de réservation - IMPORTANT: Inclure _id
        userId = userFromStorage?._id ||
          userFromStorage?.id ||
          userFromStorage?.userId ||
          (currentUser ? currentUser._id || currentUser.id : null);
      }

      if (!userId) {
        console.error("Aucun ID utilisateur disponible pour récupérer les notifications");
        return;
      }

      console.log(`Récupération des notifications pour l'ID utilisateur: ${userId}`);
      const response = await fetch(`http://localhost:8080/api/notifications?userId=${userId}`);

      if (!response.ok) {
        throw new Error('Échec de récupération des notifications');
      }

      const data = await response.json();
      console.log('Notifications reçues:', data);
      setNotifications(data);

      // Compter les notifications non lues
      const unread = data.filter(notification => notification.statut === 'envoye').length;
      setUnreadCount(unread);
    } catch (err) {
      console.error('Erreur lors de la récupération des notifications:', err);
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  // Marquer une notification comme lue
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
        throw new Error('Échec de marquage de la notification comme lue');
      }

      setNotifications(prevNotifications =>
        prevNotifications.map(notification =>
          notification.id === id ? { ...notification, statut: 'lu' } : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Erreur lors du marquage de la notification comme lue:', err);
    }
  };

  // Formater la date de notification
  const formatNotificationDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.round(diffMs / 60000);
    const diffHrs = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);

    if (diffMins < 60) {
      return `il y a ${diffMins} minute${diffMins !== 1 ? 's' : ''}`;
    } else if (diffHrs < 24) {
      return `il y a ${diffHrs} heure${diffHrs !== 1 ? 's' : ''}`;
    } else if (diffDays < 7) {
      return `il y a ${diffDays} jour${diffDays !== 1 ? 's' : ''}`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Gérer les changements d'entrée de formulaire
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  // Gérer la soumission du formulaire de réservation
  const handleReservationSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Vérification de stockage plus robuste avec gestion des erreurs
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
        console.error("Erreur lors de l'analyse des données de stockage:", parseErr);
      }

      // Vérifier l'ID utilisateur avec des solutions de secours pour différents noms de champs
      const userId = userFromStorage?.id ||
        userFromStorage?.userId ||
        userFromStorage?._id;

      if (!userId) {
        // Utiliser l'état currentUser comme solution de secours s'il existe
        if (currentUser && currentUser.id) {
          console.log("Utilisation de currentUser comme solution de secours");
          userFromStorage = currentUser;
        } else {
          throw new Error("Impossible d'identifier l'utilisateur. Veuillez vous reconnecter.");
        }
      }

      // Reste de votre code existant...
      if (cart.length === 0) {
        throw new Error('Votre panier est vide. Veuillez ajouter du matériel avant de réserver.');
      }

      if (!formData.date_debut || !formData.date_fin) {
        throw new Error('Veuillez sélectionner une date de début et une date de fin pour votre réservation');
      }

      const startDate = new Date(formData.date_debut);
      const endDate = new Date(formData.date_fin);
      if (startDate >= endDate) {
        throw new Error('La date de fin doit être postérieure à la date de début');
      }

      // Créer une seule réservation avec plusieurs équipements
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
        throw new Error(errorData.message || 'Échec de création de la réservation');
      }

      setSuccess("Réservation soumise avec succès! Votre demande est en attente d'approbation.");

      // Donner au serveur un moment pour compléter la transaction
      setTimeout(() => {
        fetchReservations(); // Recharger les réservations pour montrer les nouvelles
        fetchNotifications(); // Vérifier les nouvelles notifications
      }, 1000);

      clearCart();
      setFormData(prevState => ({
        ...prevState,
        date_debut: '',
        date_fin: ''
      }));

      // Passer à la vue historique pour permettre à l'utilisateur de voir ses réservations
      setTimeout(() => {
        setActiveView('history');
      }, 2000);
    } catch (err) {
      setError(err.message);
      console.error('Erreur de soumission de réservation:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Style d'événement personnalisé pour le calendrier
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

  // Si pas encore authentifié, afficher le chargement
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
        {/* Sidebar */}
        <aside className="dashboard-sidebar">
          <div className="sidebar-header">
            <div className="logo-icon">GIMS<span className="accent-dot">.</span></div>
          </div>

          <nav className="sidebar-nav">
            <button
              className={`sidebar-nav-item ${activeView === 'browse' ? 'active' : ''}`}
              onClick={() => setActiveView('browse')}
              title="Parcourir l'équipement"
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
              title="Calendrier"
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
              title="Finaliser la réservation"
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
                fetchReservations(); // Forcer un rafraîchissement lors de l'affichage de l'historique
              }}
              title="Historique des réservations"
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
              title="Aide & FAQ"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </button>
          </nav>

          <div className="sidebar-footer">
            <button className="theme-toggle" onClick={toggleDarkMode} title={darkMode ? "Mode clair" : "Mode sombre"}>
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
              // Effacer la session utilisateur lors de la déconnexion
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

        {/* traduction ici : */}
        {/* Main Content  */}
        <main className="dashboard-main">
          <header className="dashboard-header">
            <div className="dashboard-title">
              <h1>Tableau de Bord de l'Étudiant</h1>
              <p className="dashboard-subtitle">
                {activeView === 'browse' ? 'Parcourir et sélectionner les équipements disponibles' :
                  activeView === 'calendar' ? "Consulter et planifier vos réservations d'équipement" :
                    activeView === 'reserve' ? 'Examiner le panier et finaliser votre réservation' :
                      activeView === 'history' ? "Suivre l'historique et le statut de vos réservations" :
                        activeView === 'notifications' ? 'Consulter les notifications et alertes du système' :
                          "Obtenir de l'aide pour les réservations d'équipement"}
              </p>
            </div>
            <div className="dashboard-actions">
              {activeView !== 'reserve' && (
                <div className="cart-button-container">
                  <button
                    className="cart-button"
                    onClick={() => setShowCart(!showCart)}
                    title="Voir le Panier"
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
                <span className="user-greeting">Bienvenue, {currentUser.prenom || 'Étudiant'}</span>
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
                  <h2>Votre Panier de Réservation</h2>
                  <button className="close-button" onClick={() => setShowCart(false)}>×</button>
                </div>

                <div className="cart-content">
                  {cart.length === 0 ? (
                    <p className="empty-cart">Votre panier est vide. Parcourez les équipements pour ajouter des articles à votre réservation.</p>
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
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                          Vider le Panier
                        </button>
                        <button
                          className="checkout-btn"
                          onClick={() => {
                            setActiveView('reserve');
                            setShowCart(false);
                          }}
                        >
                          Finaliser
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                          </svg>
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
                <h2 className="section-title">Équipements Disponibles</h2>
                <div className="section-divider"></div>
                <p className="section-description">
                  Parcourez les équipements disponibles et ajoutez des articles à votre panier de réservation
                </p>
              </div>

              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}

              <div className="filter-section glass-effect">
                <h3>Filtrer les Équipements</h3>
                <div className="filter-controls">
                  <div className="form-group">
                    <div className="search-container">
                      <input
                        type="text"
                        placeholder="Rechercher un équipement..."
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
                      <option value="">Toutes les Catégories</option>
                      <option value="stockable">Équipement Stockable</option>
                      <option value="solo">Équipement Solo</option>
                    </select>
                  </div>
                </div>
              </div>

              {isLoading ? (
                <div className="loading-spinner"></div>
              ) : (
                <div className="equipment-grid">
                  {filteredEquipment.length === 0 ? (
                    <div className="no-data">Aucun équipement disponible correspondant à vos critères</div>
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
                              {equipment.quantite} Disponible
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
                          {cart.some(item => item.id === equipment.id) ? 'Dans le Panier' : 'Ajouter au Panier'}
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
                  Réservations à Venir
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
                  Vue Mensuelle
                </button>
              </div>

              <div className="section-header">
                <h2 className="section-title">Calendrier des Réservations</h2>
                <div className="section-divider"></div>
                <p className="section-description">
                  Consultez toutes vos réservations d'équipement actuelles et à venir
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
                <h2 className="section-title">Finaliser Votre Réservation</h2>
                <div className="section-divider"></div>
                <p className="section-description">
                  Vérifiez les articles de votre panier et sélectionnez les dates pour votre réservation
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
                    <h3>Vérifier les Équipements Sélectionnés</h3>
                    {cart.length === 0 ? (
                      <div className="empty-cart-message">
                        <p>Votre panier est vide. Veuillez parcourir et sélectionner des équipements avant de continuer.</p>
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => setActiveView('browse')}
                        >
                          Parcourir les Équipements
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
                                  <span className="quantity-badge">Qté: {item.quantity}</span>
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
                      </div>
                    )}
                  </div>

                  <div className="date-section">
                    <h3>Sélectionner les Dates de Réservation</h3>
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="date_debut">Date de début:</label>
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
                        <label htmlFor="date_fin">Date de fin:</label>
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
                    <h3>Aperçu des Dates</h3>
                    <div className="mini-calendar glass-effect">
                      <Calendar
                        localizer={localizer}
                        events={[
                          ...calendarEvents,
                          formData.date_debut && formData.date_fin ? {
                            title: 'Nouvelle Réservation',
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
                    {isLoading ? 'Traitement en cours...' : 'Finaliser la Réservation'}
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
                <h2 className="section-title">Historique des Réservations</h2>
                <div className="section-divider"></div>
                <p className="section-description">
                  Consultez le statut de toutes vos réservations d'équipement passées et actuelles
                </p>
              </div>

              <div className="filter-section">
                <h3>Filtrer les Réservations</h3>
                <div className="filter-controls">
                  <div className="form-group">
                    <label htmlFor="filter_status">Statut:</label>
                    <select
                      id="filter_status"
                      className="form-control"
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <option value="all">Toutes les Réservations</option>
                      <option value="attente">En Attente</option>
                      <option value="validee">Approuvée</option>
                      <option value="refusee">Refusée</option>
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
                      <div className="no-data">Aucune réservation trouvée. Créez une nouvelle réservation pour la voir ici.</div>
                    ) : (
                      <table>
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Équipement</th>
                            <th>Date de début</th>
                            <th>Date de fin</th>
                            <th>Statut</th>
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
                                            {item.name || `Article #${item.id}`}
                                            {item.quantity > 1 && <span className="quantity-badge"> x{item.quantity}</span>}
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      reservation.nom_equipement || reservation.id_equipement
                                    )}
                                  </td>
                                  <td>{moment(reservation.date_debut).format('DD MMM, YYYY')}</td>
                                  <td>{moment(reservation.date_fin).format('DD MMM, YYYY')}</td>
                                  <td>
                                    <span className={`status-badge ${statusClass}`}>
                                      {reservation.statut === 'validee' ? 'Confirmée' :
                                        reservation.statut === 'attente' ? 'En Attente' : 'Refusée'}
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
                  Consultez les alertes importantes et les messages concernant vos réservations d'équipement
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
                          <h3>{notification.titre || 'Notification Système'}</h3>
                          <p>{notification.message}</p>
                          <div className="notification-meta">
                            <span className="notification-time">{formatNotificationDate(notification.date_envoi)}</span>
                          </div>
                        </div>
                        <div className="notification-actions">
                          <button className="mark-read-btn" title={notification.statut === 'lu' ? "Marquer comme non lu" : "Marquer comme lu"}>
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
                <h2 className="section-title">Foire Aux Questions</h2>
                <div className="section-divider"></div>
                <p className="section-description">
                  Trouvez des réponses aux questions fréquentes concernant les réservations d'équipement
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
                    <h4>Comment Réserver un Équipement?</h4>
                    <p>Parcourez les équipements disponibles, ajoutez des articles à votre panier, spécifiez les dates de réservation et soumettez votre demande. Vous recevrez une confirmation une fois approuvée.</p>
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
                    <h4>Où Récupérer l'Équipement?</h4>
                    <p>Les équipements réservés peuvent être récupérés au bureau du technicien pendant les heures d'ouverture. Apportez votre carte d'étudiant et la confirmation de réservation.</p>
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
                    <h4>Comment Annuler une Réservation?</h4>
                    <p>Pour annuler une réservation, veuillez contacter le technicien au moins 24 heures avant votre heure de retrait prévue. Les annulations tardives peuvent entraîner des pénalités.</p>
                  </div>
                </div>

                <div className="contact-info glass-effect">
                  <h3>Besoin d'Aide Supplémentaire?</h3>
                  <p>Contactez l'équipe de gestion des équipements:</p>
                  <ul>
                    <li>Email: support@GIMSequipment.com</li>
                    <li>Téléphone: +1 (555) 123-4567</li>
                    <li>Horaires: Lun-Ven 8h-17h</li>
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
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="18 15 12 9 6 15"></polyline>
        </svg>
      </button>
    </div>
  );
};

export default Etudiant;