
import React, { useState } from 'react';
import { ArrowUp, MessageSquare, Users, Send, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Onboarding = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  const steps = [
    {
      title: 'Welcome to FastWAPI',
      subtitle: 'Your WhatsApp Business API Solution',
      content: 'FastWAPI helps you manage WhatsApp Business conversations, send template messages, and track analytics in real-time.',
      icon: MessageSquare,
      color: 'text-green-600 bg-green-100',
    },
    {
      title: 'Manage Your Customers',
      subtitle: 'Keep track of all your contacts',
      content: 'Add, organize, and manage all your WhatsApp Business contacts in one place. Track conversation history and customer status.',
      icon: Users,
      color: 'text-blue-600 bg-blue-100',
    },
    {
      title: 'Send Template Messages',
      subtitle: 'Use approved WhatsApp templates',
      content: 'Send approved WhatsApp Business template messages to your customers. Customize variables and track delivery status.',
      icon: Send,
      color: 'text-purple-600 bg-purple-100',
    },
    {
      title: 'Real-time Analytics',
      subtitle: 'Track your performance',
      content: 'Monitor message delivery rates, customer engagement, and business metrics with our real-time dashboard powered by Pusher.',
      icon: BarChart3,
      color: 'text-orange-600 bg-orange-100',
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Mark onboarding as complete
      localStorage.setItem('fastWAPI_onboarding_complete', 'true');
      navigate('/');
    }
  };

  const handleSkip = () => {
    // Mark onboarding as complete
    localStorage.setItem('fastWAPI_onboarding_complete', 'true');
    navigate('/');
  };

  const step = steps[currentStep];
  const Icon = step.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center">
          <div className={`w-16 h-16 rounded-full ${step.color} mx-auto mb-6 flex items-center justify-center`}>
            <Icon className="h-8 w-8" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{step.title}</h1>
          <h2 className="text-lg text-green-600 mb-6">{step.subtitle}</h2>
          
          <p className="text-gray-600 mb-8 leading-relaxed">{step.content}</p>
          
          {/* Progress indicators */}
          <div className="flex justify-center space-x-2 mb-8">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStep ? 'bg-green-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          
          <div className="space-y-3">
            <button
              onClick={handleNext}
              className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
            >
              {currentStep < steps.length - 1 ? 'Next' : 'Get Started'}
              <ArrowUp className="h-4 w-4 rotate-90" />
            </button>
            
            <button
              onClick={handleSkip}
              className="w-full text-gray-500 py-2 px-6 rounded-lg hover:text-gray-700 transition-colors"
            >
              Skip Introduction
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
