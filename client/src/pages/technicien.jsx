import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import Logo from '../components/logo';
import '../css/technicien.css';

const Technicien = () => {
  // Ajouter la navigation pour les redirections
  const navigate = useNavigate();

  // État de l'utilisateur actuel pour l'authentification
  const [currentUser, setCurrentUser] = useState(null);

  // État pour la liste d'équipements et le formulaire
  const [stockableEquipment, setStockableEquipment] = useState([]);
  const [soloEquipment, setSoloEquipment] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [formData, setFormData] = useState({
    id: '',
    nom: '',
    description: '',
    categorie: 'stockable', // Catégorie par défaut
    etat: 'disponible',
    quantite: '1'
  });

  // État pour les modales
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  // Ajouter l'état pour la modale de code QR
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrData, setQrData] = useState(null);

  // État pour les filtres
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // État pour le chargement et la gestion des erreurs
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Variables d'état pour l'interface utilisateur
  const [darkMode, setDarkMode] = useState(false);
  const [, setShowBackToTop] = useState(false);
  const [activeView, setActiveView] = useState('equipment');
  const [activeTab, setActiveTab] = useState('inventory');
  const [activeEquipmentTab, setActiveEquipmentTab] = useState('stockable');
  const [showLowStock, setShowLowStock] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Add to the state variables
  const [users, setUsers] = useState([]);
  const [userFormData, setUserFormData] = useState({
    id: '',
    nom: '',
    prenom: '',
    email: '',
    role: 'etudiant',
    mot_de_passe: ''
  });
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  // Références pour les sections et modales
  const modalRef = useRef(null);

  // Vérification d'authentification au montage du composant
  useEffect(() => {
    // Vérifier si l'utilisateur est connecté et a le rôle 'technicien'
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
      navigate('/login');
      return;
    }

    // Si aucune donnée utilisateur ou mauvais rôle, rediriger vers la connexion
    if (!userFromStorage) {
      navigate('/login');
      return;
    }

    // Vérifier si le rôle de l'utilisateur est 'technicien'
    if (userFromStorage.role !== 'technicien') {
      // Mauvais rôle, rediriger vers la connexion
      navigate('/login');
      return;
    }

    // L'utilisateur est authentifié et a le bon rôle
    setCurrentUser(userFromStorage);
  }, [navigate]);

  // Basculer le mode sombre
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    document.body.classList.toggle('dark-mode', newDarkMode);
  };

  // Marquer une notification comme lue
  const markAsRead = async (id) => {
    try {
      const response = await fetch(`http://localhost:8080/api/notifications/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Échec du marquage de la notification comme lue');
      }

      // Mettre à jour l'état local
      setNotifications(prevNotifications =>
        prevNotifications.map(notification =>
          notification.id === id ? { ...notification, read: true } : notification
        )
      );

      // Mettre à jour le compteur de non lus
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Erreur lors du marquage de la notification comme lue:', err);
    }
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
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Charger les données d'équipement lors du montage du composant ou du changement de filtres
  useEffect(() => {
    // Ne récupérer les données que si authentifié
    if (currentUser) {
      // Animer les éléments au défilement
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

      // Vérifier le mode sombre
      const isDarkMode = document.body.classList.contains('dark-mode');
      setDarkMode(isDarkMode);

      // Fetch data based on active view
      fetchEquipments();
      fetchReservations();
      fetchNotifications();
      
      if (activeView === 'users') {
        fetchUsers();
      }

      return () => {
        document.querySelectorAll('.hidden').forEach(el => {
          observer.unobserve(el);
        });
      };
    }
  }, [filterCategory, filterStatus, currentUser, activeView]);

  // Récupérer les données d'équipement avec les filtres appliqués
  const fetchEquipments = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('Récupération des données d\'équipement depuis le serveur...');
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
      console.log('Données d\'équipement analysées avec succès:', equipment.length, 'éléments');

      // Filtrer selon les catégories de la base de données
      const stockable = equipment.filter(item => item.categorie === 'stockable');
      const solo = equipment.filter(item => item.categorie === 'solo');

      console.log(`Catégorisé: ${stockable.length} stockables, ${solo.length} solos`);

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

  // Récupérer les données de réservation
  const fetchReservations = async () => {
    try {
      setIsLoading(true);

      // Obtenir toutes les réservations 
      const response = await fetch('http://localhost:8080/api/reservations');

      if (!response.ok) {
        throw new Error(`Échec de récupération des réservations: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Données des réservations:', data);

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
          // Ajouter un équipement supplémentaire à la réservation existante
          reservationMap[item.id_reservation].equipment_items.push({
            id: item.id_equipement,
            name: item.nom_equipement,
            quantity: item.quantite_reservee
          });
        }
      });

      const finalReservations = Object.values(reservationMap);
      setReservations(finalReservations);
    } catch (err) {
      console.error('Erreur lors du chargement des données de réservation:', err);
      setError("Échec de chargement des réservations. Veuillez réessayer plus tard.");
      setReservations([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Récupérer les notifications depuis l'API
  const fetchNotifications = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/notifications/tech');

      if (!response.ok) {
        throw new Error('Échec de récupération des notifications');
      }

      const data = await response.json();

      // Transformer les données pour correspondre au format attendu dans l'interface utilisateur
      const formattedNotifications = data.map(notification => ({
        id: notification.id,
        title: 'Notification Système', // Ajouter un titre par défaut puisque la base de données n'en a pas
        message: notification.message,
        date: notification.date_envoi, // S'assurer que ce champ est inclus
        read: notification.statut === 'lu' // Convertir 'envoye'/'lu' en booléen
      }));

      setNotifications(formattedNotifications);

      // Compter les notifications non lues
      const unreadCount = data.filter(n => n.statut === 'envoye').length;
      setUnreadCount(unreadCount);
    } catch (err) {
      console.error('Erreur de récupération des notifications:', err);
      // Données de secours si nécessaire
    }
  };

  // Add this function after other fetch functions
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:8080/api/users');
      
      if (!response.ok) {
        throw new Error(`Échec de récupération des utilisateurs: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      console.error('Erreur lors du chargement des utilisateurs:', err);
      setError("Échec de chargement des utilisateurs. Veuillez réessayer plus tard.");
    } finally {
      setIsLoading(false);
    }
  };

  // Gérer les changements dans les entrées du formulaire
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  // Add after other handlers
  const handleUserInputChange = (e) => {
    const { name, value } = e.target;
    setUserFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch('http://localhost:8080/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userFormData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Réponse d\'erreur API:', errorText);
        throw new Error('Échec d\'ajout d\'utilisateur');
      }

      setSuccess('Utilisateur ajouté avec succès');
      fetchUsers();

      // Close modal after success
      setTimeout(() => {
        setShowAddUserModal(false);
        setUserFormData({
          id: '',
          nom: '',
          prenom: '',
          email: '',
          role: 'etudiant',
          mot_de_passe: ''
        });
      }, 1500);
    } catch (err) {
      setError('Erreur lors de l\'ajout d\'utilisateur: ' + err.message);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!id) {
      setError('Aucun utilisateur sélectionné pour la suppression');
      return;
    }

    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur?')) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch(`http://localhost:8080/api/users/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Réponse d\'erreur API:', errorText);
        throw new Error('Échec de suppression de l\'utilisateur');
      }

      setSuccess('Utilisateur supprimé avec succès');
      fetchUsers();
    } catch (err) {
      setError('Erreur lors de la suppression de l\'utilisateur: ' + err.message);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Ouvrir la modale d'ajout avec un formulaire vide
  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  // Ouvrir la modale de mise à jour avec les données d'équipement
  const openUpdateModal = (equipment) => {
    setFormData({
      id: equipment.id,
      nom: equipment.nom,
      description: equipment.description,
      categorie: equipment.categorie,
      etat: equipment.etat || 'disponible',
      quantite: equipment.quantite || '1'
    });
    setShowUpdateModal(true);
  };

  // Fonction pour générer les données de code QR
  const generateQRData = (equipment) => {
    return JSON.stringify({
      id: equipment.id,
      name: equipment.nom,
      description: equipment.description
    });
  };

  // Fonction pour ouvrir la modale de code QR
  const openQRModal = (equipment) => {
    setQrData(generateQRData(equipment));
    setShowQRModal(true);
  };

  // Fermer les modales
  const closeModals = () => {
    setShowAddModal(false);
    setShowUpdateModal(false);
    setShowQRModal(false);
    setError(null);
    setSuccess(null);
  };

  // Gérer la soumission du formulaire pour ajouter un équipement
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
        console.error('Réponse d\'erreur API:', errorText);
        throw new Error('Échec d\'ajout d\'équipement');
      }

      setSuccess('Équipement ajouté avec succès');
      fetchEquipments();

      // Fermer la modale après un court délai pour montrer le message de succès
      setTimeout(() => {
        setShowAddModal(false);
        resetForm();
      }, 1500);
    } catch (err) {
      setError('Erreur lors de l\'ajout d\'équipement: ' + err.message);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Gérer la soumission du formulaire pour mettre à jour un équipement
  const handleUpdateEquipment = async (e) => {
    e.preventDefault();
    if (!formData.id) {
      setError('Aucun équipement sélectionné pour la mise à jour');
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
        console.error('Réponse d\'erreur API:', errorText);
        throw new Error('Échec de mise à jour de l\'équipement');
      }

      setSuccess('Équipement mis à jour avec succès');
      fetchEquipments();

      // Fermer la modale après un court délai pour montrer le message de succès
      setTimeout(() => {
        setShowUpdateModal(false);
        resetForm();
      }, 1500);
    } catch (err) {
      setError('Erreur lors de la mise à jour de l\'équipement: ' + err.message);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Gérer la suppression d'équipement
  const handleDeleteEquipment = async (id) => {
    if (!id) {
      setError('Aucun équipement sélectionné pour la suppression');
      return;
    }

    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet équipement?')) {
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
        console.error('Réponse d\'erreur API:', errorText);
        throw new Error('Échec de suppression de l\'équipement');
      }

      setSuccess('Équipement supprimé avec succès');
      fetchEquipments();
    } catch (err) {
      setError('Erreur lors de la suppression de l\'équipement: ' + err.message);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Réinitialiser le formulaire à l'état initial
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

  // Gérer les changements de filtre
  const handleFilterChange = (e) => {
    if (e.target.name === 'filter_category') {
      setFilterCategory(e.target.value);
    } else if (e.target.name === 'filter_status') {
      setFilterStatus(e.target.value);
    }
  };

  // Gérer la mise à jour du statut de réservation
  const handleUpdateReservationStatus = async (id, status) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`http://localhost:8080/api/reservations/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          statut: status,
          technicien_id: currentUser.id, // Add technician ID
          technicien_name: `${currentUser.prenom} ${currentUser.nom}` // Add technician name
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Échec de mise à jour du statut de réservation en ${status}`);
      }

      setSuccess(`Statut de réservation mis à jour en ${status}`);

      // Refresh data after a short delay
      setTimeout(() => {
        fetchReservations();
        fetchEquipments(); // Equipment status might have changed
        fetchNotifications(); // Check for new system notifications
      }, 1000);

    } catch (err) {
      setError(`Erreur lors de la mise à jour de la réservation: ${err.message}`);
      console.error('Erreur de mise à jour de réservation:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Gérer le changement d'onglet
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Basculer entre les onglets d'équipement stockable et solo
  const handleEquipmentTabChange = (tabType) => {
    setActiveEquipmentTab(tabType);
  };

  // Mettre à jour le statut de l'équipement (ex., marquer comme disponible/en réparation/indisponible)
  const handleUpdateEquipmentStatus = async (id, newStatus, previousStatus) => {
    if (!id) {
      setError('Aucun équipement sélectionné pour la mise à jour');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Obtenir les détails de l'équipement à inclure dans la notification
      const equipmentResponse = await fetch(`http://localhost:8080/api/equipments/${id}`);
      if (!equipmentResponse.ok) {
        throw new Error('Échec de récupération des détails de l\'équipement');
      }
      const equipment = await equipmentResponse.json();

      // S'assurer que le statut précédent n'est jamais indéfini - utiliser l'état actuel de l'équipement comme solution de secours
      const oldState = previousStatus || equipment.etat || 'disponible';

      // Mettre à jour le statut de l'équipement
      const response = await fetch(`http://localhost:8080/api/equipments/${id}/state`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          etat: newStatus,
          oldState: oldState || 'disponible', // S'assurer que nous n'envoyons jamais undefined
          technicianId: currentUser?.id || null, // Utiliser null au lieu de undefined
          technicianName: currentUser?.prenom && currentUser?.nom ?
            `${currentUser.prenom} ${currentUser.nom}` : 'Technicien Inconnu'
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Réponse d\'erreur API:', errorText);
        throw new Error('Échec de mise à jour du statut de l\'équipement');
      }

      setSuccess(`Statut de l'équipement mis à jour en ${newStatus === 'disponible' ? 'Disponible' :
        newStatus === 'en_cours' ? 'En Utilisation' :
          newStatus === 'en_reparation' ? 'En Réparation' :
            newStatus === 'indisponible' ? 'Hors Service' :
              'Inconnu'}`);

      // Augmenter le délai pour s'assurer que le serveur a le temps de traiter
      setTimeout(() => {
        fetchEquipments();
        fetchNotifications(); // Rafraîchir les notifications après le changement de statut
      }, 1000);
    } catch (err) {
      setError('Erreur lors de la mise à jour du statut de l\'équipement: ' + err.message);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Gestionnaire de clic en dehors de la modale
  useEffect(() => {
    function handleClickOutside(event) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setShowAddModal(false);
        setShowUpdateModal(false);
        setShowQRModal(false);
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
        {/* Barre latérale */}
        <aside className="dashboard-sidebar">
          <div className="sidebar-header">
            <Logo darkMode={darkMode} variant={'aside'}/>
          </div>

          <nav className="sidebar-nav">
            <button
              className={`sidebar-nav-item ${activeView === 'equipment' ? 'active' : ''}`}
              onClick={() => setActiveView('equipment')}
              title="Gestion d'Équipement"
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

            <button
              className={`sidebar-nav-item ${activeView === 'users' ? 'active' : ''}`}
              onClick={() => setActiveView('users')}
              title="Gestion des Utilisateurs"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
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
              <h1>Tableau de Bord Technicien</h1>
              <p className="dashboard-subtitle">
                {activeView === 'equipment'
                  ? 'Gérer l\'inventaire et l\'état technique des équipements'
                  : activeView === 'reservations'
                    ? 'Suivre et mettre à jour les statuts des réservations'
                    : 'Consulter les notifications et alertes du système'}
              </p>
            </div>
            <div className="dashboard-actions">
              <div className="user-profile">
                <span className="user-greeting">Bienvenue, {currentUser.prenom || 'Technicien'}</span>
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

          {/* Le reste du composant reste le même */}
          {/* Vue de Gestion des Équipements */}
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
                  Gestion d'Inventaire
                </button>
                <button
                  className={`dashboard-tab ${activeTab === 'maintenance' ? 'active' : ''}`}
                  onClick={() => handleTabChange('maintenance')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                  </svg>
                  Maintenance et Réparations
                </button>
              </div>

              <div className="dashboard-sections">
                {/* Section Inventaire des Équipements */}
                {activeTab === 'inventory' && (
                  <section id="inventory" className="dashboard-section active-section">
                    <div className="section-header">
                      <h2 className="section-title">Inventaire des Équipements</h2>
                      <div className="section-divider"></div>
                      <p className="section-description">
                        Ajouter, mettre à jour et gérer les équipements dans votre système d'inventaire
                      </p>
                    </div>

                    {/* Onglets de type d'équipement */}
                    <div className="equipment-tabs">
                      <button
                        className={`equipment-tab ${activeEquipmentTab === 'stockable' ? 'active' : ''}`}
                        onClick={() => handleEquipmentTabChange('stockable')}
                      >
                        Équipements Stockables
                      </button>
                      <button
                        className={`equipment-tab ${activeEquipmentTab === 'solo' ? 'active' : ''}`}
                        onClick={() => handleEquipmentTabChange('solo')}
                      >
                        Équipements Solo
                      </button>
                    </div>

                    <div className="filter-section">
                      {activeEquipmentTab === 'stockable' ? (
                        // Pour les équipements stockables - montrer uniquement la case à cocher de stock faible
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
                      ) : (
                        // Pour les équipements solo - montrer uniquement le filtre de statut
                        <>
                          <h3>Filtrer les Équipements</h3>
                          <div className="filter-controls">
                            <div className="form-group">
                              <label htmlFor="filter_status">Statut:</label>
                              <select
                                name="filter_status"
                                id="filter_status"
                                value={filterStatus}
                                onChange={handleFilterChange}
                                className="form-control"
                              >
                                <option value="">Tous les Statuts</option>
                                <option value="disponible">Disponible</option>
                                <option value="en_cours">En Utilisation</option>
                                <option value="en_reparation">En Réparation</option>
                                <option value="indisponible">Indisponible</option>
                              </select>
                            </div>
                            <button
                              className="secondary-button"
                              onClick={() => setFilterStatus('')}
                            >
                              Effacer le Filtre
                            </button>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Tableau des Équipements Stockables */}
                    {activeEquipmentTab === 'stockable' && (
                      <div className="table-container glass-effect">
                        <div className="table-header">
                          <h3>Liste des Équipements Stockables</h3>
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
                            Ajouter un Équipement Stockable
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
                                  <th>Nom</th>
                                  <th>Description</th>
                                  <th>Code QR</th>
                                  <th>Quantité</th>
                                  <th>Statut</th>
                                  <th>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {stockableEquipment.length === 0 ? (
                                  <tr>
                                    <td colSpan="7" className="centered-cell">Aucun équipement stockable trouvé</td>
                                  </tr>
                                ) : (
                                  stockableEquipment
                                    .filter(item => !showLowStock || item.quantite < 5)
                                    .map(equipment => (
                                      <tr key={equipment.id}>
                                        <td>{equipment.id}</td>
                                        <td>{equipment.nom}</td>
                                        <td>{equipment.description}</td>
                                        <td className="qr-cell">
                                          <div className="qr-inline">
                                            <QRCodeCanvas
                                              value={generateQRData(equipment)}
                                              size={50}
                                              level="M"
                                            />
                                            <button
                                              className="qr-view-btn"
                                              onClick={() => openQRModal(equipment)}
                                              title="Voir/Télécharger QR"
                                            >
                                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="11" cy="11" r="8"></circle>
                                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                                <line x1="11" y1="8" x2="11" y2="14"></line>
                                                <line x1="8" y1="11" x2="14" y2="11"></line>
                                              </svg>
                                            </button>
                                          </div>
                                        </td>
                                        <td>{equipment.quantite}</td>
                                        <td>
                                          <span className={`stock-level ${equipment.quantite < 5 ? 'low' : 'normal'}`}>
                                            {equipment.quantite < 5 ? 'Stock Faible' : 'Normal'}
                                          </span>
                                        </td>
                                        <td className="action-buttons">
                                          <button
                                            onClick={() => openUpdateModal(equipment)}
                                            className="edit-button"
                                            title="Modifier"
                                          >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                              <path d="M12 20h9"></path>
                                              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                                            </svg>
                                          </button>
                                          <button
                                            onClick={() => handleDeleteEquipment(equipment.id)}
                                            className="delete-button-small"
                                            title="Supprimer"
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

                    {/* Tableau des Équipements Solo */}
                    {activeEquipmentTab === 'solo' && (
                      <div className="table-container glass-effect">
                        <div className="table-header">
                          <h3>Liste des Équipements Solo</h3>
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
                            Ajouter un Équipement Solo
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
                                  <th>Nom</th>
                                  <th>Description</th>
                                  <th>Code QR</th>
                                  <th>Statut</th>
                                  <th>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {soloEquipment.length === 0 ? (
                                  <tr>
                                    <td colSpan="6" className="centered-cell">Aucun équipement solo trouvé</td>
                                  </tr>
                                ) : (
                                  soloEquipment
                                    // Appliquer le filtre de statut si sélectionné
                                    .filter(item => filterStatus === '' || item.etat === filterStatus)
                                    .map(equipment => (
                                      <tr key={equipment.id}>
                                        <td>{equipment.id}</td>
                                        <td>{equipment.nom}</td>
                                        <td>{equipment.description}</td>
                                        <td className="qr-cell">
                                          <div className="qr-inline">
                                            <QRCodeCanvas
                                              value={generateQRData(equipment)}
                                              size={50}
                                              level="M"
                                            />
                                            <button
                                              className="qr-view-btn"
                                              onClick={() => openQRModal(equipment)}
                                              title="Voir/Télécharger QR"
                                            >
                                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="11" cy="11" r="8"></circle>
                                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                                <line x1="11" y1="8" x2="11" y2="14"></line>
                                                <line x1="8" y1="11" x2="14" y2="11"></line>
                                              </svg>
                                            </button>
                                          </div>
                                        </td>
                                        <td>
                                          <span className={`status-badge status-${equipment.etat}`}>
                                            {equipment.etat === 'disponible' ? 'Disponible' :
                                              equipment.etat === 'en_cours' ? 'En Utilisation' :
                                                equipment.etat === 'en_reparation' ? 'En Réparation' :
                                                  'Indisponible'}
                                          </span>
                                        </td>
                                        <td className="action-buttons">
                                          <button
                                            onClick={() => openUpdateModal(equipment)}
                                            className="edit-button"
                                            title="Modifier"
                                          >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                              <path d="M12 20h9"></path>
                                              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                                            </svg>
                                          </button>
                                          <button
                                            onClick={() => handleDeleteEquipment(equipment.id)}
                                            className="delete-button-small"
                                            title="Supprimer"
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

                {/* Section Maintenance */}
                {activeTab === 'maintenance' && (
                  <section id="maintenance" className="dashboard-section active-section">
                    <div className="section-header">
                      <h2 className="section-title">Maintenance et Réparations</h2>
                      <div className="section-divider"></div>
                      <p className="section-description">
                        Suivre et gérer les équipements nécessitant une maintenance ou actuellement en réparation
                      </p>
                    </div>

                    <div className="table-container glass-effect">
                      <h3>Équipements en Maintenance</h3>
                      <div className="responsive-table">
                        {isLoading ? (
                          <div className="loading-spinner"></div>
                        ) : (
                          <table>
                            <thead>
                              <tr>
                                <th>ID</th>
                                <th>Nom</th>
                                <th>Catégorie</th>
                                <th>Statut</th>
                                <th>Description</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {soloEquipment.filter(item => item.etat === 'indisponible' || item.etat === 'en_reparation').length === 0 ? (
                                <tr>
                                  <td colSpan="6" className="centered-cell">Aucun équipement actuellement en maintenance</td>
                                </tr>
                              ) : (
                                soloEquipment.filter(item => item.etat === 'indisponible' || item.etat === 'en_reparation').map(equipment => (
                                  <tr key={equipment.id}>
                                    <td>{equipment.id}</td>
                                    <td>{equipment.nom}</td>
                                    <td><span className="category-badge">{equipment.categorie}</span></td>
                                    <td>
                                      <span className={`status-badge status-${equipment.etat}`}>
                                        {equipment.etat === 'en_reparation' ? 'En Réparation' : 'Indisponible'}
                                      </span>
                                    </td>
                                    <td>{equipment.description}</td>
                                    <td className="action-buttons">
                                      {equipment.etat === 'indisponible' && (
                                        <button
                                          className="repair-btn"
                                          title="Marquer comme En Réparation"
                                          onClick={() => handleUpdateEquipmentStatus(equipment.id, 'en_reparation', 'indisponible')}
                                        >
                                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                                          </svg>
                                          Commencer Réparation
                                        </button>
                                      )}
                                      {equipment.etat === 'en_reparation' && (
                                        <button
                                          className="confirm-btn"
                                          title="Marquer comme Réparé"
                                          onClick={() => handleUpdateEquipmentStatus(equipment.id, 'disponible', 'en_reparation')}
                                        >
                                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                          </svg>
                                          Marquer comme Réparé
                                        </button>
                                      )}
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

          {/* Vue des Réservations */}
          {activeView === 'reservations' && (
            <div className="dashboard-content reservations-view">
              <div className="section-header">
                <h2 className="section-title">Suivi des Réservations</h2>
                <div className="section-divider"></div>
                <p className="section-description">
                  Gérer et suivre les réservations d'équipement et leurs statuts
                </p>
              </div>

              <div className="filter-section">
                <h3>Filtrer les Réservations</h3>
                <div className="filter-controls">
                  <div className="form-group">
                    <label htmlFor="filter_status">Statut:</label>
                    <select
                      name="filter_status"
                      id="filter_status"
                      value={filterStatus}
                      onChange={handleFilterChange}
                      className="form-control"
                    >
                      <option value="">Tous les Statuts</option>
                      <option value="validee">Confirmé</option>
                      <option value="attente">En Attente</option>
                      <option value="refusee">Rejeté</option>
                      <option value="retournee">Retourné</option>
                    </select>
                  </div>
                  <button 
                    className="secondary-button"
                    onClick={() => setFilterStatus('')}
                  >
                    Effacer les Filtres
                  </button>
                </div>
              </div>

              <div className="table-container glass-effect">
                <h3>Gestion des Réservations</h3>
                <div className="responsive-table">
                  {isLoading ? (
                    <div className="loading-spinner"></div>
                  ) : (
                    <table>
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Étudiant</th>
                          <th>Équipement Réservé</th>
                          <th>Date de Début</th>
                          <th>Date de Fin</th>
                          <th>Statut</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reservations.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="centered-cell">Aucune réservation trouvée</td>
                          </tr>
                        ) : (
                          reservations
                            .filter(reservation => filterStatus === '' || reservation.statut === filterStatus)
                            .map(reservation => {
                              let statusClass = '';
                              if (reservation.statut === 'confirmé' || reservation.statut === 'validee') statusClass = 'status-confirmed';
                              else if (reservation.statut === 'en_cours' || reservation.statut === 'attente') statusClass = 'status-pending';
                              else if (reservation.statut === 'refusee') statusClass = 'status-rejected';
                              else if (reservation.statut === 'retournee') statusClass = 'status-returned';
                              
                              // Rest of your rendering code remains the same
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
                                            <span className="quantity-badge">x{item.quantity}</span>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      reservation.nom_equipement || `Équipement #${reservation.id_equipement}`
                                    )}
                                  </td>
                                  <td>{new Date(reservation.date_debut).toLocaleDateString('fr-FR', { month: 'short', day: '2-digit', year: 'numeric' })}</td>
                                  <td>{new Date(reservation.date_fin).toLocaleDateString('fr-FR', { month: 'short', day: '2-digit', year: 'numeric' })}</td>
                                  <td>
                                    <span className={`status-badge ${statusClass}`}>
                                      {reservation.statut === 'confirmé' || reservation.statut === 'validee' ? 'Confirmé' :
                                        reservation.statut === 'en_cours' ? 'En Cours' :
                                          reservation.statut === 'attente' ? 'En Attente' :
                                            reservation.statut === 'retournee' ? 'Retourné' : 'Rejetée'}
                                    </span>
                                  </td>
                                  <td className="action-buttons">
                                    {/* Remove approval/rejection buttons - technicians should not have this permission */}
                                    
                                    {/* Keep only the "Mark as Returned" button for confirmed reservations */}
                                    {(reservation.statut === 'confirmé' || reservation.statut === 'validee') && (
                                      <button
                                        onClick={() => handleUpdateReservationStatus(reservation.id_reservation, 'retournee')}
                                        className="return-btn"
                                        title="Marquer comme Retourné"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <polyline points="17 1 21 5 17 9"></polyline>
                                          <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
                                          <polyline points="7 23 3 19 7 15"></polyline>
                                          <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
                                        </svg>
                                        Marquer comme Retourné
                                      </button>
                                    )}
                                    
                                    {/* Keep the "Terminée" status display for returned reservations */}
                                    {reservation.statut === 'retournee' && (
                                      <span className="status-text">Terminée</span>
                                    )}
                                    
                                    {/* For pending/rejected reservations, show informational text */}
                                    {(reservation.statut === 'attente' || reservation.statut === 'en_attente') && (
                                      <span className="status-text">En attente d'approbation</span>
                                    )}
                                    
                                    {reservation.statut === 'refusee' && (
                                      <span className="status-text">Rejetée par responsable</span>
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

          {/* Vue des Notifications */}
          {activeView === 'notifications' && (
            <div className="dashboard-content notifications-view">
              <div className="section-header">
                <h2 className="section-title">Notifications Système</h2>
                <p className="section-description">
                  Consulter les alertes importantes et les messages liés à la maintenance des équipements et aux réservations
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
                            {notification.read ? (
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            ) : (
                              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            )}
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                        </div>
                        <div className="notification-content">
                          <h3>{notification.title || 'Notification'}</h3>
                          <p>{notification.message}</p>
                          <div className="notification-meta">
                            <span className="notification-time">
                              {notification.date ? new Date(notification.date).toLocaleString('fr-FR') : 'Récent'}
                            </span>
                          </div>
                        </div>
                        <div className="notification-actions">
                          <button
                            className="mark-read-btn"
                            title={notification.read ? "Marquer comme non lu" : "Marquer comme lu"}
                            onClick={(e) => {
                              e.stopPropagation(); // Empêcher le déclenchement du onClick parent
                              markAsRead(notification.id);
                            }}
                          >
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

          {/* Vue de Gestion des Utilisateurs */}
          {activeView === 'users' && (
            <div className="dashboard-content users-view">
              <div className="section-header">
                <h2 className="section-title">Gestion des Utilisateurs</h2>
                <div className="section-divider"></div>
                <p className="section-description">
                  Gérer les comptes utilisateurs du système
                </p>
              </div>

              <div className="table-container glass-effect">
                <div className="table-header">
                  <h3>Liste des Utilisateurs</h3>
                  <button
                    className="add-button"
                    onClick={() => setShowAddUserModal(true)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Ajouter un Utilisateur
                  </button>
                </div>

                <div className="responsive-table">
                  {isLoading ? (
                    <div className="loading-spinner"></div>
                  ) : (
                    <table>
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Nom</th>
                          <th>Prénom</th>
                          <th>Email</th>
                          <th>Rôle</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="centered-cell">Aucun utilisateur trouvé</td>
                          </tr>
                        ) : (
                          users.map(user => (
                            <tr key={user.id}>
                              <td>{user.id}</td>
                              <td>{user.nom}</td>
                              <td>{user.prenom}</td>
                              <td>{user.email}</td>
                              <td>
                                <span className={`role-badge role-${user.role}`}>
                                  {user.role === 'etudiant' ? 'Étudiant' :
                                   user.role === 'technicien' ? 'Technicien' :
                                   user.role === 'responsable' ? 'Responsable' : 'Autre'}
                                </span>
                              </td>
                              <td className="action-buttons">
                                <button
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="delete-button-small"
                                  title="Supprimer"
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
            </div>
          )}
        </main>
      </div>

      {/* Modale d'Ajout d'Équipement */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-container" ref={modalRef}>
            <div className="modal-header">
              <h3>Ajouter un Nouvel Équipement</h3>
              <button className="modal-close" onClick={closeModals}>×</button>
            </div>
            <div className="modal-body">
              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}

              <form className="equipment-form" onSubmit={handleAddEquipment}>
                <div className="form-group">
                  <label htmlFor="nom">Nom:</label>
                  <input
                    type="text"
                    name="nom"
                    id="nom"
                    placeholder="Nom de l'équipement"
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
                    placeholder="Description de l'équipement"
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
                    <label htmlFor="etat">Statut:</label>
                    <select
                      name="etat"
                      id="etat"
                      required
                      value={formData.etat || 'disponible'}
                      onChange={handleInputChange}
                      className="form-control"
                    >
                      <option value="disponible">Disponible</option>
                      <option value="en_cours">En Utilisation</option>
                      <option value="en_reparation">En Réparation</option>
                      <option value="indisponible">Indisponible</option>
                    </select>
                  </div>
                </div>

                {formData.categorie === 'stockable' && (
                  <div className="form-group">
                    <label htmlFor="quantite">Quantité:</label>
                    <input
                      type="number"
                      name="quantite"
                      id="quantite"
                      placeholder="Quantité"
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
                    {isLoading ? 'Traitement en cours...' : 'Ajouter l\'équipement'}
                  </button>
                  <button
                    type="button"
                    onClick={closeModals}
                    className="cancel-button"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modale de Mise à Jour d'Équipement */}
      {showUpdateModal && (
        <div className="modal-overlay">
          <div className="modal-container" ref={modalRef}>
            <div className="modal-header">
              <h3>Mettre à Jour l'Équipement</h3>
              <button className="modal-close" onClick={closeModals}>×</button>
            </div>
            <div className="modal-body">
              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}

              <form className="equipment-form" onSubmit={handleUpdateEquipment}>
                <input type="hidden" name="id" value={formData.id || ''} />
                <div className="form-group">
                  <label htmlFor="update_nom">Nom:</label>
                  <input
                    type="text"
                    name="nom"
                    id="update_nom"
                    placeholder="Nom de l'équipement"
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
                    placeholder="Description de l'équipement"
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
                    <label htmlFor="update_etat">Statut:</label>
                    <select
                      name="etat"
                      id="update_etat"
                      required
                      value={formData.etat || 'disponible'}
                      onChange={handleInputChange}
                      className="form-control"
                    >
                      <option value="disponible">Disponible</option>
                      <option value="en_cours">En Utilisation</option>
                      <option value="en_reparation">En Réparation</option>
                      <option value="indisponible">Indisponible</option>
                    </select>
                  </div>
                </div>

                {formData.categorie === 'stockable' && (
                  <div className="form-group">
                    <label htmlFor="update_quantite">Quantité:</label>
                    <input
                      type="number"
                      name="quantite"
                      id="update_quantite"
                      placeholder="Quantité"
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
                    {isLoading ? 'Traitement en cours...' : 'Mettre à jour l\'équipement'}
                  </button>
                  <button
                    type="button"
                    onClick={closeModals}
                    className="cancel-button"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modale de Code QR */}
      {showQRModal && (
        <div className="modal-overlay">
          <div className="modal-container qr-modal" ref={modalRef}>
            <div className="modal-header">
              <h3>Code QR de l'Équipement</h3>
              <button className="modal-close" onClick={() => setShowQRModal(false)}>×</button>
            </div>
            <div className="modal-body qr-container">
              {qrData && (
                <>
                  <div className="qr-code">
                    <QRCodeCanvas
                      value={qrData}
                      size={200}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                  <div className="qr-info">
                    <p><strong>Informations sur l'Équipement:</strong></p>
                    <p>Lorsqu'il est scanné, ce code QR affichera:</p>
                    <ul>
                      {JSON.parse(qrData) && (
                        <>
                          <li><strong>ID:</strong> {JSON.parse(qrData).id}</li>
                          <li><strong>Nom:</strong> {JSON.parse(qrData).name}</li>
                          <li><strong>Description:</strong> {JSON.parse(qrData).description}</li>
                        </>
                      )}
                    </ul>
                    <button
                      className="submit-button"
                      onClick={() => {
                        // Function to download QR code
                        const canvas = document.querySelector('.qr-code canvas');
                        const image = canvas.toDataURL("image/png");
                        const link = document.createElement('a');
                        const equipmentName = JSON.parse(qrData).name.replace(/\s+/g, '_').toLowerCase();
                        link.download = `qrcode_${equipmentName}_${JSON.parse(qrData).id}.png`;
                        link.href = image;
                        link.click();
                      }}
                    >
                      Télécharger le Code QR
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modale d'Ajout d'Utilisateur */}
      {showAddUserModal && (
        <div className="modal-overlay">
          <div className="modal-container" ref={modalRef}>
            <div className="modal-header">
              <h3>Ajouter un Nouvel Utilisateur</h3>
              <button className="modal-close" onClick={() => setShowAddUserModal(false)}>×</button>
            </div>
            <div className="modal-body">
              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}

              <form className="user-form" onSubmit={handleAddUser}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="nom">Nom:</label>
                    <input
                      type="text"
                      name="nom"
                      id="nom"
                      placeholder="Nom de famille"
                      required
                      value={userFormData.nom}
                      onChange={handleUserInputChange}
                      className="form-control"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="prenom">Prénom:</label>
                    <input
                      type="text"
                      name="prenom"
                      id="prenom"
                      placeholder="Prénom"
                      required
                      value={userFormData.prenom}
                      onChange={handleUserInputChange}
                      className="form-control"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email:</label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    placeholder="adresse@email.com"
                    required
                    value={userFormData.email}
                    onChange={handleUserInputChange}
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="role">Rôle:</label>
                  <select
                    name="role"
                    id="role"
                    required
                    value={userFormData.role}
                    onChange={handleUserInputChange}
                    className="form-control"
                  >
                    <option value="etudiant">Étudiant</option>
                    <option value="technicien">Technicien</option>
                    <option value="responsable">Responsable</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="mot_de_passe">Mot de passe:</label>
                  <input
                    type="password"
                    name="mot_de_passe"
                    id="mot_de_passe"
                    placeholder="Mot de passe"
                    required
                    value={userFormData.mot_de_passe}
                    onChange={handleUserInputChange}
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="user_id">ID:</label>
                  <input
                    type="number"
                    name="id"
                    id="user_id"
                    placeholder="Identifiant unique"
                    required
                    value={userFormData.id}
                    onChange={handleUserInputChange}
                    className="form-control"
                  />
                </div>

                <div className="modal-actions">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="submit-button"
                  >
                    {isLoading ? 'Traitement en cours...' : 'Ajouter l\'utilisateur'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddUserModal(false)}
                    className="cancel-button"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Technicien;