import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Login.css';

export default function SignUp() {
  const [form, setForm] = useState({ username: '', email: '', password: '', displayName: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signup(form);
      navigate('/home');
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card pixel-border">
        <h2 className="auth-card__title">SIGN UP</h2>
        <p className="auth-card__subtitle">Join the Sentinel program.</p>

        {error && <div className="auth-card__error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-card__form">
          <div className="auth-card__field">
            <label>Username</label>
            <input name="username" value={form.username} onChange={handleChange} required minLength={3} placeholder="cybersentinel" />
          </div>
          <div className="auth-card__field">
            <label>Display Name</label>
            <input name="displayName" value={form.displayName} onChange={handleChange} placeholder="Your display name" />
          </div>
          <div className="auth-card__field">
            <label>Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} required placeholder="you@example.com" />
          </div>
          <div className="auth-card__field">
            <label>Password (min 8 chars)</label>
            <input name="password" type="password" value={form.password} onChange={handleChange} required minLength={8} placeholder="••••••••" />
          </div>
          <button type="submit" className="auth-card__btn" disabled={loading}>
            {loading ? 'CREATING...' : 'CREATE ACCOUNT'}
          </button>
        </form>

        <p className="auth-card__footer">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
