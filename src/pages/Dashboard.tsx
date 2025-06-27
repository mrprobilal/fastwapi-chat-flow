
import React, { useState, useEffect } from 'react';
import { Users, MessageSquare, Send, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardCard from '../components/DashboardCard';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalCustomers: 0,
    messagesSent: 0,
    activeChats: 0,
    deliveryRate: '0%'
  });

  useEffect(() => {
    // Load real data from localStorage
    const loadStats = () => {
      const savedCustomers = localStorage.getItem('whatsapp-customers');
      const savedChats = localStorage.getItem('whatsapp-chats');
      const savedMessages = localStorage.getItem('whatsapp-messages');
      
      let totalCustomers = 0;
      let messagesSent = 0;
      let activeChats = 0;
      let deliveryRate = '0%';
      
      if (savedCustomers) {
        const customers = JSON.parse(savedCustomers);
        totalCustomers = customers.length;
      }
      
      if (savedChats) {
        const chats = JSON.parse(savedChats);
        activeChats = chats.length;
      }
      
      if (savedMessages) {
        const messages = JSON.parse(savedMessages);
        messagesSent = messages.filter(msg => msg.type === 'sent' || msg.from === 'business').length;
        
        // Calculate delivery rate
        const sentMessages = messages.filter(msg => msg.type === 'sent' || msg.from === 'business');
        const deliveredMessages = sentMessages.filter(msg => msg.status === 'sent' || !msg.status);
        if (sentMessages.length > 0) {
          deliveryRate = `${Math.round((deliveredMessages.length / sentMessages.length) * 100)}%`;
        }
      }
      
      setStats({
        totalCustomers,
        messagesSent,
        activeChats,
        deliveryRate
      });
    };

    loadStats();
    
    // Refresh stats every 5 seconds
    const interval = setInterval(loadStats, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const dashboardStats = [
    {
      title: 'Total Customers',
      value: stats.totalCustomers.toString(),
      icon: Users,
      trend: { value: 12, isPositive: true },
      color: 'green' as const,
    },
    {
      title: 'Messages Sent',
      value: stats.messagesSent.toString(),
      icon: Send,
      trend: { value: 8, isPositive: true },
      color: 'blue' as const,
    },
    {
      title: 'Active Chats',
      value: stats.activeChats.toString(),
      icon: MessageSquare,
      trend: { value: -2, isPositive: false },
      color: 'purple' as const,
    },
    {
      title: 'Delivery Rate',
      value: stats.deliveryRate,
      icon: BarChart3,
      trend: { value: 0.5, isPositive: true },
      color: 'orange' as const,
    },
  ];

  // Load recent activity
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    const loadRecentActivity = () => {
      const savedMessages = localStorage.getItem('whatsapp-messages');
      const savedCustomers = localStorage.getItem('whatsapp-customers');
      
      const activities = [];
      
      if (savedCustomers) {
        const customers = JSON.parse(savedCustomers);
        const recentCustomers = customers.slice(-3);
        recentCustomers.forEach(customer => {
          activities.push({
            action: 'New customer added',
            name: customer.name,
            time: 'Recently'
          });
        });
      }
      
      if (savedMessages) {
        const messages = JSON.parse(savedMessages);
        const recentMessages = messages
          .filter(msg => msg.type === 'received' || msg.from !== 'business')
          .slice(-2);
        
        recentMessages.forEach(msg => {
          activities.push({
            action: 'Message received',
            name: msg.contact_name || msg.from || 'Customer',
            time: new Date(msg.timestamp).toLocaleString()
          });
        });
      }
      
      // Add some default activities if none exist
      if (activities.length === 0) {
        activities.push(
          { action: 'Welcome to Dashboard', name: 'Start by adding customers', time: 'Now' },
          { action: 'Connect WhatsApp API', name: 'Go to Settings', time: 'Next' }
        );
      }
      
      setRecentActivity(activities.slice(0, 4));
    };

    loadRecentActivity();
    
    // Refresh activity every 10 seconds
    const interval = setInterval(loadRecentActivity, 10000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back! Here's what's happening with your WhatsApp Business.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {dashboardStats.map((stat) => (
          <DashboardCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            trend={stat.trend}
            color={stat.color}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-sm text-gray-500">{activity.name}</p>
                </div>
                <p className="text-xs text-gray-400">{activity.time}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button 
              onClick={() => navigate('/templates')}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            >
              Send Template Message
            </button>
            <button 
              onClick={() => navigate('/customers')}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Add New Customer
            </button>
            <button 
              onClick={() => navigate('/messages')}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
            >
              View Messages
            </button>
            <button 
              onClick={() => navigate('/settings')}
              className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              API Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
