
import React from 'react';
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
        <title>Admin Dashboard | The Pricing Library</title>
      </Helmet>
      
      <div className="min-h-screen bg-finance-dark text-finance-offwhite">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Alert className="bg-amber-500/20 border-amber-500 mb-6">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertDescription className="text-amber-500 font-semibold">
              {safeTranslate(t, 'admin.warning', 'Vous êtes en mode ADMINISTRATEUR')}
            </AlertDescription>
          </Alert>
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-finance-accent mb-2">
              {safeTranslate(t, 'admin.dashboard', 'Tableau de bord Admin')}
            </h1>
            <p className="text-finance-lightgray">
              Gérez les utilisateurs, le contenu et surveillez l'activité de la plateforme
            </p>
          </div>
          
          <Tabs defaultValue="content" className="w-full">
            <TabsList className="grid grid-cols-4 mb-6 bg-finance-charcoal">
              <TabsTrigger value="content" className="data-[state=active]:bg-finance-burgundy data-[state=active]:text-finance-offwhite">
                {safeTranslate(t, 'admin.content', 'Contenu')}
              </TabsTrigger>
              <TabsTrigger value="users" className="data-[state=active]:bg-finance-burgundy data-[state=active]:text-finance-offwhite">
                {safeTranslate(t, 'admin.users', 'Utilisateurs')}
              </TabsTrigger>
              <TabsTrigger value="database" className="data-[state=active]:bg-finance-burgundy data-[state=active]:text-finance-offwhite">
                {safeTranslate(t, 'admin.database', 'Base de données')}
              </TabsTrigger>
              <TabsTrigger value="structure" className="data-[state=active]:bg-finance-burgundy data-[state=active]:text-finance-offwhite">
                {safeTranslate(t, 'admin.structure', 'Structure')}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="content" className="border border-finance-steel/20 rounded-md bg-finance-charcoal/50 p-6">
              <AdminContent />
            </TabsContent>
            
            <TabsContent value="users" className="border border-finance-steel/20 rounded-md bg-finance-charcoal/50 p-6">
              <AdminUsers />
            </TabsContent>
            
            <TabsContent value="database" className="border border-finance-steel/20 rounded-md bg-finance-charcoal/50 p-6">
              <AdminDatabase />
            </TabsContent>
            
            <TabsContent value="structure" className="border border-finance-steel/20 rounded-md bg-finance-charcoal/50 p-6">
              <AdminStructure />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
