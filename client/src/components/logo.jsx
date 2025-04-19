import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Logo = ({ darkMode = false, variant = 'main', style = {} }) => {
  const location = useLocation();
  const isDashboard = ['etudiant', 'responsable', 'technicien'].some(page => 
    location.pathname.includes(page)
  );
  
  // Default logo is main for home/login, aside for dashboards
  const logoVariant = variant || (isDashboard ? 'aside' : 'main');
  
  // Get correct logo file based on variant and theme
  const logoFile = `${process.env.PUBLIC_URL}/logo_${logoVariant}${darkMode ? '_dark' : ''}.svg`;
  
  // Default styles with provided overrides
  const logoStyle = {
    height: "50px", 
    width: "auto", 
    verticalAlign: "middle",
    ...style
  };
  
  // If it's a dashboard, make the logo link to home
  const logoElement = (
    <img
      src={logoFile}
      alt="GIMS Logo"
      className="logo-image"
      style={logoStyle}
    />
  );
  
  // On dashboard pages, logo should link to homepage
  if (isDashboard) {
    return (
      <Link to="/" className="logo-link">
        {logoElement}
      </Link>
    );
  }
  
  // On home/login pages, just show the logo without link
  return logoElement;
};

export default Logo;