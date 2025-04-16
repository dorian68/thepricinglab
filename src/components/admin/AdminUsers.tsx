
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileDown, Search, Filter, Calendar, User, Clock, BookOpen } from 'lucide-react';
import { safeTranslate } from '../../utils/translationUtils';

// Mock user data - in a real application, this would come from an API
const mockUsers = [
  { id: 1, name: 'John Doe', email: 'john@example.com', registered: '2024-01-15', lastActive: '2024-04-10', completedModules: 8, timeSpent: '12h 30m' },
  { id: 2, name: 'Alice Smith', email: 'alice@example.com', registered: '2024-02-20', lastActive: '2024-04-12', completedModules: 5, timeSpent: '8h 15m' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', registered: '2024-03-05', lastActive: '2024-04-08', completedModules: 3, timeSpent: '5h 45m' },
  { id: 4, name: 'Emma Davis', email: 'emma@example.com', registered: '2024-03-18', lastActive: '2024-04-14', completedModules: 7, timeSpent: '11h 20m' },
  { id: 5, name: 'Michael Wilson', email: 'michael@example.com', registered: '2024-04-01', lastActive: '2024-04-13', completedModules: 2, timeSpent: '3h 10m' },
];

const AdminUsers = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState(mockUsers);
  
  const handleExportCSV = () => {
    // In a real application, this would generate and download a CSV file
    console.log('Exporting user data to CSV');
    alert('User data exported to CSV (mock functionality)');
  };
  
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-finance-accent">
          {safeTranslate(t, 'admin.userManagement', 'User Management')}
        </h2>
        <Button variant="outline" onClick={handleExportCSV} className="flex items-center">
          <FileDown className="mr-2 h-4 w-4" />
          {safeTranslate(t, 'admin.exportCSV', 'Export CSV')}
        </Button>
      </div>
      
      <div className="flex flex-col gap-4 md:flex-row md:items-center mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={safeTranslate(t, 'admin.searchUsers', 'Search users...')}
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="flex items-center">
          <Filter className="mr-2 h-4 w-4" />
          {safeTranslate(t, 'admin.filter', 'Filter')}
        </Button>
        <Button variant="outline" className="flex items-center">
          <Calendar className="mr-2 h-4 w-4" />
          {safeTranslate(t, 'admin.dateRange', 'Date Range')}
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-finance-dark p-4 rounded-lg border border-finance-steel/20">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-finance-offwhite">{safeTranslate(t, 'admin.totalUsers', 'Total Users')}</h3>
            <User className="h-5 w-5 text-finance-accent" />
          </div>
          <p className="text-2xl font-bold text-finance-accent">{users.length}</p>
        </div>
        
        <div className="bg-finance-dark p-4 rounded-lg border border-finance-steel/20">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-finance-offwhite">{safeTranslate(t, 'admin.activeToday', 'Active Today')}</h3>
            <Clock className="h-5 w-5 text-finance-accent" />
          </div>
          <p className="text-2xl font-bold text-finance-accent">3</p>
        </div>
        
        <div className="bg-finance-dark p-4 rounded-lg border border-finance-steel/20">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-finance-offwhite">{safeTranslate(t, 'admin.avgModules', 'Avg. Modules')}</h3>
            <BookOpen className="h-5 w-5 text-finance-accent" />
          </div>
          <p className="text-2xl font-bold text-finance-accent">5</p>
        </div>
        
        <div className="bg-finance-dark p-4 rounded-lg border border-finance-steel/20">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-finance-offwhite">{safeTranslate(t, 'admin.completionRate', 'Completion Rate')}</h3>
            <BookOpen className="h-5 w-5 text-finance-accent" />
          </div>
          <p className="text-2xl font-bold text-finance-accent">68%</p>
        </div>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{safeTranslate(t, 'admin.name', 'Name')}</TableHead>
              <TableHead>{safeTranslate(t, 'admin.email', 'Email')}</TableHead>
              <TableHead>{safeTranslate(t, 'admin.registered', 'Registered')}</TableHead>
              <TableHead>{safeTranslate(t, 'admin.lastActive', 'Last Active')}</TableHead>
              <TableHead>{safeTranslate(t, 'admin.completedModules', 'Completed Modules')}</TableHead>
              <TableHead>{safeTranslate(t, 'admin.timeSpent', 'Time Spent')}</TableHead>
              <TableHead className="text-right">{safeTranslate(t, 'admin.actions', 'Actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.registered}</TableCell>
                <TableCell>{user.lastActive}</TableCell>
                <TableCell>{user.completedModules}</TableCell>
                <TableCell>{user.timeSpent}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">
                    {safeTranslate(t, 'admin.view', 'View')}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminUsers;
