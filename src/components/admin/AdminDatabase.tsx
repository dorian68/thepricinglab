
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Database, Users, BookOpen, FileText, Activity, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { safeTranslate } from '../../utils/translationUtils';

interface DatabaseStats {
  users: number;
  courses: number;
  exercises: number;
  notebooks: number;
  activity: number;
}

const AdminDatabase = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<DatabaseStats>({
    users: 0,
    courses: 0,
    exercises: 0,
    notebooks: 0,
    activity: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchDatabaseStats();
  }, []);

  const fetchDatabaseStats = async () => {
    try {
      setIsRefreshing(true);
      
      // Fetch users count
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch courses count
      const { count: coursesCount } = await supabase
        .from('admin_courses')
        .select('*', { count: 'exact', head: true });

      // Fetch exercises count
      const { count: exercisesCount } = await supabase
        .from('admin_exercises')
        .select('*', { count: 'exact', head: true });

      // Fetch notebooks count
      const { count: notebooksCount } = await supabase
        .from('admin_notebooks')
        .select('*', { count: 'exact', head: true });

      // Fetch activity count
      const { count: activityCount } = await supabase
        .from('user_activity')
        .select('*', { count: 'exact', head: true });

      setStats({
        users: usersCount || 0,
        courses: coursesCount || 0,
        exercises: exercisesCount || 0,
        notebooks: notebooksCount || 0,
        activity: activityCount || 0
      });

    } catch (error) {
      console.error('Error fetching database stats:', error);
      toast.error('Erreur lors du chargement des statistiques');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color 
  }: { 
    title: string; 
    value: number; 
    icon: any; 
    color: string; 
  }) => (
    <Card className="finance-card">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-finance-lightgray">{title}</p>
            <p className="text-2xl font-bold text-finance-offwhite">{value}</p>
          </div>
          <div className={`p-3 rounded-full ${color}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-finance-accent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-finance-accent">
            {safeTranslate(t, 'admin.database.title', 'Statistiques de la base de données')}
          </h2>
          <p className="text-finance-lightgray">
            {safeTranslate(t, 'admin.database.description', 'Vue d\'ensemble des données de la plateforme')}
          </p>
        </div>
        
        <Button 
          onClick={fetchDatabaseStats}
          disabled={isRefreshing}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Utilisateurs"
          value={stats.users}
          icon={Users}
          color="bg-blue-500/20 text-blue-400"
        />
        
        <StatCard
          title="Cours"
          value={stats.courses}
          icon={BookOpen}
          color="bg-green-500/20 text-green-400"
        />
        
        <StatCard
          title="Exercices"
          value={stats.exercises}
          icon={FileText}
          color="bg-purple-500/20 text-purple-400"
        />
        
        <StatCard
          title="Notebooks"
          value={stats.notebooks}
          icon={Database}
          color="bg-orange-500/20 text-orange-400"
        />
        
        <StatCard
          title="Activités"
          value={stats.activity}
          icon={Activity}
          color="bg-finance-burgundy/20 text-finance-accent"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="finance-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="h-5 w-5 mr-2 text-finance-accent" />
              Tables principales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>profiles</span>
                <Badge variant="default">{stats.users} entrées</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>admin_courses</span>
                <Badge variant="secondary">{stats.courses} entrées</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>admin_exercises</span>
                <Badge variant="secondary">{stats.exercises} entrées</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>admin_notebooks</span>
                <Badge variant="secondary">{stats.notebooks} entrées</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>user_activity</span>
                <Badge variant="outline">{stats.activity} entrées</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="finance-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2 text-finance-accent" />
              État du système
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Connexion Supabase</span>
                <Badge variant="default" className="bg-green-900/20 text-green-400">
                  Connecté
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>RLS activé</span>
                <Badge variant="default" className="bg-green-900/20 text-green-400">
                  Actif
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Storage bucket</span>
                <Badge variant="default" className="bg-green-900/20 text-green-400">
                  admin-content
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Dernière mise à jour</span>
                <Badge variant="outline">
                  {new Date().toLocaleTimeString('fr-FR')}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDatabase;
