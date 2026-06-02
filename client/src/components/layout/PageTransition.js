import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { playPageTransition } from '../../utils/synthSounds';
import './PageTransition.css';

export default function PageTransition({ children }) {
  const location = useLocation();
  const [transitionClass, setTransitionClass] = useState('page-transition--enter');
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayType, setOverlayType] = useState('default');

  useEffect(() => {
    // Determine transition type based on route
    const path = location.pathname;
    let type = 'default';
    if (path.includes('/fight')) type = 'battle';
    else if (path.includes('/debrief')) type = 'debrief';

    setOverlayType(type);
    setTransitionClass('page-transition--exit');
    setShowOverlay(true);
    playPageTransition();

    const timer1 = setTimeout(() => {
      setTransitionClass('page-transition--enter');
    }, 150);

    const timer2 = setTimeout(() => {
      setShowOverlay(false);
    }, type === 'battle' ? 600 : type === 'debrief' ? 800 : 300);

    return () => { clearTimeout(timer1); clearTimeout(timer2); };
  }, [location.pathname]);

  return (
    <div className={`page-transition ${transitionClass}`}>
      {showOverlay && (
        <div className={`page-transition__overlay page-transition__overlay--${overlayType}`}>
          {overlayType === 'battle' && <span className="page-transition__vs">VS</span>}
          {overlayType === 'debrief' && <span className="page-transition__victory">MISSION COMPLETE</span>}
        </div>
      )}
      {children}
    </div>
  );
}
