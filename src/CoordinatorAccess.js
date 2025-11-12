import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AnimatedLoader from './components/AnimatedLoader.js';
import './CoordinatorAccess.css';

const CoordinatorAccess = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const navigate = useNavigate();

  // Check for existing coordinator session on component mount
  useEffect(() => {
    const checkAuth = async () => {
      // Add a small delay to prevent glitch
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const coordinatorAuth = localStorage.getItem('isCoordinatorLoggedIn');
      if (coordinatorAuth === 'true') {
        setIsAuthenticated(true);
        // Redirect to coordinator dashboard if already authenticated
        navigate('/coordinator/dashboard', { replace: true });
      }
      setIsLoading(false);
    };
    
    checkAuth();
  }, [navigate]);

  const handleLogin = (e) => {
    e.preventDefault();
    // Simple authentication - in production, this would be more secure
    if (credentials.username === 'coordinator' && credentials.password === 'coordinator123') {
      setIsAuthenticated(true);
      // Store authentication state in localStorage using the new keys
      localStorage.setItem('isCoordinatorLoggedIn', 'true');
      localStorage.setItem('coordinatorData', JSON.stringify({
        username: credentials.username,
        role: 'coordinator'
      }));
      localStorage.setItem('coordinatorUsername', credentials.username);
      // Navigate to coordinator dashboard URL
      navigate('/coordinator/dashboard', { replace: true });
    } else {
      alert('Invalid credentials. Use username: coordinator, password: coordinator123');
    }
  };

  // const handleLogout = () => { // Unused
  //   setIsAuthenticated(false);
  //   setCredentials({ username: '', password: '' });
  //   // Clear authentication state from localStorage using new keys
  //   localStorage.removeItem('isCoordinatorLoggedIn');
  //   localStorage.removeItem('coordinatorData');
  //   localStorage.removeItem('coordinatorUsername');
  //   navigate('/coordinator', { replace: true });
  // };

  // Show loading screen while checking authentication
  if (isLoading) {
    return <AnimatedLoader 
      message="Loading Coordinator Dashboard..." 
      subMessage="Verifying authentication status." 
    />;
  }

  // If authenticated, this component should not render since routing will handle it
  if (isAuthenticated) {
    return <AnimatedLoader message="Redirecting to dashboard..." />;
  }

  return (
    <div className="coordinator-access-wrapper">
      <div className="coordinator-access-container">
        <div className="coordinator-access-header">
          <h1>Coordinator Access</h1>
          <p>Please enter your credentials to access the coordinator dashboard</p>
        </div>
        
        <form onSubmit={handleLogin} className="coordinator-access-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={credentials.username}
              onChange={(e) => setCredentials({...credentials, username: e.target.value})}
              placeholder="Enter username"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={credentials.password}
              onChange={(e) => setCredentials({...credentials, password: e.target.value})}
              placeholder="Enter password"
              required
            />
          </div>
          
          <button type="submit" className="coordinator-login-btn">
            Login as Coordinator
          </button>
        </form>
        
        <div className="coordinator-access-info">
          <p><strong>Demo Credentials:</strong></p>
          <p>Username: coordinator</p>
          <p>Password: coordinator123</p>
        </div>
      </div>
    </div>
  );
};

export default CoordinatorAccess;
