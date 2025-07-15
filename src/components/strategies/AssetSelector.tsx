
import React from 'react';
import { useTranslation } from 'react-i18next';
import { UnderlyingAsset, AssetType } from '@/types/strategies';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Plus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { safeTranslate } from '@/utils/translationUtils';

const ASSET_TYPES: { value: AssetType; label: string }[] = [
  { value: 'stock', label: 'Action' },
  { value: 'bond', label: 'Obligation' },
  { value: 'index', label: 'Indice' },
  { value: 'future', label: 'Future' },
  { value: 'option', label: 'Option' }
];

// Sample assets for each type
const SAMPLE_ASSETS: Record<AssetType, UnderlyingAsset[]> = {
  stock: [
    { id: 'aapl', name: 'Apple Inc.', type: 'stock', price: 180.5, volatility: 0.25 },
    { id: 'msft', name: 'Microsoft', type: 'stock', price: 320.2, volatility: 0.22 },
    { id: 'amzn', name: 'Amazon', type: 'stock', price: 150.8, volatility: 0.28 },
    { id: 'googl', name: 'Alphabet', type: 'stock', price: 140.3, volatility: 0.24 }
  ],
  bond: [
    { id: 't-10y', name: 'Treasury 10Y', type: 'bond', price: 98.7, volatility: 0.08 },
    { id: 'bund', name: 'German Bund', type: 'bond', price: 101.2, volatility: 0.07 },
    { id: 'oat', name: 'French OAT', type: 'bond', price: 100.5, volatility: 0.09 }
  ],
  index: [
    { id: 'spy', name: 'S&P 500 ETF', type: 'index', price: 450.7, volatility: 0.18 },
    { id: 'qqq', name: 'NASDAQ ETF', type: 'index', price: 380.4, volatility: 0.21 },
    { id: 'cac40', name: 'CAC 40', type: 'index', price: 7500.2, volatility: 0.19 }
  ],
  future: [
    { id: 'cl-fut', name: 'Crude Oil Future', type: 'future', price: 75.2, volatility: 0.32 },
    { id: 'gold-fut', name: 'Gold Future', type: 'future', price: 2150.5, volatility: 0.16 },
    { id: 'es-fut', name: 'E-mini S&P 500', type: 'future', price: 4520.0, volatility: 0.18 }
  ],
  option: [
    { id: 'aapl-call', name: 'AAPL 180 Call', type: 'option', price: 5.2, volatility: 0.30 },
    { id: 'spy-put', name: 'SPY 450 Put', type: 'option', price: 4.8, volatility: 0.25 }
  ]
};

interface AssetSelectorProps {
  assets: UnderlyingAsset[];
  onAssetAdded: (asset: UnderlyingAsset) => void;
  onAssetRemoved: (assetId: string) => void;
  onAssetUpdated: (updatedAsset: UnderlyingAsset) => void;
}

const AssetSelector: React.FC<AssetSelectorProps> = ({ 
  assets, 
  onAssetAdded, 
  onAssetRemoved,
  onAssetUpdated
}) => {
  const { t } = useTranslation();
  const st = (key: string, defaultValue: string) => safeTranslate(t, key, defaultValue);
  const [selectedType, setSelectedType] = React.useState<AssetType>('stock');
  const [selectedAssetId, setSelectedAssetId] = React.useState<string>('');

  const handleAssetSelection = (assetId: string) => {
    setSelectedAssetId(assetId);
    const selectedAsset = SAMPLE_ASSETS[selectedType].find(asset => asset.id === assetId);
    
    if (selectedAsset && !assets.find(a => a.id === assetId)) {
      // Clone the asset to avoid reference issues
      const assetToAdd = { ...selectedAsset };
      onAssetAdded(assetToAdd);
      setSelectedAssetId('');
    }
  };

  const handleAssetUpdate = (asset: UnderlyingAsset, field: keyof UnderlyingAsset, value: any) => {
    const updatedAsset = { ...asset, [field]: value };
    onAssetUpdated(updatedAsset);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-end gap-3">
        <div className="flex-1 space-y-2">
          <Label>{st('common.assetType', 'Type d\'actif')}</Label>
          <Select value={selectedType} onValueChange={(value: AssetType) => setSelectedType(value)}>
            <SelectTrigger>
              <SelectValue placeholder={st('common.selectAssetType', 'Sélectionner un type')} />
            </SelectTrigger>
            <SelectContent>
              {ASSET_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex-1 space-y-2">
          <Label>{st('common.instrument', 'Instrument')}</Label>
          <Select value={selectedAssetId} onValueChange={handleAssetSelection}>
            <SelectTrigger>
              <SelectValue placeholder={st('common.addInstrument', 'Ajouter un instrument')} />
            </SelectTrigger>
            <SelectContent>
              {SAMPLE_ASSETS[selectedType].map((asset) => (
                <SelectItem 
                  key={asset.id} 
                  value={asset.id}
                  disabled={assets.some(a => a.id === asset.id)}
                >
                  {asset.name} ({asset.price})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Button 
          variant="outline"
          className="flex items-center gap-1 mt-2 md:mt-0"
          onClick={() => {
            if (selectedAssetId) {
              handleAssetSelection(selectedAssetId);
            }
          }}
          disabled={!selectedAssetId || assets.some(a => a.id === selectedAssetId)}
        >
          <Plus className="h-4 w-4" />
          {st('common.add', 'Ajouter')}
        </Button>
      </div>

      {assets.length === 0 ? (
        <div className="bg-finance-charcoal p-4 rounded-md text-center text-finance-lightgray">
          Aucun sous-jacent sélectionné. Ajoutez au moins un actif pour commencer.
        </div>
      ) : (
        <div className="space-y-3">
          {assets.map((asset) => (
            <Card key={asset.id} className="bg-finance-charcoal">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{ASSET_TYPES.find(t => t.value === asset.type)?.label}</Badge>
                    <h4 className="font-medium">{asset.name}</h4>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onAssetRemoved(asset.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                  <div className="space-y-2">
                    <Label htmlFor={`price-${asset.id}`}>{st('common.price', 'Prix')}</Label>
                    <div className="flex items-center space-x-2">
                      <Input 
                        id={`price-${asset.id}`}
                        type="number" 
                        value={asset.price}
                        onChange={(e) => handleAssetUpdate(asset, 'price', parseFloat(e.target.value))}
                        min={0.01}
                        step={0.1}
                      />
                      <span>€</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`volatility-${asset.id}`} className="flex justify-between">
                      <span>{st('common.volatility', 'Volatilité')}</span>
                      <span className="text-finance-lightgray">
                        {(asset.volatility * 100).toFixed(1)}%
                      </span>
                    </Label>
                    <Slider
                      id={`volatility-${asset.id}`}
                      min={0.01}
                      max={1}
                      step={0.01}
                      value={[asset.volatility]}
                      onValueChange={([vol]) => handleAssetUpdate(asset, 'volatility', vol)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`dividend-${asset.id}`} className="flex justify-between">
                      <span>{st('common.dividend', 'Dividende')}</span>
                      <span className="text-finance-lightgray">
                        {((asset.dividendYield || 0) * 100).toFixed(2)}%
                      </span>
                    </Label>
                    <Slider
                      id={`dividend-${asset.id}`}
                      min={0}
                      max={0.1}
                      step={0.001}
                      value={[asset.dividendYield || 0]}
                      onValueChange={([div]) => handleAssetUpdate(asset, 'dividendYield', div)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`interest-${asset.id}`} className="flex justify-between">
                      <span>{st('common.interestRate', 'Taux d\'intérêt')}</span>
                      <span className="text-finance-lightgray">
                        {((asset.interestRate || 0.05) * 100).toFixed(2)}%
                      </span>
                    </Label>
                    <Slider
                      id={`interest-${asset.id}`}
                      min={0}
                      max={0.2}
                      step={0.001}
                      value={[asset.interestRate || 0.05]}
                      onValueChange={([rate]) => handleAssetUpdate(asset, 'interestRate', rate)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AssetSelector;
