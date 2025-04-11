import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useLocation } from 'react-router-dom';
import './css/App.css'; // Import your CSS files
import Login from './login.js'; // Import the Login component
import Etudiant from './etudiant';
import Technicien from './technicien';
import Responsable from './responsable';

// ScrollToTop component for smooth navigation
const ScrollToTop = () => {
  const { pathname } = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  
  return null;
};

const MainPage = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  
  useEffect(() => {
    // Animate counters
    const counters = document.querySelectorAll('.counter');
    counters.forEach(counter => {
      const target = parseInt(counter.getAttribute('data-target'));
      const duration = 2000; // 2 seconds
      const frameRate = 20; // Update every 20ms
      const increment = target / (duration / frameRate);
      
      const updateCounter = () => {
        const currentValue = parseInt(counter.innerText);
        if (currentValue < target) {
          counter.innerText = Math.ceil(currentValue + increment);
          setTimeout(updateCounter, frameRate);
        } else {
          counter.innerText = target;
        }
      };
      
      // Start counter when element is in view
      const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          updateCounter();
          observer.disconnect();
        }
      }, { threshold: 0.5 });
      
      observer.observe(counter);
    });
    
    // Intersection Observer for animations
    const observerOptions = {
      threshold: 0.25,
      rootMargin: '0px 0px -100px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('show');
          entry.target.classList.remove('hidden');
        }
      });
    }, observerOptions);
    
    document.querySelectorAll('.fade-in, .slide-in, .scale-in').forEach(el => {
      observer.observe(el);
    });
    
    // Parallax effect for hero section
    const parallaxElements = document.querySelectorAll('.parallax');
    window.addEventListener('scroll', () => {
      const scrollPosition = window.pageYOffset;
      parallaxElements.forEach(element => {
        const speed = element.dataset.speed || 0.5;
        element.style.transform = `translateY(${scrollPosition * speed}px)`;
      });
    });
    
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', () => {});
    };
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle('dark-mode');
  };

  return (
    <div className={`app-container ${darkMode ? 'dark-mode' : ''}`}>
      <header className={`sticky-header ${menuOpen ? 'menu-open' : ''}`}>
        <div className="nav-container">
          <div className="logo">
            <span className="logo-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
              </svg>
            </span>
            <span className="logo-text">GP<span className="accent-dot">.</span></span>
          </div>
          
          <div className="mobile-menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
            <span></span>
            <span></span>
            <span></span>
          </div>
          
          <nav className={menuOpen ? 'active' : ''}>
            <ul className="nav-links">
              <li><a className="active" href="#">Home</a></li>
              <li><a href="#about">About</a></li>
              <li><a href="#services">Services</a></li>
              <li><a href="#testimonials">Testimonials</a></li>
              <li><a href="#contact">Contact</a></li>
            </ul>
          </nav>
          
          <div className="nav-actions">
            <button onClick={toggleDarkMode} className="theme-toggle" aria-label="Toggle Dark Mode">
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
            <Link className="cta-button" to="/login">Get Started</Link>
          </div>
        </div>
      </header>

      <section className="hero">
        <div className="hero-background">
          <div className="shape shape-1" data-speed="0.2"></div>
          <div className="shape shape-2" data-speed="0.4"></div>
          <div className="shape shape-3" data-speed="0.3"></div>
        </div>
        
        <div className="hero-content">
          <span className="tag-line fade-in hidden">Welcome to GP Solutions</span>
          <h1 className="headline fade-in hidden">
            Powerful Digital<br />Solutions With <span className="highlight">GP<span className="accent-dot">.</span></span>
          </h1>
          <p className="subheading fade-in hidden">Transforming ideas into exceptional digital experiences</p>
          
          <div className="hero-actions">
            <a href="#contact" className="cta-button fade-in">Get in Touch</a>
            <a href="#services" className="secondary-button fade-in">Explore Services</a>
          </div>
          
          <div className="hero-stats fade-in hidden">
            <div className="stat-item">
              <span className="stat-number">10+</span>
              <span className="stat-label">Years Experience</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-number">500+</span>
              <span className="stat-label">Projects Delivered</span>
            </div>
          </div>
        </div>
        
        <div className="scroll-indicator">
          <div className="mouse">
            <div className="wheel"></div>
          </div>
          <div className="scroll-text">Scroll Down</div>
        </div>
      </section>

      <section id="about" className="about-section">
        <div className="section-header">
          <span className="section-tag fade-in hidden">Our Story</span>
          <h2 className="section-title fade-in hidden">About Us</h2>
          <div className="section-divider fade-in hidden"></div>
        </div>
        
        <div className="about-content">
          <div className="about-text">
            <p className="fade-in hidden">We provide cutting-edge digital solutions to help businesses grow and succeed in the digital age, combining innovation with practical results.</p>
            <p className="fade-in hidden">Founded in 2013, our team has been at the forefront of digital transformation across multiple industries.</p>
          </div>
          
          <div className="about-image fade-in hidden">
            <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c" alt="Team collaboration" />
            <div className="about-image-overlay"></div>
          </div>
        </div>
        
        <div className="stats-container">
          <div className="stat scale-in hidden">
            <div className="stat-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2L11 13"></path>
                <path d="M22 2l-7 20-4-9-9-4 20-7z"></path>
              </svg>
            </div>
            <h3 className="counter" data-target="500">0</h3>
            <p>Projects Completed</p>
          </div>
          <div className="stat scale-in hidden">
            <div className="stat-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="5"></circle>
                <path d="M20 21v-2a7 7 0 0 0-7-7h-2a7 7 0 0 0-7 7v2"></path>
                <path d="M8 14l3 3 5-5"></path>
              </svg>
            </div>
            <h3 className="counter" data-target="300">0</h3>
            <p>Happy Clients</p>
          </div>
          <div className="stat scale-in hidden">
            <div className="stat-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <h3 className="counter" data-target="50">0</h3>
            <p>Team Members</p>
          </div>
          <div className="stat scale-in hidden">
            <div className="stat-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="7"></circle>
                <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
              </svg>
            </div>
            <h3 className="counter" data-target="25">0</h3>
            <p>Industry Awards</p>
          </div>
        </div>
      </section>

      <section id="services" className="services-section">
        <div className="section-header">
          <span className="section-tag fade-in hidden">What We Do</span>
          <h2 className="section-title fade-in hidden">Our Services</h2>
          <div className="section-divider fade-in hidden"></div>
        </div>
        
        <p className="section-description fade-in hidden">We offer comprehensive solutions tailored to your specific needs</p>
        
        <div className="features">
          <div className="feature-card slide-in hidden">
            <div className="feature-icon">
              <div className="icon-circle">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                </svg>
              </div>
            </div>
            <h4>Strategic Consulting</h4>
            <p>Expert advice to optimize your digital strategy and business growth initiatives.</p>
            <a href="#contact" className="feature-link">Learn more →</a>
          </div>
          
          <div className="feature-card slide-in hidden">
            <div className="feature-icon">
              <div className="icon-circle">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <circle cx="12" cy="12" r="6"></circle>
                  <circle cx="12" cy="12" r="2"></circle>
                </svg>
              </div>
            </div>
            <h4>Digital Marketing</h4>
            <p>Targeted campaigns to reach your audience and convert leads into loyal customers.</p>
            <a href="#contact" className="feature-link">Learn more →</a>
          </div>
          
          <div className="feature-card slide-in hidden">
            <div className="feature-icon">
              <div className="icon-circle">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                  <line x1="8" y1="21" x2="16" y2="21"></line>
                  <line x1="12" y1="17" x2="12" y2="21"></line>
                </svg>
              </div>
            </div>
            <h4>Custom Development</h4>
            <p>Bespoke software solutions tailored to your exact business requirements.</p>
            <a href="#contact" className="feature-link">Learn more →</a>
          </div>
          
          <div className="feature-card slide-in hidden">
            <div className="feature-icon">
              <div className="icon-circle">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                </svg>
              </div>
            </div>
            <h4>UX/UI Design</h4>
            <p>Creating intuitive, engaging interfaces that enhance user experience.</p>
            <a href="#contact" className="feature-link">Learn more →</a>
          </div>
        </div>
      </section>

      <section id="testimonials" className="testimonials-section">
        <div className="section-header">
          <span className="section-tag fade-in hidden">Client Feedback</span>
          <h2 className="section-title fade-in hidden">What Our Clients Say</h2>
          <div className="section-divider fade-in hidden"></div>
        </div>
        
        <div className="testimonials-container">
          <div className="testimonial-card fade-in hidden">
            <div className="testimonial-rating">★★★★★</div>
            <p className="testimonial-text">GP transformed our business with their innovative approach to digital solutions. Their team exceeded our expectations at every turn.</p>
            <div className="testimonial-author">
              <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="Tarik" className="author-image" />
              <div className="author-details">
                <h4>Tarik Ahmed</h4>
                <p>CEO, TechStart</p>
              </div>
            </div>
          </div>
          
          <div className="testimonial-card fade-in hidden">
            <div className="testimonial-rating">★★★★★</div>
            <p className="testimonial-text">Working with GP was a game-changer for our marketing strategy. The results were immediate and impressive.</p>
            <div className="testimonial-author">
              <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="Aya" className="author-image" />
              <div className="author-details">
                <h4>Aya Benali</h4>
                <p>Marketing Director, Innovate Inc.</p>
              </div>
            </div>
          </div>
          
          <div className="testimonial-card fade-in hidden">
            <div className="testimonial-rating">★★★★★</div>
            <p className="testimonial-text">The team at GP consistently delivers high-quality work with attention to detail that sets them apart from other agencies.</p>
            <div className="testimonial-author">
              <img src="https://randomuser.me/api/portraits/women/68.jpg" alt="Mariam" className="author-image" />
              <div className="author-details">
                <h4>Mariam El Fassi</h4>
                <p>CTO, DataDrive</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="contact-section">
        <div className="contact-container">
          <div className="contact-info">
            <div className="section-header">
              <span className="section-tag fade-in hidden">Get In Touch</span>
              <h2 className="section-title fade-in hidden">Contact Us</h2>
              <div className="section-divider fade-in hidden"></div>
            </div>
            
            <p className="contact-description fade-in hidden">Have a project in mind? Let's discuss how we can help you achieve your goals.</p>
            
            <div className="contact-details">
              <div className="contact-item fade-in hidden">
                <div className="contact-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                </div>
                <div>
                  <h4>Our Address</h4>
                  <p>123 Innovation Street, Tech District, CA 94107</p>
                </div>
              </div>
              
              <div className="contact-item fade-in hidden">
                <div className="contact-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                </div>
                <div>
                  <h4>Phone</h4>
                  <p>+1 (555) 123-4567</p>
                </div>
              </div>
              
              <div className="contact-item fade-in hidden">
                <div className="contact-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                </div>
                <div>
                  <h4>Email</h4>
                  <p>contact@gpsolutions.com</p>
                </div>
              </div>
            </div>
          </div>
          
          <form className="contact-form scale-in hidden">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input type="text" id="name" name="name" placeholder="Your name" required />
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input type="email" id="email" name="email" placeholder="your@email.com" required />
            </div>
            
            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input type="text" id="phone" name="phone" placeholder="Your phone number" required />
            </div>
            
            <div className="form-group">
              <label htmlFor="message">Message</label>
              <textarea id="message" name="message" placeholder="Tell us about your project..." required></textarea>
            </div>
            
            <button type="submit" className="submit-button">
              <span>Send Message</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
          </form>
        </div>
      </section>

      <footer className="main-footer">
        <div className="footer-container">
          <div className="footer-top">
            <div className="footer-logo">
              <span className="logo-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
                </svg>
              </span>
              <span className="logo-text">GP<span className="accent-dot">.</span></span>
            </div>
            
            <div className="footer-links">
              <div className="footer-col">
                <h4>Company</h4>
                <ul>
                  <li><a href="#about">About Us</a></li>
                  <li><a href="#services">Services</a></li>
                  <li><a href="#testimonials">Testimonials</a></li>
                </ul>
              </div>
              
              <div className="footer-col">
                <h4>Resources</h4>
                <ul>
                  <li><a href="#">Blog</a></li>
                  <li><a href="#">Case Studies</a></li>
                  <li><a href="#">FAQ</a></li>
                </ul>
              </div>
              
              <div className="footer-col">
                <h4>Legal</h4>
                <ul>
                  <li><a href="#">Privacy Policy</a></li>
                  <li><a href="#">Terms of Service</a></li>
                  <li><a href="#">Cookie Policy</a></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p>&copy; 2025 GP Digital Solutions. All rights reserved.</p>
            <div className="social-icons">
              <a href="#" aria-label="Twitter"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg></a>
              <a href="#" aria-label="Facebook"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/></svg></a>
              <a href="#" aria-label="Instagram"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg></a>
              <a href="#" aria-label="LinkedIn"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z"/></svg></a>
            </div>
          </div>
        </div>
      </footer>

      <button id="back-to-top" title="Back to Top">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="18 15 12 9 6 15"></polyline>
        </svg>
      </button>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/etudiant" element={<Etudiant />} />
        <Route path="/technicien" element={<Technicien />} />
        <Route path="/responsable" element={<Responsable />} />
      </Routes>
    </Router>
  );
};

export default App;