
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MessageSquare, Send, BarChart3, Users, Settings } from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: BarChart3 },
    { name: 'Customers', href: '/customers', icon: Users },
    { name: 'Messages', href: '/messages', icon: MessageSquare },
    { name: 'Templates', href: '/templates', icon: Send },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <div className="w-64 bg-white shadow-lg">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-green-600">FastWAPI</h1>
        <p className="text-sm text-gray-500 mt-1">WhatsApp Business API</p>
      </div>
      
      <nav className="mt-6">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? 'text-green-600 bg-green-50 border-r-2 border-green-600'
                  : 'text-gray-600 hover:text-green-600 hover:bg-gray-50'
              }`}
            >
              <Icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;
