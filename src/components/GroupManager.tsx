
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Plus, Edit2, Trash2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

interface CustomerGroup {
  id: string;
  name: string;
  description: string;
  customerCount: number;
}

const GroupManager = () => {
  const [customerGroups, setCustomerGroups] = useState<CustomerGroup[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<CustomerGroup | null>(null);
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: ''
  });

  // Load groups from localStorage
  useEffect(() => {
    const savedGroups = localStorage.getItem('whatsapp-groups');
    if (savedGroups) {
      setCustomerGroups(JSON.parse(savedGroups));
    } else {
      // Set default groups if none exist
      const defaultGroups = [
        { id: '1', name: 'VIP', description: 'VIP Customers', customerCount: 0 },
        { id: '2', name: 'Regular', description: 'Regular Customers', customerCount: 0 },
        { id: '3', name: 'Premium', description: 'Premium Customers', customerCount: 0 },
        { id: '4', name: 'New', description: 'New Customers', customerCount: 0 }
      ];
      setCustomerGroups(defaultGroups);
      localStorage.setItem('whatsapp-groups', JSON.stringify(defaultGroups));
    }
  }, []);

  // Save groups to localStorage whenever groups change
  useEffect(() => {
    localStorage.setItem('whatsapp-groups', JSON.stringify(customerGroups));
  }, [customerGroups]);

  // Update customer counts
  useEffect(() => {
    const updateCustomerCounts = () => {
      const savedCustomers = localStorage.getItem('whatsapp-customers');
      if (savedCustomers) {
        const customers = JSON.parse(savedCustomers);
        const updatedGroups = customerGroups.map(group => ({
          ...group,
          customerCount: customers.filter(customer => customer.group === group.name).length
        }));
        setCustomerGroups(updatedGroups);
      }
    };

    updateCustomerCounts();
  }, []);

  const handleCreateGroup = () => {
    if (!newGroup.name.trim()) {
      toast.error('Please enter a group name');
      return;
    }

    // Check if group name already exists
    if (customerGroups.some(group => group.name.toLowerCase() === newGroup.name.toLowerCase())) {
      toast.error('Group name already exists');
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
    setIsCreateDialogOpen(false);
    toast.success('Group created successfully');
  };

  const handleEditGroup = (group: CustomerGroup) => {
    setEditingGroup(group);
    setNewGroup({ name: group.name, description: group.description });
    setIsEditDialogOpen(true);
  };

  const handleUpdateGroup = () => {
    if (!newGroup.name.trim()) {
      toast.error('Please enter a group name');
      return;
    }

    if (!editingGroup) return;

    // Check if group name already exists (excluding current group)
    if (customerGroups.some(group => 
      group.id !== editingGroup.id && 
      group.name.toLowerCase() === newGroup.name.toLowerCase()
    )) {
      toast.error('Group name already exists');
      return;
    }

    const updatedGroups = customerGroups.map(group =>
      group.id === editingGroup.id
        ? { ...group, name: newGroup.name, description: newGroup.description }
        : group
    );

    // Update customers with the new group name if it changed
    if (editingGroup.name !== newGroup.name) {
      const savedCustomers = localStorage.getItem('whatsapp-customers');
      if (savedCustomers) {
        const customers = JSON.parse(savedCustomers);
        const updatedCustomers = customers.map(customer =>
          customer.group === editingGroup.name
            ? { ...customer, group: newGroup.name }
            : customer
        );
        localStorage.setItem('whatsapp-customers', JSON.stringify(updatedCustomers));
      }
    }

    setCustomerGroups(updatedGroups);
    setNewGroup({ name: '', description: '' });
    setEditingGroup(null);
    setIsEditDialogOpen(false);
    toast.success('Group updated successfully');
  };

  const handleDeleteGroup = (groupId: string) => {
    const groupToDelete = customerGroups.find(group => group.id === groupId);
    if (!groupToDelete) return;

    if (groupToDelete.customerCount > 0) {
      toast.error('Cannot delete group with customers. Please move customers to another group first.');
      return;
    }

    const updatedGroups = customerGroups.filter(group => group.id !== groupId);
    setCustomerGroups(updatedGroups);
    toast.success('Group deleted successfully');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Customer Groups
          </CardTitle>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700" size="sm">
                <Plus className="h-4 w-4 mr-2" />
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
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateGroup} className="bg-green-600 hover:bg-green-700">
                  Create Group
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Group Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Customers</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customerGroups.map((group) => (
                <TableRow key={group.id}>
                  <TableCell className="font-medium">{group.name}</TableCell>
                  <TableCell className="text-gray-500">{group.description || 'No description'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <UserPlus className="h-4 w-4 text-gray-400" />
                      <span>{group.customerCount}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => handleEditGroup(group)}
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-1"
                      >
                        <Edit2 className="h-3 w-3" />
                        Edit
                      </Button>
                      <Button
                        onClick={() => handleDeleteGroup(group.id)}
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                        disabled={group.customerCount > 0}
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Edit Group Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Customer Group</DialogTitle>
              <DialogDescription>
                Update the group name and description
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="editGroupName">Group Name *</Label>
                <Input
                  id="editGroupName"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                  placeholder="Enter group name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="editGroupDescription">Description</Label>
                <Input
                  id="editGroupDescription"
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                  placeholder="Enter group description"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateGroup} className="bg-green-600 hover:bg-green-700">
                Update Group
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default GroupManager;
