
import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from 'lucide-react';
import AdminUsers from '../../components/admin/AdminUsers';
import AdminContent from '../../components/admin/AdminContent';
import AdminDatabase from '../../components/admin/AdminDatabase';
import AdminStructure from '../../components/admin/AdminStructure';
import { safeTranslate } from '../../utils/translationUtils';

const AdminDashboard = () => {
  const { t } = useTranslation();
  
  return (
    <>
      <Helmet>
        <title>Admin Dashboard | The Trading Lab</title>
      </Helmet>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Alert className="bg-amber-500/20 border-amber-500 mb-6">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-amber-500 font-semibold">
            {safeTranslate(t, 'admin.warning', 'You are in ADMIN mode')}
          </AlertDescription>
        </Alert>
        
        <h1 className="text-3xl font-bold text-finance-accent mb-6">
          {safeTranslate(t, 'admin.dashboard', 'Admin Dashboard')}
        </h1>
        
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="users">
              {safeTranslate(t, 'admin.users', 'Users')}
            </TabsTrigger>
            <TabsTrigger value="content">
              {safeTranslate(t, 'admin.content', 'Content')}
            </TabsTrigger>
            <TabsTrigger value="database">
              {safeTranslate(t, 'admin.database', 'Database')}
            </TabsTrigger>
            <TabsTrigger value="structure">
              {safeTranslate(t, 'admin.structure', 'Structure')}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="users" className="border rounded-md bg-finance-charcoal p-6">
            <AdminUsers />
          </TabsContent>
          
          <TabsContent value="content" className="border rounded-md bg-finance-charcoal p-6">
            <AdminContent />
          </TabsContent>
          
          <TabsContent value="database" className="border rounded-md bg-finance-charcoal p-6">
            <AdminDatabase />
          </TabsContent>
          
          <TabsContent value="structure" className="border rounded-md bg-finance-charcoal p-6">
            <AdminStructure />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default AdminDashboard;
