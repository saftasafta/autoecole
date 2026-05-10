import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowRight, FiEye, FiEyeOff, FiPlay, FiPause } from 'react-icons/fi';
import { useLanguage } from '../LanguageContext';

const HomeArt = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isHidden, setIsHidden] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const images = [
    '/artistic_driving_scene.png',
    '/car_gearknob_art.png',
    '/scenic_road_sunset.png',
    '/modern_steering_wheel.png'
  ];

  useEffect(() => {
    if (isPaused || isHidden) return;
    const interval = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused, isHidden, images.length]);

  return (
    <div style={{
      height: '100%',
      width: '100%',
      position: 'relative',
      overflow: 'hidden',
      borderRadius: '24px',
      backgroundColor: '#0f172a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {/* Background Slideshow */}
      {!isHidden && images.map((img, idx) => (
        <div
          key={idx}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundImage: `url(${img})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: idx === currentIdx ? 0.6 : 0,
            transition: 'opacity 1.5s ease-in-out',
            filter: 'blur(1px)'
          }}
        />
      ))}

      {/* Decorative Overlay for depth */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(to right, rgba(15,23,42,0.9) 0%, rgba(15,23,42,0.2) 50%, rgba(15,23,42,0.9) 100%)',
        zIndex: 1
      }} />

      {/* Content */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        textAlign: 'center',
        color: 'white',
        maxWidth: '900px',
        padding: '2rem'
      }}>
        <h1 style={{ fontSize: '3.5rem', fontWeight: '900', marginBottom: '1.5rem', letterSpacing: '-0.025em', lineHeight: '1.2' }}>
          {t('art_of_driving')}
        </h1>
        <p style={{ fontSize: '1.4rem', opacity: 0.9, marginBottom: '3rem', fontWeight: '500', lineHeight: '1.6' }}>
          {t('art_desc')}
        </p>
        
        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', alignItems: 'center' }}>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn btn-primary"
            style={{ 
              padding: '1rem 2.5rem', 
              fontSize: '1.1rem', 
              borderRadius: '50px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem',
              boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.5)'
            }}
          >
            {t('continue') || (document.documentElement.lang === 'ar' ? 'استمرار' : 'Continuer')} <FiArrowRight />
          </button>
        </div>
      </div>

      {/* Control Floating Buttons */}
      <div style={{
        position: 'absolute',
        bottom: '2rem',
        left: '2rem',
        display: 'flex',
        gap: '1rem',
        zIndex: 20
      }}>
        <button 
          onClick={() => setIsHidden(!isHidden)}
          style={{ 
            width: '48px', height: '48px', borderRadius: '50%', 
            backgroundColor: 'rgba(255,255,255,0.1)', color: 'white',
            border: '1px solid rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', backdropFilter: 'blur(10px)', transition: '0.3s'
          }}
          title={isHidden ? "Show Images" : "Hide Images"}
        >
          {isHidden ? <FiEye /> : <FiEyeOff />}
        </button>
        <button 
          onClick={() => setIsPaused(!isPaused)}
          style={{ 
            width: '48px', height: '48px', borderRadius: '50%', 
            backgroundColor: 'rgba(255,255,255,0.1)', color: 'white',
            border: '1px solid rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', backdropFilter: 'blur(10px)', transition: '0.3s'
          }}
          disabled={isHidden}
          title={isPaused ? "Play Slideshow" : "Pause Slideshow"}
        >
          {isPaused ? <FiPlay /> : <FiPause />}
        </button>
      </div>

      <style>{`
        .btn-primary:hover { transform: translateY(-2px); }
      `}</style>
    </div>
  );
};

export default HomeArt;
