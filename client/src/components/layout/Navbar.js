import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar__inner">
        <Link to={user ? '/home' : '/'} className="navbar__logo">
          <span className="navbar__logo-text">SENTINEL SG</span>
        </Link>

        <div className="navbar__center">
          <Link to="/game" className="navbar__link navbar__link--game">GAME</Link>
          <Link to="/threats" className="navbar__link navbar__link--threats">THREAT BRIEFING</Link>
          <Link to="/factcheck" className="navbar__link navbar__link--factcheck">FACT-CHECKER</Link>
          <Link to="/about" className="navbar__link">ABOUT</Link>
        </div>

        <div className="navbar__auth">
          {user ? (
            <>
              <Link to="/home" className="navbar__user-badge">
                <span className="navbar__user-icon">🛡️</span>
                <span className="navbar__user-name">{user.display_name || user.username}</span>
              </Link>
              <button onClick={handleLogout} className="navbar__btn navbar__btn--outline">LOG OUT</button>
            </>
          ) : (
            <>
              <Link to="/login" className="navbar__btn navbar__btn--outline">LOG IN</Link>
              <Link to="/signup" className="navbar__btn navbar__btn--primary">SIGN UP</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
