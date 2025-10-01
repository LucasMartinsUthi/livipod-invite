import { useState, useEffect } from 'react';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Initialize reCAPTCHA
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved
        },
      });
    }

    return () => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    };
  }, []);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const appVerifier = window.recaptchaVerifier;
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      setConfirmationResult(confirmation);
      setError('OTP sent to your phone!');
    } catch (err) {
      setError(err.message);
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await confirmationResult.confirm(otp);
      navigate('/');
    } catch (err) {
      setError('Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = fullName.trim() && phoneNumber.trim() && agreedToPrivacy && agreedToTerms;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1>Create an Account</h1>
        <p style={styles.subtitle}>After creating your account, you can start using the app</p>

        {!confirmationResult ? (
          <form onSubmit={handleSendOTP} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Full Name *</label>
              <input
                type="text"
                placeholder="Steve Jobs"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Email</label>
              <input
                type="email"
                placeholder="steve@apple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Phone Number *</label>
              <input
                type="tel"
                placeholder="+1234567890"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.checkboxContainer}>
              <input
                type="checkbox"
                id="privacy"
                checked={agreedToPrivacy}
                onChange={(e) => setAgreedToPrivacy(e.target.checked)}
                style={styles.checkbox}
              />
              <label htmlFor="privacy" style={styles.checkboxLabel}>
                I have read and agree to the <span style={styles.link}>Privacy Policy</span>
              </label>
            </div>

            <div style={styles.checkboxContainer}>
              <input
                type="checkbox"
                id="terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                style={styles.checkbox}
              />
              <label htmlFor="terms" style={styles.checkboxLabel}>
                I have read and agree to the <span style={styles.link}>Terms of Service</span>
              </label>
            </div>

            {error && <p style={styles.error}>{error}</p>}
            <button
              type="submit"
              disabled={loading || !isFormValid}
              style={{
                ...styles.button,
                opacity: !isFormValid ? 0.5 : 1,
                cursor: !isFormValid ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Sending...' : 'Continue →'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Enter OTP</label>
              <input
                type="text"
                placeholder="Enter 6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                style={styles.input}
                required
                maxLength={6}
              />
            </div>
            {error && <p style={styles.error}>{error}</p>}
            <button type="submit" disabled={loading} style={styles.button}>
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
          </form>
        )}
        <p style={styles.linkText}>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
      <div id="recaptcha-container"></div>
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
  subtitle: {
    textAlign: 'center',
    color: '#666',
    fontSize: '0.9rem',
    marginBottom: '1.5rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    fontSize: '0.9rem',
    fontWeight: '500',
    color: '#333',
  },
  input: {
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem',
  },
  checkboxContainer: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.5rem',
    marginTop: '0.5rem',
  },
  checkbox: {
    marginTop: '4px',
    width: '18px',
    height: '18px',
    cursor: 'pointer',
  },
  checkboxLabel: {
    fontSize: '0.9rem',
    color: '#333',
    cursor: 'pointer',
  },
  button: {
    padding: '0.75rem',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    cursor: 'pointer',
    marginTop: '0.5rem',
  },
  error: {
    color: 'red',
    fontSize: '0.875rem',
  },
  link: {
    color: '#007bff',
    cursor: 'pointer',
    textDecoration: 'none',
  },
  linkText: {
    marginTop: '1rem',
    textAlign: 'center',
  },
};
