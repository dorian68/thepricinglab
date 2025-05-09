import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { CalibrationDomain, CalibrationModelFormData } from '@/types/community';
import { UploadCloud } from 'lucide-react';
import { toast } from 'sonner';

interface ModelSubmissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (model: CalibrationModelFormData) => void;
  userName: string;
}

const initialFormData: CalibrationModelFormData = {
  name: '',
  description: '',
  code: '',
  domain: 'equity',
  isPublic: false,
  demoFile: null
};

const ModelSubmissionDialog: React.FC<ModelSubmissionDialogProps> = ({ 
  open, 
  onOpenChange,
  onSubmit,
  userName
}) => {
  const [formData, setFormData] = useState<CalibrationModelFormData>(initialFormData);
  const [fileName, setFileName] = useState<string>('');
  
  const handleChange = (field: keyof CalibrationModelFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      handleChange('demoFile', file);
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name.trim()) {
      toast.error("Le nom du modèle est requis");
      return;
    }
    
    if (!formData.description.trim()) {
      toast.error("Une description est requise");
      return;
    }
    
    if (!formData.code.trim()) {
      toast.error("Le code de calibration est requis");
      return;
    }
    
    onSubmit(formData);
    setFormData(initialFormData);
    setFileName('');
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-finance-charcoal">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-finance-accent">Ajouter un modèle de calibration</DialogTitle>
            <DialogDescription>
              Partagez vos modèles avec la communauté ou gardez-les privés pour votre usage personnel.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-4 items-center gap-3">
              <Label htmlFor="name" className="text-right">
                Nom du modèle
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="col-span-3 bg-finance-steel/10"
                placeholder="Ex: Modified SABR Model"
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-3">
              <Label htmlFor="domain" className="text-right">
                Domaine
              </Label>
              <Select 
                value={formData.domain} 
                onValueChange={(value: CalibrationDomain) => handleChange('domain', value)}
              >
                <SelectTrigger className="col-span-3 bg-finance-steel/10">
                  <SelectValue placeholder="Choisir un domaine" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equity">Equity</SelectItem>
                  <SelectItem value="rates">Rates</SelectItem>
                  <SelectItem value="fx">FX</SelectItem>
                  <SelectItem value="vol">Volatility</SelectItem>
                  <SelectItem value="commodities">Commodities</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-start gap-3">
              <Label htmlFor="description" className="text-right pt-2">
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className="col-span-3 bg-finance-steel/10"
                placeholder="Décrivez brièvement votre modèle et son utilité..."
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-start gap-3">
              <Label htmlFor="code" className="text-right pt-2">
                Code de calibration
              </Label>
              <Textarea
                id="code"
                value={formData.code}
                onChange={(e) => handleChange('code', e.target.value)}
                className="col-span-3 bg-finance-steel/10 font-mono h-40"
                placeholder="// Entrez votre code de calibration ici (JSON, pseudo-code ou autre)"
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-3">
              <Label htmlFor="demo-file" className="text-right">
                Fichier demo
              </Label>
              <div className="col-span-3">
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => document.getElementById('demo-file')?.click()}
                  >
                    <UploadCloud size={16} />
                    <span>Upload</span>
                  </Button>
                  <span className="text-sm text-finance-lightgray">
                    {fileName || "Aucun fichier sélectionné"}
                  </span>
                </div>
                <input
                  id="demo-file"
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".csv,.json,.txt,.xlsx"
                />
                <p className="text-xs text-finance-lightgray mt-1">
                  Formats acceptés: CSV, JSON, TXT, XLSX (max 2MB)
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-3">
              <Label htmlFor="visibility" className="text-right">
                Visibilité
              </Label>
              <div className="flex items-center gap-2 col-span-3">
                <Switch
                  id="visibility"
                  checked={formData.isPublic}
                  onCheckedChange={(checked) => handleChange('isPublic', checked)}
                />
                <Label htmlFor="visibility" className="font-normal">
                  {formData.isPublic ? "Public (visible par tous)" : "Privé (visible uniquement par vous)"}
                </Label>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="finance"
            >
              Soumettre
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ModelSubmissionDialog;
