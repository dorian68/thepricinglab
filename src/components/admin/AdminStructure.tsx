
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Database, 
  Shield, 
  Key, 
  Table, 
  Users, 
  BookOpen, 
  FileText, 
  FolderOpen,
  Lock,
  Eye
} from 'lucide-react';
import { safeTranslate } from '../../utils/translationUtils';

const AdminStructure = () => {
  const { t } = useTranslation();

  const tables = [
    {
      name: 'profiles',
      description: 'Profils utilisateurs avec plans et informations personnelles',
      columns: ['id', 'email', 'prenom', 'nom', 'plan', 'date_inscription'],
      rls: true,
      policies: ['Users can view their own profile']
    },
    {
      name: 'admin_courses',
      description: 'Cours créés et gérés par les administrateurs',
      columns: ['id', 'title', 'slug', 'content_md', 'tags', 'level', 'description', 'duration'],
      rls: true,
      policies: ['Admin full access to courses']
    },
    {
      name: 'admin_exercises',
      description: 'Exercices liés aux cours avec questions et solutions',
      columns: ['id', 'title', 'question_md', 'solution_md', 'course_id', 'difficulty'],
      rls: true,
      policies: ['Admin full access to exercises']
    },
    {
      name: 'admin_notebooks',
      description: 'Notebooks Jupyter et fichiers Python associés aux cours',
      columns: ['id', 'title', 'description', 'file_url', 'linked_course_id', 'content'],
      rls: true,
      policies: ['Admin full access to notebooks']
    },
    {
      name: 'user_activity',
      description: 'Activités et interactions des utilisateurs',
      columns: ['id', 'user_id', 'activity_type', 'module_path', 'details'],
      rls: false,
      policies: []
    }
  ];

  const storageInfo = {
    buckets: [
      {
        name: 'admin-content',
        public: true,
        description: 'Stockage des fichiers de cours, notebooks et images'
      }
    ]
  };

  const authInfo = {
    provider: 'Supabase Auth',
    roles: ['freemium', 'basic', 'pro', 'admin'],
    features: ['Email/Password', 'OAuth', 'Row Level Security']
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-finance-accent">
          {safeTranslate(t, 'admin.structure.title', 'Architecture du système')}
        </h2>
        <p className="text-finance-lightgray">
          {safeTranslate(t, 'admin.structure.description', 'Vue d\'ensemble de la structure de la base de données et des permissions')}
        </p>
      </div>

      {/* Tables Overview */}
      <Card className="finance-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Table className="h-5 w-5 mr-2 text-finance-accent" />
            Tables de la base de données
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {tables.map((table) => (
              <div key={table.name} className="border border-finance-steel/20 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-finance-offwhite flex items-center">
                    <Database className="h-4 w-4 mr-2" />
                    {table.name}
                  </h4>
                  <div className="flex space-x-2">
                    {table.rls && (
                      <Badge variant="default" className="bg-green-900/20 text-green-400">
                        <Shield className="h-3 w-3 mr-1" />
                        RLS
                      </Badge>
                    )}
                  </div>
                </div>
                
                <p className="text-sm text-finance-lightgray mb-3">{table.description}</p>
                
                <div className="flex flex-wrap gap-1 mb-3">
                  {table.columns.map((column) => (
                    <Badge key={column} variant="outline" className="text-xs">
                      {column}
                    </Badge>
                  ))}
                </div>

                {table.policies.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-finance-lightgray mb-1">Politiques RLS:</p>
                    {table.policies.map((policy, index) => (
                      <Badge key={index} variant="secondary" className="text-xs mr-1">
                        <Lock className="h-3 w-3 mr-1" />
                        {policy}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Authentication Structure */}
      <Card className="finance-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2 text-finance-accent" />
            Système d'authentification
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Provider & Features</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Key className="h-4 w-4 text-finance-accent" />
                  <span>{authInfo.provider}</span>
                </div>
                {authInfo.features.map((feature) => (
                  <div key={feature} className="flex items-center space-x-2">
                    <Eye className="h-4 w-4 text-finance-lightgray" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-3">Plans utilisateur</h4>
              <div className="space-y-2">
                {authInfo.roles.map((role) => (
                  <Badge key={role} variant="outline" className="mr-2 capitalize">
                    {role}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Storage Structure */}
      <Card className="finance-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <FolderOpen className="h-5 w-5 mr-2 text-finance-accent" />
            Stockage (Supabase Storage)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {storageInfo.buckets.map((bucket) => (
            <div key={bucket.name} className="border border-finance-steel/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-finance-offwhite">
                  {bucket.name}
                </h4>
                <Badge 
                  variant={bucket.public ? "default" : "secondary"}
                  className={bucket.public ? "bg-green-900/20 text-green-400" : ""}
                >
                  {bucket.public ? "Public" : "Privé"}
                </Badge>
              </div>
              <p className="text-sm text-finance-lightgray">{bucket.description}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Security Overview */}
      <Card className="finance-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2 text-finance-accent" />
            Sécurité & Permissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Row Level Security (RLS)</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Tables protégées</span>
                  <Badge variant="default" className="bg-green-900/20 text-green-400">
                    {tables.filter(t => t.rls).length}/{tables.length}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Politiques actives</span>
                  <Badge variant="secondary">
                    {tables.reduce((acc, t) => acc + t.policies.length, 0)}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-3">Accès Admin</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Lock className="h-4 w-4 text-finance-accent" />
                  <span className="text-sm">Metadata role = "admin"</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Key className="h-4 w-4 text-finance-accent" />
                  <span className="text-sm">JWT vérification</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminStructure;
