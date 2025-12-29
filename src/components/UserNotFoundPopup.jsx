import React from 'react';

const UserNotFoundPopup = ({ isOpen, onClose, onSignUp }) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10000,
        fontFamily: 'Poppins, Arial, sans-serif',
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          width: '400px',
          maxWidth: '90vw',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
          overflow: 'hidden',
          animation: 'popupSlideIn 0.3s ease-out',
        }}
      >
        <div
          style={{
            backgroundColor: '#5932EA',
            color: 'white',
            padding: '20px',
            textAlign: 'center',
            fontSize: '24px',
            fontWeight: '600',
            letterSpacing: '1px',
          }}
        >
          Error !
        </div>

        <div
          style={{
            padding: '40px 30px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: '120px',
              fontWeight: '700',
              color: '#dc3545',
              lineHeight: '1',
              marginBottom: '20px',
              fontFamily: 'Arial, sans-serif',
            }}
          >
            404
          </div>

          <h2
            style={{
              fontSize: '28px',
              fontWeight: '600',
              color: '#333',
              margin: '0 0 15px 0',
            }}
          >
            User Not Found...!
          </h2>

          <p
            style={{
              fontSize: '16px',
              color: '#666',
              margin: '0 0 10px 0',
              lineHeight: '1.4',
            }}
          >
            The User is not Found in the Portal,
          </p>
          <p
            style={{
              fontSize: '16px',
              color: '#666',
              margin: '0 0 40px 0',
              lineHeight: '1.4',
            }}
          >
            Please SignUp to continue.
          </p>

          <div
            style={{
              display: 'flex',
              gap: '50px',
              justifyContent: 'center',
            }}
          >
            <button
              onClick={onClose}
              style={{
                backgroundColor: 'rgb(108, 117, 125)',
                color: 'white',
                border: 'none',
                padding: '12px 30px',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: '0.2s',
                minWidth: '100px',
              }}
              onMouseOver={(e) =>
                (e.target.style.backgroundColor = 'rgb(92, 101, 110)')
              }
              onMouseOut={(e) =>
                (e.target.style.backgroundColor = 'rgb(108, 117, 125)')
              }
            >
              Close
            </button>
            <button
              onClick={onSignUp}
              style={{
                backgroundColor: 'rgb(89, 50, 234)',
                color: 'white',
                border: 'none',
                padding: '12px 30px',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: '0.2s',
                minWidth: '100px',
              }}
              onMouseOver={(e) =>
                (e.target.style.backgroundColor = 'rgb(70, 40, 200)')
              }
              onMouseOut={(e) =>
                (e.target.style.backgroundColor = 'rgb(89, 50, 234)')
              }
            >
              Sign up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserNotFoundPopup;
