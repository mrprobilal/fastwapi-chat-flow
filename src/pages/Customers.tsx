
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Search, Phone, Mail, MessageCircle, RefreshCw, Upload, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  group: string;
  status: 'active' | 'inactive';
  lastMessage: string;
}

interface CustomerGroup {
  id: string;
  name: string;
  description: string;
  customerCount: number;
}

const Customers = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerGroups, setCustomerGroups] = useState<CustomerGroup[]>([
    { id: '1', name: 'VIP', description: 'VIP Customers', customerCount: 0 },
    { id: '2', name: 'Regular', description: 'Regular Customers', customerCount: 0 },
    { id: '3', name: 'Premium', description: 'Premium Customers', customerCount: 0 },
    { id: '4', name: 'New', description: 'New Customers', customerCount: 0 }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    group: ''
  });
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: ''
  });

  // Load customers from localStorage on component mount
  useEffect(() => {
    const savedCustomers = localStorage.getItem('whatsapp-customers');
    const savedGroups = localStorage.getItem('whatsapp-groups');
    
    if (savedCustomers) {
      setCustomers(JSON.parse(savedCustomers));
    }
    if (savedGroups) {
      setCustomerGroups(JSON.parse(savedGroups));
    }
  }, []);

  // Save customers to localStorage whenever customers change
  useEffect(() => {
    localStorage.setItem('whatsapp-customers', JSON.stringify(customers));
  }, [customers]);

  // Save groups to localStorage whenever groups change
  useEffect(() => {
    localStorage.setItem('whatsapp-groups', JSON.stringify(customerGroups));
  }, [customerGroups]);

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSyncContacts = async () => {
    setIsSyncing(true);
    try {
      const settings = JSON.parse(localStorage.getItem('fastwapi-settings') || '{}');
      const authToken = localStorage.getItem('auth_token');
      
      if (!settings.accessToken || !settings.businessId) {
        toast.error('Please configure your WhatsApp API settings first');
        setIsSyncing(false);
        return;
      }

      // Try direct WhatsApp Business API first
      try {
        const response = await fetch(`https://graph.facebook.com/v18.0/${settings.businessId}/contacts`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${settings.accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Contacts synced from WhatsApp:', data);
          
          if (data.data && data.data.length > 0) {
            const syncedCustomers = data.data.map((contact, index) => ({
              id: contact.wa_id || `sync_${Date.now()}_${index}`,
              name: contact.profile?.name || contact.name || 'Unknown Contact',
              phone: contact.wa_id || contact.phone,
              email: '',
              group: 'Synced',
              status: 'active' as const,
              lastMessage: 'Never'
            }));
            setCustomers(prev => [...prev, ...syncedCustomers]);
            toast.success(`Synced ${syncedCustomers.length} contacts from WhatsApp Business!`);
          } else {
            toast.info('No contacts found in WhatsApp Business account');
          }
        } else {
          throw new Error(`WhatsApp API Error: ${response.status}`);
        }
      } catch (whatsappError) {
        console.log('WhatsApp sync failed, trying FastWAPI:', whatsappError);
        
        // Fallback to FastWAPI
        const response = await fetch('https://fastwapi.com/api/contacts', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Contacts synced from FastWAPI:', data);
          
          if (data.contacts && data.contacts.length > 0) {
            const syncedCustomers = data.contacts.map((contact, index) => ({
              id: contact.id || `fastwapi_${Date.now()}_${index}`,
              name: contact.name || contact.profile?.name || 'Unknown',
              phone: contact.wa_id || contact.phone,
              email: contact.email || '',
              group: 'Synced',
              status: 'active' as const,
              lastMessage: 'Never'
            }));
            setCustomers(prev => [...prev, ...syncedCustomers]);
            toast.success(`Synced ${syncedCustomers.length} contacts!`);
          } else {
            toast.info('No contacts found to sync');
          }
        } else {
          throw new Error(`FastWAPI Error: ${response.status}`);
        }
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Failed to sync contacts. Please check your settings and try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncGroups = async () => {
    try {
      const authToken = localStorage.getItem('auth_token');
      
      const response = await fetch('https://fastwapi.com/api/groups', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Groups synced:', data);
        
        if (data.groups && data.groups.length > 0) {
          const syncedGroups = data.groups.map((group, index) => ({
            id: group.id || `group_${Date.now()}_${index}`,
            name: group.name || `Group ${index + 1}`,
            description: group.description || 'Synced from website',
            customerCount: group.member_count || 0
          }));
          setCustomerGroups(prev => [...prev, ...syncedGroups]);
          toast.success(`Synced ${syncedGroups.length} groups!`);
        } else {
          toast.info('No groups found to sync');
        }
      } else {
        toast.error('Failed to sync groups');
      }
    } catch (error) {
      console.error('Group sync error:', error);
      toast.error('Failed to sync groups');
    }
  };

  const handleAddGroup = () => {
    if (!newGroup.name.trim()) {
      toast.error('Please enter a group name');
      return;
    }

    const group: CustomerGroup = {
      id: Date.now().toString(),
      name: newGroup.name,
      description: newGroup.description,
      customerCount: 0
    };

    setCustomerGroups([...customerGroups, group]);
    setNewGroup({ name: '', description: '' });
    setIsGroupDialogOpen(false);
    toast.success('Group created successfully');
  };

  const handleImportFromCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const csv = e.target?.result as string;
      const lines = csv.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const nameIndex = headers.findIndex(h => h.includes('name'));
      const phoneIndex = headers.findIndex(h => h.includes('phone') || h.includes('number'));
      const emailIndex = headers.findIndex(h => h.includes('email'));
      
      const importedCustomers: Customer[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length >= 2 && values[phoneIndex]) {
          importedCustomers.push({
            id: `import_${Date.now()}_${i}`,
            name: values[nameIndex] || `Customer ${i}`,
            phone: values[phoneIndex],
            email: values[emailIndex] || '',
            group: 'Imported',
            status: 'active',
            lastMessage: 'Never'
          });
        }
      }
      
      setCustomers(prev => [...prev, ...importedCustomers]);
      setIsImportDialogOpen(false);
      toast.success(`Imported ${importedCustomers.length} customers successfully!`);
    };
    
    reader.readAsText(file);
  };

  const handleAddCustomer = () => {
    if (!newCustomer.name || !newCustomer.phone || !newCustomer.group) {
      toast.error('Please fill in all required fields');
      return;
    }

    const customer: Customer = {
      id: Date.now().toString(),
      name: newCustomer.name,
      phone: newCustomer.phone,
      email: newCustomer.email,
      group: newCustomer.group,
      status: 'active',
      lastMessage: 'Never'
    };

    setCustomers([...customers, customer]);
    setNewCustomer({ name: '', phone: '', email: '', group: '' });
    setIsAddDialogOpen(false);
    toast.success('Customer added successfully');
  };

  const handleStartChat = (customer: Customer) => {
    navigate('/messages', { state: { selectedCustomer: customer } });
    toast.success(`Opening chat with ${customer.name}`);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600 mt-2">Manage your WhatsApp contacts and groups</p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={handleSyncContacts}
            disabled={isSyncing}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync Contacts'}
          </button>

          <button
            onClick={handleSyncGroups}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            Sync Groups
          </button>
          
          <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <UserPlus className="h-4 w-4 mr-2" />
                Create Group
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Customer Group</DialogTitle>
                <DialogDescription>
                  Create a new group to organize your customers
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="groupName">Group Name *</Label>
                  <Input
                    id="groupName"
                    value={newGroup.name}
                    onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                    placeholder="Enter group name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="groupDescription">Description</Label>
                  <Input
                    id="groupDescription"
                    value={newGroup.description}
                    onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                    placeholder="Enter group description"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsGroupDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddGroup} className="bg-green-600 hover:bg-green-700">
                  Create Group
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Import CSV
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import Customers from CSV</DialogTitle>
                <DialogDescription>
                  Upload a CSV file with customer data. Expected columns: Name, Phone, Email
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleImportFromCSV}
                  className="w-full"
                />
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Customer
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Customer</DialogTitle>
                <DialogDescription>
                  Add a new customer to your WhatsApp contact list and assign them to a group.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                    placeholder="Enter customer name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    placeholder="+1234567890"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                    placeholder="customer@example.com"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="group">Customer Group *</Label>
                  <Select value={newCustomer.group} onValueChange={(value) => setNewCustomer({ ...newCustomer, group: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a group" />
                    </SelectTrigger>
                    <SelectContent>
                      {customerGroups.map((group) => (
                        <SelectItem key={group.id} value={group.name}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddCustomer} className="bg-green-600 hover:bg-green-700">
                  Add Customer
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <div className="h-2 w-2 bg-green-500 rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.filter(c => c.status === 'active').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">VIP Customers</CardTitle>
            <div className="h-2 w-2 bg-yellow-500 rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.filter(c => c.group === 'VIP').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Groups</CardTitle>
            <div className="h-2 w-2 bg-blue-500 rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customerGroups.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Customer List</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Message</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3 text-gray-400" />
                        <span className="text-sm">{customer.phone}</span>
                      </div>
                      {customer.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3 text-gray-400" />
                          <span className="text-sm text-gray-500">{customer.email}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={customer.group === 'VIP' ? 'default' : 'secondary'}>
                      {customer.group}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={customer.status === 'active' ? 'default' : 'secondary'}>
                      {customer.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">{customer.lastMessage}</TableCell>
                  <TableCell>
                    <Button
                      onClick={() => handleStartChat(customer)}
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <MessageCircle className="h-3 w-3" />
                      Chat
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Customers;
