import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './css/login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (email === '' || password === '') {
      setError('Please fill in all fields');
      return;
    }

    setSuccess('Login successful (simulated)');
    setError('');
  };

  return (
    <>
      <header className="sticky-header">
        <div className="nav-container">
          <div className="logo">GP<span>.</span></div>
          <nav>
            <ul className="nav-links">
              <li><Link to="/">Home</Link></li>
              <li><a href="#about">About</a></li>
              <li><a href="#services">Services</a></li>
              <li><a href="#contact">Contact</a></li>
            </ul>
          </nav>
          <Link className="btn" to="/login">Get Started</Link>
        </div>
      </header>

      <section className="login-section">
        <div className="login-container">
          <h2>Login</h2>
          <form className="login-form" onSubmit={handleSubmit}>
            <input
              type="email"
              name="email"
              placeholder="Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div className="login-options">
              <label>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                /> Remember me
              </label>
              <a href="#" className="forgot-link">Forgot Password?</a>
            </div>
            <button type="submit">Login</button>
          </form>
          {error && <p className="error-message">{error}</p>}
          {success && <p className="success-message">{success}</p>}
          <p className="signup-link">
            Don't have an account? <a href="#">Sign up</a>
          </p>
        </div>
      </section>
    </>
  );
};

export default Login;