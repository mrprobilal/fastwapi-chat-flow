
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user has seen onboarding
    const hasSeenOnboarding = localStorage.getItem('fastWAPI_onboarding_complete');
    
    if (!hasSeenOnboarding) {
      navigate('/onboarding');
    }
  }, [navigate]);

  // This component won't render since we redirect to onboarding or dashboard
  return null;
};

export default Index;
