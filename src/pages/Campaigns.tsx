import React, { useState } from 'react';
import { Send, Users, Upload, Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const Campaigns = () => {
  const [campaigns, setCampaigns] = useState([
    { id: 1, name: 'Summer Sale', template: 'Welcome Message', recipients: 150, status: 'Sent', date: '2024-06-25' },
    { id: 2, name: 'New Product Launch', template: 'Order Confirmation', recipients: 89, status: 'Draft', date: '2024-06-24' },
  ]);

  const [groups, setGroups] = useState([
    { id: 1, name: 'VIP Customers', count: 45 },
    { id: 2, name: 'Regular Customers', count: 120 },
    { id: 3, name: 'New Customers', count: 30 },
  ]);

  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    template: '',
    recipients: 'all',
    selectedGroups: []
  });
  const [groupForm, setGroupForm] = useState({ name: '', description: '' });

  const templates = [
    { id: 1, name: 'Welcome Message' },
    { id: 2, name: 'Order Confirmation' },
    { id: 3, name: 'Appointment Reminder' },
  ];

  const handleCreateCampaign = async () => {
    if (!campaignForm.name || !campaignForm.template) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const response = await fetch('https://fastwapi.com/api/create-campaign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(campaignForm)
      });

      if (response.ok) {
        toast.success('Campaign created successfully!');
        setShowCampaignModal(false);
        setCampaignForm({ name: '', template: '', recipients: 'all', selectedGroups: [] });
      } else {
        toast.error('Failed to create campaign');
      }
    } catch (error) {
      console.error('Campaign creation error:', error);
      toast.error('Failed to create campaign');
    }
  };

  const handleEditGroup = (group: any) => {
    setSelectedGroup(group);
    setGroupForm({ name: group.name, description: group.description || '' });
    setShowGroupModal(true);
  };

  const handleSaveGroup = () => {
    if (selectedGroup) {
      setGroups(groups.map(g => g.id === selectedGroup.id ? { ...g, ...groupForm } : g));
      toast.success('Group updated successfully!');
    } else {
      const newGroup = { 
        id: Math.floor(Math.random() * 10000), 
        name: groupForm.name, 
        description: groupForm.description, 
        count: 0 
      };
      setGroups([...groups, newGroup]);
      toast.success('Group created successfully!');
    }
    setShowGroupModal(false);
    setSelectedGroup(null);
    setGroupForm({ name: '', description: '' });
  };

  const handleImportNumbers = () => {
    toast.success('Numbers imported successfully!');
    setShowImportModal(false);
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Campaigns</h1>
          <p className="text-gray-600 mt-2">Create and manage your marketing campaigns</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <button 
            onClick={() => setShowImportModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Import Numbers
          </button>
          <button 
            onClick={() => setShowCampaignModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Campaign
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Groups Management */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Customer Groups</h3>
            <button 
              onClick={() => {
                setSelectedGroup(null);
                setGroupForm({ name: '', description: '' });
                setShowGroupModal(true);
              }}
              className="text-green-600 hover:text-green-700"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {groups.map((group) => (
              <div key={group.id} className="p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{group.name}</h4>
                    <p className="text-xs text-gray-500">{group.count} customers</p>
                  </div>
                  <button 
                    onClick={() => handleEditGroup(group)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Campaign List */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Campaigns</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="p-6 hover:bg-gray-50">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{campaign.name}</h4>
                    <p className="text-xs text-gray-500 mt-1">Template: {campaign.template}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs text-gray-500">
                        <Users className="h-3 w-3 inline mr-1" />
                        {campaign.recipients} recipients
                      </span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        campaign.status === 'Sent' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {campaign.status}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">{campaign.date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Create Campaign Modal */}
      {showCampaignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Create New Campaign</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name</label>
                <input
                  type="text"
                  value={campaignForm.name}
                  onChange={(e) => setCampaignForm({...campaignForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter campaign name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Template</label>
                <select
                  value={campaignForm.template}
                  onChange={(e) => setCampaignForm({...campaignForm, template: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select template</option>
                  {templates.map(template => (
                    <option key={template.id} value={template.name}>{template.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Recipients</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="recipients"
                      value="all"
                      checked={campaignForm.recipients === 'all'}
                      onChange={(e) => setCampaignForm({...campaignForm, recipients: e.target.value})}
                      className="mr-2"
                    />
                    <span className="text-sm">All Customers</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="recipients"
                      value="groups"
                      checked={campaignForm.recipients === 'groups'}
                      onChange={(e) => setCampaignForm({...campaignForm, recipients: e.target.value})}
                      className="mr-2"
                    />
                    <span className="text-sm">Selected Groups</span>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCampaignModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCampaign}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
              >
                Create Campaign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Group Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {selectedGroup ? 'Edit Group' : 'Create New Group'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
                <input
                  type="text"
                  value={groupForm.name}
                  onChange={(e) => setGroupForm({...groupForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter group name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={groupForm.description}
                  onChange={(e) => setGroupForm({...groupForm, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter group description"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowGroupModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveGroup}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
              >
                {selectedGroup ? 'Update' : 'Create'} Group
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Numbers Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Import Phone Numbers</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload CSV File</label>
                <input
                  type="file"
                  accept=".csv"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">CSV should contain phone numbers in the first column</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Group</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                  <option value="">Select group</option>
                  {groups.map(group => (
                    <option key={group.id} value={group.id}>{group.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleImportNumbers}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
              >
                Import Numbers
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Campaigns;
