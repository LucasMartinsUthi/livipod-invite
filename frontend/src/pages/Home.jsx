import { useEffect, useState } from 'react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useNavigate, useSearchParams } from 'react-router-dom';

const API_URL = 'http://localhost:3001';

export default function Home() {
  const [user, setUser] = useState(null);
  const [inviteUrl, setInviteUrl] = useState('');
  const [message, setMessage] = useState('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        checkInvite(currentUser);
      } else {
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, [navigate, searchParams]);

  const checkInvite = async (currentUser) => {
    const inviteId = searchParams.get('invite');

    if (inviteId) {
      try {
        // Accept invite
        const response = await fetch(`${API_URL}/api/invite/accept`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            inviteId,
            userId: currentUser.uid,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          setMessage(`Successfully connected with invite ${inviteId}!`);
        } else {
          setMessage(`Error: ${data.error}`);
        }
      } catch (error) {
        setMessage(`Error accepting invite: ${error.message}`);
      }
    }
  };

  const createInvite = async () => {
    try {
      const response = await fetch(`${API_URL}/api/invite/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid }),
      });

      const data = await response.json();

      if (response.ok) {
        const url = `http://localhost:5173?invite=${data.inviteId}`;
        setInviteUrl(url);
        setMessage('Invite created successfully!');
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`Error creating invite: ${error.message}`);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const handleOpenInApp = () => {
    window.location.href = 'livipod://invite';
  };

  if (!user) return null;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1>Welcome!</h1>
        <p>Email: {user.email}</p>
        <p>UID: {user.uid}</p>

        {message && <p style={styles.message}>{message}</p>}

        <button onClick={createInvite} style={styles.button}>
          Create Invite Link
        </button>

        {inviteUrl && (
          <div style={styles.inviteBox}>
            <p>Share this link:</p>
            <input
              type="text"
              value={inviteUrl}
              readOnly
              style={styles.input}
              onClick={(e) => e.target.select()}
            />
          </div>
        )}

        <button
          onClick={handleOpenInApp}
          style={styles.openAppButton}
          type="button"
        >
          📱 Open in LiviPod App
        </button>

        <button onClick={handleLogout} style={{...styles.button, ...styles.logoutButton}}>
          Logout
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
  },
  card: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '500px',
  },
  button: {
    padding: '0.75rem',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    cursor: 'pointer',
    marginTop: '1rem',
    width: '100%',
  },
  logoutButton: {
    backgroundColor: '#dc3545',
  },
  message: {
    padding: '0.75rem',
    backgroundColor: '#d4edda',
    border: '1px solid #c3e6cb',
    borderRadius: '4px',
    color: '#155724',
    marginTop: '1rem',
  },
  inviteBox: {
    marginTop: '1rem',
    padding: '1rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
  },
  input: {
    width: '100%',
    padding: '0.5rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    marginTop: '0.5rem',
  },
  openAppButton: {
    width: '100%',
    padding: '0.75rem',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    cursor: 'pointer',
    marginTop: '1rem',
  },
};
