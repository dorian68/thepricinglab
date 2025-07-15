
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, BookOpen, Clock, Target } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { safeTranslate } from '../../utils/translationUtils';

interface Course {
  id: string;
  title: string;
  slug: string;
  content_md: string | null;
  tags: string[] | null;
  level: string | null;
  description: string | null;
  duration: string | null;
  image_url: string | null;
  created_at: string;
}

interface CourseFormData {
  title: string;
  slug: string;
  content_md: string;
  description: string;
  level: string;
  duration: string;
  tags: string;
}

const AdminContent = () => {
  const { t } = useTranslation();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  const form = useForm<CourseFormData>({
    defaultValues: {
      title: '',
      slug: '',
      content_md: '',
      description: '',
      level: 'fundamentals',
      duration: '',
      tags: ''
    }
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Erreur lors du chargement des cours');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: CourseFormData) => {
    try {
      const courseData = {
        ...data,
        tags: data.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        slug: data.slug || data.title.toLowerCase().replace(/\s+/g, '-')
      };

      if (editingCourse) {
        const { error } = await supabase
          .from('admin_courses')
          .update(courseData)
          .eq('id', editingCourse.id);

        if (error) throw error;
        toast.success('Cours mis à jour avec succès');
      } else {
        const { error } = await supabase
          .from('admin_courses')
          .insert([courseData]);

        if (error) throw error;
        toast.success('Cours créé avec succès');
      }

      setIsDialogOpen(false);
      setEditingCourse(null);
      form.reset();
      fetchCourses();
    } catch (error) {
      console.error('Error saving course:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    form.reset({
      title: course.title,
      slug: course.slug,
      content_md: course.content_md || '',
      description: course.description || '',
      level: course.level || 'fundamentals',
      duration: course.duration || '',
      tags: course.tags?.join(', ') || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce cours ?')) return;

    try {
      const { error } = await supabase
        .from('admin_courses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Cours supprimé avec succès');
      fetchCourses();
    } catch (error) {
      console.error('Error deleting course:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const getLevelBadgeVariant = (level: string | null) => {
    switch (level) {
      case 'fundamentals': return 'default';
      case 'advanced': return 'secondary';
      case 'complex': return 'destructive';
      default: return 'outline';
    }
  };

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
            {safeTranslate(t, 'admin.content.title', 'Gestion du contenu')}
          </h2>
          <p className="text-finance-lightgray">
            {safeTranslate(t, 'admin.content.description', 'Créez et gérez les cours de la plateforme')}
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => {
                setEditingCourse(null);
                form.reset();
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouveau cours
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingCourse ? 'Modifier le cours' : 'Créer un nouveau cours'}
              </DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Titre</FormLabel>
                        <FormControl>
                          <Input placeholder="Titre du cours" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slug</FormLabel>
                        <FormControl>
                          <Input placeholder="slug-du-cours" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Description du cours" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Niveau</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={safeTranslate(t, 'common.selectLevel', 'Sélectionner un niveau')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="fundamentals">Fondamentaux</SelectItem>
                            <SelectItem value="advanced">Avancé</SelectItem>
                            <SelectItem value="complex">Complexe</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Durée</FormLabel>
                        <FormControl>
                          <Input placeholder="ex: 45 min" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags (séparés par des virgules)</FormLabel>
                      <FormControl>
                        <Input placeholder="pricing, options, volatilité" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="content_md"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contenu (Markdown)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="# Titre du cours&#10;&#10;Contenu en markdown..." 
                          className="min-h-[200px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Annuler
                  </Button>
                  <Button type="submit">
                    {editingCourse ? 'Mettre à jour' : 'Créer'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="finance-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cours</TableHead>
                <TableHead>Niveau</TableHead>
                <TableHead>Durée</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Créé le</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-finance-burgundy/20 rounded-lg flex items-center justify-center">
                        <BookOpen className="h-5 w-5 text-finance-accent" />
                      </div>
                      <div>
                        <p className="font-medium">{course.title}</p>
                        <p className="text-sm text-finance-lightgray">{course.description}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getLevelBadgeVariant(course.level)} className="capitalize">
                      {course.level}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4 text-finance-lightgray" />
                      <span>{course.duration || 'Non défini'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {course.tags?.slice(0, 2).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {course.tags && course.tags.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{course.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(course.created_at).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(course)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(course.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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

export default AdminContent;
