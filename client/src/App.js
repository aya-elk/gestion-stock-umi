import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import './css/App.css'; // Import your CSS files
// import './css/enhanced.css'; // Import additional styles
import Login from './login.js'; // Import the Login component
import Etudiant from './etudiant';
import Technicien from './technicien';

const MainPage = () => {
  return (
    <div>
      <header className="sticky-header">
        <div className="nav-container">
          <div className="logo">GP<span>.</span></div>
          <nav>
            <ul className="nav-links">
              <li><a className="active" href="#">Home</a></li>
              <li><a href="#about">About</a></li>
              <li><a href="#services">Services</a></li>
              <li><a href="#contact">Contact</a></li>
            </ul>
          </nav>
          <Link className="btn" to="/login">Get Started</Link> {/* Use Link for navigation */}
        </div>
      </header>

      <section className="hero">
        <div className="hero-content">
          <h1 className="fade-in hidden">Powerful Digital<br />Solutions With GP<span>.</span></h1>
          <a href="#contact" className="btn bounce hidden">Contact Us</a>
        </div>
      </section>

      <section id="about" className="about-section">
        <h2>About Us</h2>
        <p>We provide cutting-edge digital solutions to help businesses grow and succeed in the digital age.</p>
        <div className="stats">
          <div className="stat">
            <h3 className="counter" data-target="500">0</h3>
            <p>Projects Completed</p>
          </div>
          <div className="stat">
            <h3 className="counter" data-target="300">0</h3>
            <p>Happy Clients</p>
          </div>
          <div className="stat">
            <h3 className="counter" data-target="50">0</h3>
            <p>Team Members</p>
          </div>
        </div>
      </section>

      <section id="services" className="services-section">
        <h2>Our Services</h2>
        <div className="features">
          <div className="feature slide-in">
            <div className="icon">👥</div>
            <h4>Consulting</h4>
            <p>Expert advice to optimize your digital strategy.</p>
          </div>
          <div className="feature slide-in">
            <div className="icon">🎯</div>
            <h4>Marketing</h4>
            <p>Targeted campaigns to reach your audience.</p>
          </div>
          <div className="feature slide-in">
            <div className="icon">➕</div>
            <h4>Development</h4>
            <p>Custom software solutions tailored to your needs.</p>
          </div>
        </div>
      </section>

      <section id="testimonials" className="testimonials-section">
        <h2>What Our Clients Say</h2>
        <div className="testimonials">
          <div className="testimonial fade-in">
            <p>"hh"</p>
            <h4>- Tarik hh</h4>
          </div>
          <div className="testimonial fade-in">
            <p>"tfo"</p>
            <h4>- Aya lcute</h4>
          </div>
          <div className="testimonial fade-in">
            <p>""</p>
            <h4>- Mariam mimi</h4>
          </div>
        </div>
      </section>

      <section id="contact" className="contact-section">
        <h2>Contact Us</h2>
        <form className="contact-form">
          <input type="text" name="name" placeholder="Name" required />
          <input type="email" name="email" placeholder="Email" required />
          <input type="text" name="phone" placeholder="Phone" required />
          <textarea name="message" placeholder="Message" required></textarea>
          <button type="submit">Send</button>
        </form>
      </section>

      <footer>
        <p>&copy; 2025 GP Digital Solutions. All rights reserved.</p>
      </footer>

      <button id="back-to-top" title="Back to Top">↑</button>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/etudiant" element={<Etudiant />} />
        <Route path="/technicien" element={<Technicien />} />
      </Routes>
    </Router>
  );
};

export default App;