import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useLocation } from 'react-router-dom';
import Home from './components/home'; // Import the Login component
import Login from './components/login'; // Import the Login component
import Etudiant from './components/etudiant';
import Technicien from './components/technicien';
import Responsable from './components/responsable';

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
    </Router>
  );
};

export default App;