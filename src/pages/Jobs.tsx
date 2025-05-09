
import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  Filter, 
  MapPin, 
  Briefcase, 
  Clock, 
  ExternalLink, 
  Plus, 
  Search,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { safeTranslate } from '../utils/translationUtils';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Separator } from '@/components/ui/separator';

// Define types for job listings
type JobLocation = 'remote' | 'hybrid' | 'onsite';
type JobType = 'cdi' | 'cdd' | 'internship' | 'freelance' | 'phd';
type JobDomain = 'structuring' | 'trading' | 'risk' | 'quantdev' | 'research' | 'other';
type JobLevel = 'junior' | 'mid' | 'senior' | 'executive';

interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  locationType: JobLocation;
  jobType: JobType;
  domain: JobDomain;
  level: JobLevel;
  link: string;
  publishedAt: string;
  submittedBy?: string;
  isPending?: boolean;
  description?: string;
}

// Mock data for job listings
const mockJobListings: JobListing[] = [
  {
    id: '1',
    title: 'Quant Developer - Équipe Dérivés Actions',
    company: 'BNP Paribas',
    location: 'Paris, France',
    locationType: 'onsite',
    jobType: 'cdi',
    domain: 'quantdev',
    level: 'mid',
    link: 'https://example.com/job1',
    publishedAt: '2023-05-15'
  },
  {
    id: '2',
    title: 'Stage - Structuration Produits de Taux',
    company: 'Société Générale',
    location: 'London, UK',
    locationType: 'hybrid',
    jobType: 'internship',
    domain: 'structuring',
    level: 'junior',
    link: 'https://example.com/job2',
    publishedAt: '2023-05-10'
  },
  {
    id: '3',
    title: 'Senior Quant Researcher - Algorithmic Trading',
    company: 'Two Sigma',
    location: 'New York, USA',
    locationType: 'remote',
    jobType: 'cdi',
    domain: 'research',
    level: 'senior',
    link: 'https://example.com/job3',
    publishedAt: '2023-05-05'
  },
  {
    id: '4',
    title: 'Risk Analyst - Derivatives',
    company: 'Goldman Sachs',
    location: 'London, UK',
    locationType: 'onsite',
    jobType: 'cdi',
    domain: 'risk',
    level: 'mid',
    link: 'https://example.com/job4',
    publishedAt: '2023-05-01'
  },
  {
    id: '5',
    title: 'PhD Research Position in Quantitative Finance',
    company: 'ETH Zürich',
    location: 'Zürich, Switzerland',
    locationType: 'onsite',
    jobType: 'phd',
    domain: 'research',
    level: 'junior',
    link: 'https://example.com/job5',
    publishedAt: '2023-04-28'
  },
  {
    id: '6',
    title: 'Quantitative Trader - Futures & Options',
    company: 'Flow Traders',
    location: 'Amsterdam, Netherlands',
    locationType: 'hybrid',
    jobType: 'cdi',
    domain: 'trading',
    level: 'senior',
    link: 'https://example.com/job6',
    publishedAt: '2023-04-25'
  },
];

// Helper function for localized job type labels
const getJobTypeLabel = (type: JobType, t: any): string => {
  const labels: Record<JobType, string> = {
    cdi: 'CDI',
    cdd: 'CDD',
    internship: 'Stage',
    freelance: 'Freelance',
    phd: 'Doctorat/PhD'
  };
  return labels[type] || type;
};

// Helper function for localized domain labels
const getDomainLabel = (domain: JobDomain, t: any): string => {
  const labels: Record<JobDomain, string> = {
    structuring: 'Structuration',
    trading: 'Trading',
    risk: 'Risque',
    quantdev: 'Quant Dev',
    research: 'Recherche',
    other: 'Autre'
  };
  return labels[domain] || domain;
};

// Helper function for localized level labels
const getLevelLabel = (level: JobLevel, t: any): string => {
  const labels: Record<JobLevel, string> = {
    junior: 'Junior',
    mid: 'Confirmé',
    senior: 'Senior',
    executive: 'Executive'
  };
  return labels[level] || level;
};

// Component for job listing card
interface JobCardProps {
  job: JobListing;
  t: any;
}

const JobCard: React.FC<JobCardProps> = ({ job, t }) => {
  return (
    <Card className="bg-finance-charcoal border-finance-steel/30 hover:border-finance-accent transition-colors duration-300">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{job.title}</CardTitle>
            <CardDescription className="flex items-center gap-1 mt-1">
              <Briefcase className="h-4 w-4" />
              <span>{job.company}</span>
            </CardDescription>
          </div>
          {job.isPending && (
            <Badge variant="outline" className="bg-amber-500/20 text-amber-300 border-amber-500/30">
              En attente
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="outline" className="flex items-center gap-1 bg-finance-steel/10">
            <MapPin className="h-3 w-3" />
            <span>{job.location}</span>
          </Badge>
          <Badge variant="outline" className="bg-finance-steel/10">
            {getJobTypeLabel(job.jobType, t)}
          </Badge>
          <Badge variant="outline" className="bg-finance-steel/10">
            {getDomainLabel(job.domain, t)}
          </Badge>
          {job.locationType === 'remote' && (
            <Badge variant="outline" className="bg-green-500/20 text-green-300 border-green-500/30">
              Remote
            </Badge>
          )}
          {job.locationType === 'hybrid' && (
            <Badge variant="outline" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
              Hybrid
            </Badge>
          )}
        </div>
        <div className="text-sm text-finance-lightgray">
          <div className="flex items-center gap-1 mb-1">
            <Clock className="h-4 w-4" />
            <span>Publié le {new Date(job.publishedAt).toLocaleDateString()}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          variant="outline" 
          className="w-full border-finance-accent/50 text-finance-accent"
          onClick={() => window.open(job.link, '_blank')}
        >
          <div className="flex items-center gap-2">
            <span>Voir l'offre</span>
            <ExternalLink className="h-4 w-4" />
          </div>
        </Button>
      </CardFooter>
    </Card>
  );
};

// Add Job Dialog
interface AddJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (jobData: any) => void;
}

const AddJobDialog: React.FC<AddJobDialogProps> = ({ 
  open, 
  onOpenChange, 
  onSubmit 
}) => {
  const form = useForm({
    defaultValues: {
      title: '',
      company: '',
      location: '',
      locationType: 'onsite',
      jobType: 'cdi',
      domain: 'structuring',
      level: 'mid',
      link: '',
      description: ''
    }
  });
  
  const handleSubmit = (data: any) => {
    onSubmit(data);
    form.reset();
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-finance-charcoal max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-finance-accent">Publier une offre d'emploi</DialogTitle>
          <DialogDescription>
            Partagez une offre d'emploi avec la communauté. Toutes les offres sont soumises à modération avant publication.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Intitulé du poste</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Quant Developer" {...field} className="bg-finance-steel/10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entreprise</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: BNP Paribas" {...field} className="bg-finance-steel/10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lieu</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Paris, France" {...field} className="bg-finance-steel/10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="locationType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type de présence</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-finance-steel/10">
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="onsite">Sur site</SelectItem>
                        <SelectItem value="hybrid">Hybride</SelectItem>
                        <SelectItem value="remote">100% Remote</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="jobType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type de contrat</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-finance-steel/10">
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cdi">CDI</SelectItem>
                        <SelectItem value="cdd">CDD</SelectItem>
                        <SelectItem value="internship">Stage</SelectItem>
                        <SelectItem value="freelance">Freelance</SelectItem>
                        <SelectItem value="phd">Doctorat/PhD</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="domain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Domaine</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-finance-steel/10">
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="structuring">Structuration</SelectItem>
                        <SelectItem value="trading">Trading</SelectItem>
                        <SelectItem value="risk">Risque</SelectItem>
                        <SelectItem value="quantdev">Quant Dev</SelectItem>
                        <SelectItem value="research">Recherche</SelectItem>
                        <SelectItem value="other">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Niveau</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-finance-steel/10">
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="junior">Junior</SelectItem>
                        <SelectItem value="mid">Confirmé</SelectItem>
                        <SelectItem value="senior">Senior</SelectItem>
                        <SelectItem value="executive">Executive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="link"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lien vers l'offre</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} className="bg-finance-steel/10" />
                  </FormControl>
                  <FormDescription className="text-finance-lightgray">
                    URL complète vers l'offre d'emploi originale (LinkedIn, site entreprise, etc.)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optionnel)</FormLabel>
                  <FormControl>
                    <textarea 
                      className="w-full h-24 bg-finance-steel/10 rounded-md border border-input p-2"
                      placeholder="Informations complémentaires sur l'offre..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" variant="finance">
                Soumettre l'offre
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

// Main Jobs page component
const Jobs: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('all');
  const [filteredJobs, setFilteredJobs] = useState<JobListing[]>(mockJobListings);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({
    jobType: '',
    domain: '',
    location: '',
    level: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const { isAuthenticated } = useAuth();
  
  const st = (key: string, defaultValue: string) => safeTranslate(t, key, defaultValue);
  
  // Apply filters
  const applyFilters = () => {
    let result = mockJobListings;
    
    // Apply tab filters
    if (activeTab === 'remote') {
      result = result.filter(job => job.locationType === 'remote');
    } else if (activeTab === 'internship') {
      result = result.filter(job => job.jobType === 'internship');
    }
    
    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(job => 
        job.title.toLowerCase().includes(term) || 
        job.company.toLowerCase().includes(term) ||
        job.location.toLowerCase().includes(term)
      );
    }
    
    // Apply dropdown filters
    if (selectedFilters.jobType) {
      result = result.filter(job => job.jobType === selectedFilters.jobType);
    }
    
    if (selectedFilters.domain) {
      result = result.filter(job => job.domain === selectedFilters.domain);
    }
    
    if (selectedFilters.location) {
      result = result.filter(job => job.location.includes(selectedFilters.location));
    }
    
    if (selectedFilters.level) {
      result = result.filter(job => job.level === selectedFilters.level);
    }
    
    setFilteredJobs(result);
  };
  
  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  // Handle filter changes
  const handleFilterChange = (type: string, value: string) => {
    setSelectedFilters(prev => ({
      ...prev,
      [type]: value
    }));
  };
  
  // Handle clear filters
  const handleClearFilters = () => {
    setSelectedFilters({
      jobType: '',
      domain: '',
      location: '',
      level: ''
    });
    setSearchTerm('');
  };
  
  // Handle submit job
  const handleSubmitJob = (jobData: any) => {
    const newJob: JobListing = {
      id: `new-${Date.now()}`,
      ...jobData,
      publishedAt: new Date().toISOString().split('T')[0],
      isPending: true
    };
    
    // In a real app, we would send this to a backend
    // For now, we just add it to our local state
    setFilteredJobs(prev => [newJob, ...prev]);
    setDialogOpen(false);
    
    toast.success('Offre d\'emploi soumise avec succès', {
      description: 'Votre offre est en attente de validation par nos modérateurs.'
    });
  };
  
  // Reset filters when tab changes
  React.useEffect(() => {
    handleClearFilters();
  }, [activeTab]);
  
  // Apply filters whenever filters or search term changes
  React.useEffect(() => {
    applyFilters();
  }, [activeTab, searchTerm, selectedFilters]);
  
  return (
    <>
      <Helmet>
        <title>Offres d'emploi en finance quantitative | The Pricing Lab</title>
      </Helmet>
      
      {/* Jobs Header */}
      <header className="py-12 px-6 border-b border-finance-steel/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 terminal-text">Offres d'emploi Finance Quantitative</h1>
            <p className="text-finance-lightgray text-lg max-w-3xl mx-auto">
              Découvrez les opportunités de carrière en finance quantitative, sélectionnées pour notre communauté d'experts.
            </p>
          </div>
        </div>
      </header>
      
      <div className="py-8 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
            <div className="relative flex-grow max-w-xl">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-finance-steel" size={18} />
              <Input 
                placeholder="Rechercher par titre, entreprise ou location..." 
                className="pl-10 bg-finance-charcoal"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline"
                className="flex items-center gap-1"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter size={16} />
                <span>Filtres</span>
                <Badge variant="secondary" className="ml-1 bg-finance-accent text-white">
                  {Object.values(selectedFilters).filter(Boolean).length}
                </Badge>
              </Button>
              
              {isAuthenticated && (
                <Button 
                  variant="finance"
                  className="flex items-center gap-1"
                  onClick={() => setDialogOpen(true)}
                >
                  <Plus size={16} />
                  <span>Publier une offre</span>
                </Button>
              )}
            </div>
          </div>
          
          {/* Filters Panel */}
          {showFilters && (
            <Card className="p-4 mb-6 bg-finance-charcoal border-finance-steel/30">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium">Filtres avancés</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-finance-lightgray hover:text-white flex items-center gap-1"
                  onClick={handleClearFilters}
                >
                  <X size={14} />
                  <span>Réinitialiser</span>
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm text-finance-lightgray mb-1 block">Type de contrat</label>
                  <Select
                    value={selectedFilters.jobType}
                    onValueChange={(value) => handleFilterChange('jobType', value)}
                  >
                    <SelectTrigger className="w-full bg-finance-steel/10">
                      <SelectValue placeholder="Tous" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tous</SelectItem>
                      <SelectItem value="cdi">CDI</SelectItem>
                      <SelectItem value="cdd">CDD</SelectItem>
                      <SelectItem value="internship">Stage</SelectItem>
                      <SelectItem value="freelance">Freelance</SelectItem>
                      <SelectItem value="phd">Doctorat/PhD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm text-finance-lightgray mb-1 block">Domaine</label>
                  <Select
                    value={selectedFilters.domain}
                    onValueChange={(value) => handleFilterChange('domain', value)}
                  >
                    <SelectTrigger className="w-full bg-finance-steel/10">
                      <SelectValue placeholder="Tous" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tous</SelectItem>
                      <SelectItem value="structuring">Structuration</SelectItem>
                      <SelectItem value="trading">Trading</SelectItem>
                      <SelectItem value="risk">Risque</SelectItem>
                      <SelectItem value="quantdev">Quant Dev</SelectItem>
                      <SelectItem value="research">Recherche</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm text-finance-lightgray mb-1 block">Localisation</label>
                  <Select
                    value={selectedFilters.location}
                    onValueChange={(value) => handleFilterChange('location', value)}
                  >
                    <SelectTrigger className="w-full bg-finance-steel/10">
                      <SelectValue placeholder="Toutes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Toutes</SelectItem>
                      <SelectItem value="Paris">Paris</SelectItem>
                      <SelectItem value="London">London</SelectItem>
                      <SelectItem value="New York">New York</SelectItem>
                      <SelectItem value="Zürich">Zürich</SelectItem>
                      <SelectItem value="Amsterdam">Amsterdam</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm text-finance-lightgray mb-1 block">Niveau</label>
                  <Select
                    value={selectedFilters.level}
                    onValueChange={(value) => handleFilterChange('level', value)}
                  >
                    <SelectTrigger className="w-full bg-finance-steel/10">
                      <SelectValue placeholder="Tous" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tous</SelectItem>
                      <SelectItem value="junior">Junior</SelectItem>
                      <SelectItem value="mid">Confirmé</SelectItem>
                      <SelectItem value="senior">Senior</SelectItem>
                      <SelectItem value="executive">Executive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>
          )}
          
          {/* Tabs and Job Listings */}
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <div className="flex items-center justify-between mb-6">
              <TabsList className="bg-finance-charcoal">
                <TabsTrigger value="all">Toutes les offres</TabsTrigger>
                <TabsTrigger value="remote">Remote</TabsTrigger>
                <TabsTrigger value="internship">Stages</TabsTrigger>
              </TabsList>
              
              <div className="text-sm text-finance-lightgray">
                {filteredJobs.length} offre{filteredJobs.length !== 1 ? 's' : ''} trouvée{filteredJobs.length !== 1 ? 's' : ''}
              </div>
            </div>
            
            <TabsContent value="all" className="mt-0">
              {filteredJobs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredJobs.map((job) => (
                    <JobCard key={job.id} job={job} t={t} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-finance-steel/5 rounded-lg border border-dashed border-finance-steel/30">
                  <p className="text-finance-lightgray">Aucune offre ne correspond à votre recherche.</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={handleClearFilters}
                  >
                    Réinitialiser les filtres
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="remote" className="mt-0">
              {filteredJobs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredJobs.map((job) => (
                    <JobCard key={job.id} job={job} t={t} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-finance-steel/5 rounded-lg border border-dashed border-finance-steel/30">
                  <p className="text-finance-lightgray">Aucune offre remote ne correspond à votre recherche.</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={handleClearFilters}
                  >
                    Réinitialiser les filtres
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="internship" className="mt-0">
              {filteredJobs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredJobs.map((job) => (
                    <JobCard key={job.id} job={job} t={t} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-finance-steel/5 rounded-lg border border-dashed border-finance-steel/30">
                  <p className="text-finance-lightgray">Aucune offre de stage ne correspond à votre recherche.</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={handleClearFilters}
                  >
                    Réinitialiser les filtres
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
          
          {/* CTA Section */}
          <div className="mt-12 p-6 bg-finance-charcoal border border-finance-steel/20 rounded-lg text-center">
            <h2 className="text-xl font-bold mb-2 terminal-text">Vous recrutez des talents quant ?</h2>
            <p className="text-finance-lightgray mb-4">
              Publiez gratuitement vos offres d'emploi et attirez des candidats qualifiés en finance quantitative.
            </p>
            <Button
              variant="finance"
              onClick={() => isAuthenticated ? setDialogOpen(true) : toast.error('Vous devez être connecté pour publier une offre')}
            >
              Publier une offre d'emploi
            </Button>
          </div>
        </div>
      </div>
      
      {/* Add Job Dialog */}
      <AddJobDialog 
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmitJob}
      />
    </>
  );
};

export default Jobs;
