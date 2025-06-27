import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { MessageSquare, Send, BarChart3, Users, Settings, LogOut, User, Menu, X, Megaphone } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = React.useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: BarChart3 },
    { name: 'Customers', href: '/customers', icon: Users },
    { name: 'Messages', href: '/messages', icon: MessageSquare },
    { name: 'Templates', href: '/templates', icon: Send },
    { name: 'Campaigns', href: '/campaigns', icon: Megaphone },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const closeSidebar = () => {
    if (isMobile) {
      setIsOpen(false);
    }
  };

  if (isMobile) {
    return (
      <>
        {/* Mobile menu button */}
        <button
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-50 bg-white p-2 rounded-lg shadow-lg border border-gray-200 md:hidden"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        {/* Mobile overlay */}
        {isOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={closeSidebar}
          />
        )}

        {/* Mobile sidebar */}
        <div className={`fixed left-0 top-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50 md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-green-600">FastWAPI</h1>
            <p className="text-sm text-gray-500 mt-1">WhatsApp Business API</p>
          </div>
          
          <nav className="mt-6 flex-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={closeSidebar}
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

          {user && (
            <div className="p-4 border-t border-gray-200 mt-auto">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              </div>
              <Button 
                onClick={handleLogout}
                variant="outline" 
                size="sm" 
                className="w-full justify-start text-gray-600 hover:text-red-600 hover:border-red-200"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          )}
        </div>
      </>
    );
  }

  return (
    <div className="w-64 bg-white shadow-lg flex flex-col h-full">
      
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-green-600">FastWAPI</h1>
        <p className="text-sm text-gray-500 mt-1">WhatsApp Business API</p>
      </div>
      
      <nav className="mt-6 flex-1">
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

      {user && (
        <div className="p-4 border-t border-gray-200 mt-auto">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
          <Button 
            onClick={handleLogout}
            variant="outline" 
            size="sm" 
            className="w-full justify-start text-gray-600 hover:text-red-600 hover:border-red-200"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
