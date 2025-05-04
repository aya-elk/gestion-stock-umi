import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import Home from './pages/home'; // Import the Login component
import Login from './pages/login'; // Import the Login component
import Etudiant from './pages/etudiant';
import Technicien from './pages/technicien';
import Responsable from './pages/responsable';
import Chatbot from './components/chatbot';

// ScrollToTop component for smooth navigation
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const App = () => {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/etudiant" element={<Etudiant />} />
        <Route path="/technicien" element={<Technicien />} />
        <Route path="/responsable" element={<Responsable />} />
      </Routes>
      <Chatbot />
    </Router>
  );
};

export default App;