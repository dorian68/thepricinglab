
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Database, RefreshCw, Upload, Download, FileDown, Search, 
  Filter, Edit, Trash2, FileText, Users, BookOpen, BarChart 
} from 'lucide-react';
import { safeTranslate } from '../../utils/translationUtils';

// Mock database tables
const mockTables = [
  { name: 'users', records: 250, lastUpdated: '2024-04-15', size: '1.2 MB' },
  { name: 'courses', records: 15, lastUpdated: '2024-04-10', size: '0.5 MB' },
  { name: 'modules', records: 68, lastUpdated: '2024-04-12', size: '0.8 MB' },
  { name: 'exercises', records: 120, lastUpdated: '2024-04-14', size: '1.0 MB' },
  { name: 'quizzes', records: 45, lastUpdated: '2024-04-13', size: '0.7 MB' },
  { name: 'user_progress', records: 890, lastUpdated: '2024-04-15', size: '2.1 MB' },
];

const AdminDatabase = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [tables, setTables] = useState(mockTables);
  
  const handleSyncDatabase = () => {
    // In a real application, this would sync the database
    console.log('Syncing database');
    alert('Database sync started (mock functionality)');
  };
  
  const handleUploadData = () => {
    // In a real application, this would upload data
    console.log('Uploading data');
  };
  
  const handleDownloadBackup = () => {
    // In a real application, this would download a backup
    console.log('Downloading backup');
    alert('Database backup initiated (mock functionality)');
  };
  
  const filteredTables = tables.filter(table => 
    table.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-finance-accent">
          {safeTranslate(t, 'admin.databaseManagement', 'Database Management')}
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSyncDatabase} className="flex items-center">
            <RefreshCw className="mr-2 h-4 w-4" />
            {safeTranslate(t, 'admin.syncDatabase', 'Sync Database')}
          </Button>
          <Button variant="outline" onClick={handleUploadData} className="flex items-center">
            <Upload className="mr-2 h-4 w-4" />
            {safeTranslate(t, 'admin.uploadData', 'Upload Data')}
          </Button>
          <Button variant="outline" onClick={handleDownloadBackup} className="flex items-center">
            <Download className="mr-2 h-4 w-4" />
            {safeTranslate(t, 'admin.backup', 'Backup')}
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-finance-dark p-4 rounded-lg border border-finance-steel/20">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-finance-offwhite">{safeTranslate(t, 'admin.tables', 'Tables')}</h3>
            <Database className="h-5 w-5 text-finance-accent" />
          </div>
          <p className="text-2xl font-bold text-finance-accent">{tables.length}</p>
        </div>
        
        <div className="bg-finance-dark p-4 rounded-lg border border-finance-steel/20">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-finance-offwhite">{safeTranslate(t, 'admin.totalRecords', 'Total Records')}</h3>
            <FileText className="h-5 w-5 text-finance-accent" />
          </div>
          <p className="text-2xl font-bold text-finance-accent">
            {tables.reduce((sum, table) => sum + table.records, 0)}
          </p>
        </div>
        
        <div className="bg-finance-dark p-4 rounded-lg border border-finance-steel/20">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-finance-offwhite">{safeTranslate(t, 'admin.totalSize', 'Total Size')}</h3>
            <Database className="h-5 w-5 text-finance-accent" />
          </div>
          <p className="text-2xl font-bold text-finance-accent">6.3 MB</p>
        </div>
        
        <div className="bg-finance-dark p-4 rounded-lg border border-finance-steel/20">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-finance-offwhite">{safeTranslate(t, 'admin.lastBackup', 'Last Backup')}</h3>
            <Download className="h-5 w-5 text-finance-accent" />
          </div>
          <p className="text-2xl font-bold text-finance-accent">2024-04-15</p>
        </div>
      </div>
      
      <Tabs defaultValue="tables" className="w-full">
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="tables" className="flex items-center">
            <Database className="mr-2 h-4 w-4" />
            {safeTranslate(t, 'admin.tables', 'Tables')}
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center">
            <RefreshCw className="mr-2 h-4 w-4" />
            {safeTranslate(t, 'admin.scheduledTasks', 'Scheduled Tasks')}
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center">
            <FileText className="mr-2 h-4 w-4" />
            {safeTranslate(t, 'admin.logs', 'Logs')}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="tables">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={safeTranslate(t, 'admin.searchTables', 'Search tables...')}
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{safeTranslate(t, 'admin.tableName', 'Table Name')}</TableHead>
                  <TableHead>{safeTranslate(t, 'admin.records', 'Records')}</TableHead>
                  <TableHead>{safeTranslate(t, 'admin.lastUpdated', 'Last Updated')}</TableHead>
                  <TableHead>{safeTranslate(t, 'admin.size', 'Size')}</TableHead>
                  <TableHead className="text-right">{safeTranslate(t, 'admin.actions', 'Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTables.map((table) => (
                  <TableRow key={table.name}>
                    <TableCell className="font-medium">{table.name}</TableCell>
                    <TableCell>{table.records}</TableCell>
                    <TableCell>{table.lastUpdated}</TableCell>
                    <TableCell>{table.size}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm">
                          {safeTranslate(t, 'admin.browse', 'Browse')}
                        </Button>
                        <Button variant="ghost" size="sm">
                          {safeTranslate(t, 'admin.export', 'Export')}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        
        <TabsContent value="tasks">
          <div className="p-6 text-center bg-finance-dark rounded-md border border-finance-steel/20">
            <RefreshCw className="h-12 w-12 mx-auto text-finance-steel mb-4" />
            <h3 className="text-xl font-semibold text-finance-accent mb-2">
              {safeTranslate(t, 'admin.scheduledTasks', 'Scheduled Tasks')}
            </h3>
            <p className="text-finance-offwhite mb-4">
              {safeTranslate(t, 'admin.scheduledTasksDesc', 'Create and manage automated database tasks.')}
            </p>
            <Button>
              {safeTranslate(t, 'admin.createNewTask', 'Create New Task')}
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="logs">
          <div className="p-6 text-center bg-finance-dark rounded-md border border-finance-steel/20">
            <FileText className="h-12 w-12 mx-auto text-finance-steel mb-4" />
            <h3 className="text-xl font-semibold text-finance-accent mb-2">
              {safeTranslate(t, 'admin.databaseLogs', 'Database Logs')}
            </h3>
            <p className="text-finance-offwhite mb-4">
              {safeTranslate(t, 'admin.databaseLogsDesc', 'View system logs and database activity.')}
            </p>
            <Button>
              {safeTranslate(t, 'admin.viewLogs', 'View Logs')}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDatabase;
