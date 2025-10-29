import React from 'react';

const AnimatedLoader = ({ message = "Loading data... Please wait...", subMessage = "Fetching Latest Placement Statistics." }) => {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#ffffff',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        backgroundColor: '#E0E7FF',
        borderRadius: '16px',
        padding: '40px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
        textAlign: 'center',
        minWidth: '300px'
      }}>
        {/* Animated Dots */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: '24px',
          gap: '8px'
        }}>
          <div 
            className="loading-dot"
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: '#33F580',
              animation: 'bounce 1.4s infinite ease-in-out both',
              animationDelay: '-0.32s'
            }}
          />
          <div 
            className="loading-dot"
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: '#FC7564',
              animation: 'bounce 1.4s infinite ease-in-out both',
              animationDelay: '-0.16s'
            }}
          />
          <div 
            className="loading-dot"
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: '#9EBCFF',
              animation: 'bounce 1.4s infinite ease-in-out both',
              animationDelay: '0s'
            }}
          />
        </div>

        {/* Loading Messages */}
        <div style={{
          color: '#333333',
          fontSize: '18px',
          fontWeight: '600',
          marginBottom: '8px',
          lineHeight: '1.4'
        }}>
          {message}
        </div>
        
        <div style={{
          color: '#6B7280',
          fontSize: '14px',
          fontWeight: '400',
          lineHeight: '1.4'
        }}>
          {subMessage}
        </div>

        {/* CSS Animation Styles */}
        <style>{`
          @keyframes bounce {
            0%, 80%, 100% {
              transform: scale(0);
              opacity: 0.5;
            }
            40% {
              transform: scale(1);
              opacity: 1;
            }
          }
          
          .loading-dot {
            display: inline-block;
            margin: 0 4px;
          }
          
          /* Pulse animation for the entire card */
          @keyframes pulse {
            0% {
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            }
            50% {
              box-shadow: 0 8px 30px rgba(51, 245, 128, 0.2);
            }
            100% {
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            }
          }
          
          .loading-card {
            animation: pulse 2s infinite ease-in-out;
          }
        `}</style>
      </div>
    </div>
  );
};

export default AnimatedLoader;
