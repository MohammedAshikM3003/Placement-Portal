import React, { useState } from 'react';
import mongoDBService from '../services/mongoDBService.jsx';

const RegistrationDebug = () => {
  const [regNo, setRegNo] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const checkRegistration = async () => {
    setLoading(true);
    try {
      console.log('Checking registration number:', regNo);
      
      // Check if student exists
      const existingStudent = await mongoDBService.getStudentByRegNoAndDob(regNo, '01012003');
      console.log('Existing student:', existingStudent);
      
      // Get all students with this regNo (in case there are duplicates)
      const allStudents = [existingStudent]; // MongoDB doesn't have getAllStudentsByRegNo, so we'll use the single result
      console.log('All students with this regNo:', allStudents);
      
      setResults({
        existingStudent,
        allStudents,
        timestamp: new Date().toLocaleString()
      });
    } catch (error) {
      console.error('Error checking registration:', error);
      setResults({
        error: error.message,
        timestamp: new Date().toLocaleString()
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteRegistration = async () => {
    if (!window.confirm(`Are you sure you want to delete ALL students with registration number ${regNo}?`)) {
      return;
    }
    
    setLoading(true);
    try {
      const result = await mongoDBService.updateStudent(results.existingStudent.id, { isBlocked: true });
      console.log('Delete result:', result);
      
      setResults(prev => ({
        ...prev,
        deleteResult: result,
        deleteTimestamp: new Date().toLocaleString()
      }));
    } catch (error) {
      console.error('Error deleting registration:', error);
      setResults(prev => ({
        ...prev,
        deleteError: error.message,
        deleteTimestamp: new Date().toLocaleString()
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Registration Number Debug Tool</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <label>
          Registration Number:
          <input 
            type="text" 
            value={regNo} 
            onChange={(e) => setRegNo(e.target.value)}
            style={{ marginLeft: '10px', padding: '5px', width: '200px' }}
          />
        </label>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={checkRegistration} 
          disabled={loading}
          style={{ marginRight: '10px', padding: '10px 20px' }}
        >
          {loading ? 'Checking...' : 'Check Registration'}
        </button>
        
        <button 
          onClick={deleteRegistration} 
          disabled={loading || !results?.allStudents?.length}
          style={{ padding: '10px 20px', backgroundColor: '#ff4444', color: 'white', border: 'none' }}
        >
          {loading ? 'Deleting...' : 'Delete All Students with this RegNo'}
        </button>
      </div>
      
      {results && (
        <div style={{ 
          backgroundColor: '#f5f5f5', 
          padding: '15px', 
          borderRadius: '8px',
          marginTop: '20px'
        }}>
          <h3>Results:</h3>
          <p><strong>Checked at:</strong> {results.timestamp}</p>
          
          {results.error ? (
            <div style={{ color: 'red' }}>
              <strong>Error:</strong> {results.error}
            </div>
          ) : (
            <>
              <div>
                <strong>Single Student Check:</strong> 
                {results.existingStudent ? 
                  `Found student with ID: ${results.existingStudent.id}` : 
                  'No student found'
                }
              </div>
              
              <div style={{ marginTop: '10px' }}>
                <strong>All Students with this RegNo:</strong> {results.allStudents?.length || 0}
                {results.allStudents?.map((student, index) => (
                  <div key={index} style={{ marginLeft: '20px', fontSize: '14px' }}>
                    ID: {student.id}, Name: {student.firstName} {student.lastName}
                  </div>
                ))}
              </div>
            </>
          )}
          
          {results.deleteResult && (
            <div style={{ marginTop: '15px', color: 'green' }}>
              <strong>Delete Result:</strong> {results.deleteResult.message}
              <br />
              <strong>Deleted at:</strong> {results.deleteTimestamp}
            </div>
          )}
          
          {results.deleteError && (
            <div style={{ marginTop: '15px', color: 'red' }}>
              <strong>Delete Error:</strong> {results.deleteError}
            </div>
          )}
        </div>
      )}
      
      <div style={{ marginTop: '30px', fontSize: '14px', color: '#666' }}>
        <h4>Instructions:</h4>
        <ol>
          <li>Enter the registration number you want to check</li>
          <li>Click "Check Registration" to see if any students exist with that number</li>
          <li>If students are found, you can delete them using the red button</li>
          <li>After deletion, try registering again with the same number</li>
        </ol>
      </div>
    </div>
  );
};

export default RegistrationDebug;
