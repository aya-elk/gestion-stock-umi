import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import '../css/chatbot.css';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Bonjour! Je suis l'assistant GIMS. Comment puis-je vous aider aujourd'hui?", sender: 'bot' }
  ]);
  const [context, setContext] = useState('home');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const location = useLocation();

  // Determine context based on current route
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('etudiant')) setContext('etudiant');
    else if (path.includes('technicien')) setContext('technicien');
    else if (path.includes('responsable')) setContext('responsable');
    else setContext('home');
  }, [location]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Context-specific questions
  const getContextQuestions = () => {
    switch (context) {
      case 'etudiant':
        return [
          { id: 1, text: "Comment réserver un équipement?" },
          { id: 2, text: "Comment consulter mes réservations?" },
          { id: 3, text: "Que faire si mon équipement est endommagé?" },
          { id: 4, text: "Comment annuler une réservation?" }
        ];
      case 'technicien':
        return [
          { id: 1, text: "Comment ajouter un nouvel équipement?" },
          { id: 2, text: "Comment mettre à jour l'état d'un équipement?" },
          { id: 3, text: "Comment traiter une demande de réparation?" },
          { id: 4, text: "Comment générer un QR code pour un équipement?" }
        ];
      case 'responsable':
        return [
          { id: 1, text: "Comment approuver une réservation?" },
          { id: 2, text: "Comment consulter les statistiques d'utilisation?" },
          { id: 3, text: "Comment gérer les niveaux de stock?" },
          { id: 4, text: "Comment envoyer une notification?" }
        ];
      default: // home
        return [
          { id: 1, text: "Qu'est-ce que GIMS?" },
          { id: 2, text: "Comment créer un compte?" },
          { id: 3, text: "Quels sont les différents rôles?" },
          { id: 4, text: "Comment contacter le support?" }
        ];
    }
  };

  // Context-specific answers
  const getAnswer = (questionId) => {
    const answers = {
      home: {
        1: "GIMS (Gestion Informatique du Matériel et Stock) est une plateforme de gestion d'équipements universitaires qui simplifie le processus de réservation et d'inventaire.",
        2: "Pour créer un compte, cliquez sur 'Commencer' en haut de la page et suivez les instructions d'inscription. Vous devrez fournir votre email universitaire pour vérification.",
        3: "GIMS propose trois rôles principaux : Étudiant (réservation d'équipement), Technicien (gestion d'inventaire), et Responsable (approbation et supervision).",
        4: "Vous pouvez contacter notre support via le formulaire de contact en bas de la page d'accueil, ou directement par email à support@GIMSequipment.com."
      },
      etudiant: {
        1: "Pour réserver un équipement, naviguez vers l'onglet 'Parcourir l'équipement', sélectionnez les articles que vous souhaitez, ajoutez-les au panier, puis finalisez votre réservation en spécifiant les dates désirées.",
        2: "Vous pouvez consulter vos réservations actuelles et passées dans l'onglet 'Historique des réservations' ou visualiser votre calendrier dans l'onglet 'Calendrier'.",
        3: "Si un équipement est endommagé, contactez immédiatement le technicien responsable. N'essayez pas de réparer l'équipement vous-même pour éviter d'aggraver les dommages.",
        4: "Pour annuler une réservation, accédez à votre historique de réservations, trouvez la réservation concernée et contactez le responsable au moins 24h à l'avance."
      },
      technicien: {
        1: "Pour ajouter un équipement, accédez à l'onglet 'Gestion d'Inventaire' et cliquez sur le bouton 'Ajouter un équipement'. Remplissez tous les détails requis dans le formulaire.",
        2: "Pour mettre à jour l'état d'un équipement, localisez-le dans la liste d'inventaire, cliquez sur le bouton d'édition, et modifiez son statut dans le formulaire qui apparaît.",
        3: "Les demandes de réparation sont visibles dans l'onglet 'Maintenance et Réparations'. Sélectionnez une demande pour la consulter et mettez à jour son statut une fois traitée.",
        4: "Pour générer un QR code, trouvez l'équipement dans l'inventaire et cliquez sur l'icône QR. Le code peut être imprimé ou téléchargé pour être attaché à l'équipement."
      },
      responsable: {
        1: "Pour approuver une réservation, accédez à l'onglet 'Demandes en Attente', examinez les détails de la demande, puis utilisez les boutons d'approbation ou de rejet pour traiter la demande.",
        2: "Les statistiques d'utilisation sont disponibles dans le tableau de bord principal. Vous pouvez filtrer les données par période et exporter des rapports détaillés si nécessaire.",
        3: "Pour gérer les niveaux de stock, utilisez l'onglet 'Surveillance des Stocks'. Vous pouvez filtrer pour voir uniquement les équipements avec des niveaux bas et planifier des réapprovisionnements.",
        4: "Pour envoyer une notification, accédez à l'interface de notification, sélectionnez les destinataires (tous les utilisateurs ou des groupes spécifiques), rédigez votre message et cliquez sur envoyer."
      }
    };

    return answers[context][questionId] || "Je n'ai pas de réponse à cette question pour le moment.";
  };

  const handleQuestionClick = (question) => {
    // Add user question to chat
    setMessages([...messages, { text: question.text, sender: 'user' }]);
    
    // Simulate typing
    setIsTyping(true);
    
    // Simulate response delay
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prevMessages => [
        ...prevMessages, 
        { text: getAnswer(question.id), sender: 'bot' }
      ]);
    }, 1000);
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={`chatbot-container ${isOpen ? 'open' : ''}`}>
      {/* Chatbot button */}
      <button 
        className="chatbot-button" 
        onClick={toggleChat}
        aria-label={isOpen ? "Fermer l'assistant" : "Ouvrir l'assistant"}
      >
        {isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        )}
      </button>

      {/* Chatbot dialog */}
      {isOpen && (
        <div className="chatbot-dialog glass-effect">
          <div className="chatbot-header">
            <div className="chatbot-title">
              <div className="chatbot-avatar">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 18h.01"></path>
                  <path d="M17.5 14.5c-.83 .83-2 1.5-3.5 1.5-1.5 0-2.67-.67-3.5-1.5"></path>
                  <path d="M8.5 14.5c.83-.83 2-1.5 3.5-1.5 1.5 0 2.67 .67 3.5 1.5"></path>
                  <path d="M20.5 9c-.83 .83-2 1.5-3.5 1.5-1.5 0-2.67-.67-3.5-1.5"></path>
                  <path d="M3.5 9c.83-.83 2-1.5 3.5-1.5 1.5 0 2.67 .67 3.5 1.5"></path>
                  <path d="M12 2a2 2 0 0 0-2 2v1a2 2 0 0 0 4 0V4a2 2 0 0 0-2-2z"></path>
                </svg>
              </div>
              <h3>Assistant GIMS</h3>
            </div>
          </div>
          
          <div className="chatbot-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.sender}`}>
                {msg.text}
              </div>
            ))}
            {isTyping && <div className="typing-indicator"><span>.</span><span>.</span><span>.</span></div>}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="chatbot-questions">
            <h4>Questions fréquentes :</h4>
            <div className="question-buttons">
              {getContextQuestions().map(question => (
                <button 
                  key={question.id}
                  className="question-button"
                  onClick={() => handleQuestionClick(question)}
                >
                  {question.text}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;