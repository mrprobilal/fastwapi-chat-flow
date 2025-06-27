
import React from 'react';
import { Users, MessageSquare, Send, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardCard from '../components/DashboardCard';

const Dashboard = () => {
  const navigate = useNavigate();

  const stats = [
    {
      title: 'Total Customers',
      value: '1,248',
      icon: Users,
      trend: { value: 12, isPositive: true },
      color: 'green' as const,
    },
    {
      title: 'Messages Sent',
      value: '3,492',
      icon: Send,
      trend: { value: 8, isPositive: true },
      color: 'blue' as const,
    },
    {
      title: 'Active Chats',
      value: '127',
      icon: MessageSquare,
      trend: { value: -2, isPositive: false },
      color: 'purple' as const,
    },
    {
      title: 'Delivery Rate',
      value: '98.5%',
      icon: BarChart3,
      trend: { value: 0.5, isPositive: true },
      color: 'orange' as const,
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back! Here's what's happening with your WhatsApp Business.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
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
            {[
              { action: 'New customer added', name: 'John Doe', time: '2 minutes ago' },
              { action: 'Template message sent', name: 'Welcome Campaign', time: '5 minutes ago' },
              { action: 'Customer replied', name: 'Sarah Wilson', time: '12 minutes ago' },
              { action: 'Bulk message completed', name: '250 recipients', time: '1 hour ago' },
            ].map((activity, index) => (
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
              View Analytics
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
