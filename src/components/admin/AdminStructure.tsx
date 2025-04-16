
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { 
  Layers, Settings, Menu, Edit, MoveUp, MoveDown, 
  Eye, EyeOff, ChevronRight, ChevronDown, Pencil, Save
} from 'lucide-react';
import { safeTranslate } from '../../utils/translationUtils';

// Mock menu structure
const mockMenuItems = [
  { 
    id: 1, 
    name: 'Home', 
    path: '/', 
    visible: true, 
    children: [] 
  },
  { 
    id: 2, 
    name: 'Courses', 
    path: '/courses', 
    visible: true,
    children: [
      { id: 21, name: 'Black-Scholes', path: '/courses/black-scholes', visible: true },
      { id: 22, name: 'Greeks', path: '/courses/greeks', visible: true },
      { id: 23, name: 'Implied Vol', path: '/courses/implied-vol', visible: true },
    ] 
  },
  { 
    id: 3, 
    name: 'Trading Lab', 
    path: '/trading', 
    visible: true,
    children: [
      { id: 31, name: 'Strategies', path: '/trading/strategies', visible: true },
      { id: 32, name: 'Backtest', path: '/trading/backtest', visible: true },
      { id: 33, name: 'Scenarios', path: '/trading/scenarios', visible: true },
    ] 
  },
  { 
    id: 4, 
    name: 'Tools', 
    path: '/tools', 
    visible: true,
    children: [] 
  },
  { 
    id: 5, 
    name: 'Community', 
    path: '/community', 
    visible: true,
    children: [] 
  },
];

// Mock site text
const mockSiteText = [
  { id: 1, key: 'site.title', value: 'The Trading Lab', description: 'Site title' },
  { id: 2, key: 'site.description', value: 'Advanced options trading platform for learning and practice', description: 'Meta description' },
  { id: 3, key: 'home.hero.title', value: 'Master Options Trading', description: 'Homepage hero title' },
  { id: 4, key: 'home.hero.subtitle', value: 'Learn, practice, and excel with our advanced tools', description: 'Homepage hero subtitle' },
  { id: 5, key: 'login.welcomeMessage', value: 'Welcome back to The Trading Lab', description: 'Login page welcome message' },
];

const AdminStructure = () => {
  const { t } = useTranslation();
  const [menuItems, setMenuItems] = useState(mockMenuItems);
  const [siteText, setSiteText] = useState(mockSiteText);
  const [expandedItems, setExpandedItems] = useState([2, 3]);
  const [editingTextId, setEditingTextId] = useState(null);
  const [editedTextValue, setEditedTextValue] = useState('');
  
  const toggleItemVisibility = (itemId, parentId = null) => {
    if (parentId === null) {
      // Top level item
      setMenuItems(menuItems.map(item => 
        item.id === itemId ? { ...item, visible: !item.visible } : item
      ));
    } else {
      // Child item
      setMenuItems(menuItems.map(item => 
        item.id === parentId ? {
          ...item,
          children: item.children.map(child => 
            child.id === itemId ? { ...child, visible: !child.visible } : child
          )
        } : item
      ));
    }
  };
  
  const toggleExpandItem = (itemId) => {
    if (expandedItems.includes(itemId)) {
      setExpandedItems(expandedItems.filter(id => id !== itemId));
    } else {
      setExpandedItems([...expandedItems, itemId]);
    }
  };
  
  const handleEditText = (id, value) => {
    setEditingTextId(id);
    setEditedTextValue(value);
  };
  
  const handleSaveText = (id) => {
    setSiteText(siteText.map(text => 
      text.id === id ? { ...text, value: editedTextValue } : text
    ));
    setEditingTextId(null);
  };
  
  const moveItem = (itemId, direction, parentId = null) => {
    if (parentId === null) {
      // Top level item
      const currentIndex = menuItems.findIndex(item => item.id === itemId);
      if ((direction === 'up' && currentIndex > 0) || 
          (direction === 'down' && currentIndex < menuItems.length - 1)) {
        const newItems = [...menuItems];
        const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        [newItems[currentIndex], newItems[targetIndex]] = [newItems[targetIndex], newItems[currentIndex]];
        setMenuItems(newItems);
      }
    } else {
      // Child item
      const parentIndex = menuItems.findIndex(item => item.id === parentId);
      if (parentIndex !== -1) {
        const children = [...menuItems[parentIndex].children];
        const currentIndex = children.findIndex(child => child.id === itemId);
        if ((direction === 'up' && currentIndex > 0) || 
            (direction === 'down' && currentIndex < children.length - 1)) {
          const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
          [children[currentIndex], children[targetIndex]] = [children[targetIndex], children[currentIndex]];
          
          const newItems = [...menuItems];
          newItems[parentIndex] = { ...newItems[parentIndex], children };
          setMenuItems(newItems);
        }
      }
    }
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-finance-accent">
          {safeTranslate(t, 'admin.structureManagement', 'Structure Management')}
        </h2>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-finance-accent flex items-center">
              <Menu className="mr-2 h-5 w-5" />
              {safeTranslate(t, 'admin.menuStructure', 'Menu Structure')}
            </h3>
            <Button size="sm">
              {safeTranslate(t, 'admin.saveChanges', 'Save Changes')}
            </Button>
          </div>
          
          <div className="rounded-md border p-4 bg-finance-dark">
            <ul className="space-y-2">
              {menuItems.map((item) => (
                <li key={item.id} className="border-b border-finance-steel/20 pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {item.children.length > 0 && (
                        <button 
                          onClick={() => toggleExpandItem(item.id)} 
                          className="mr-2 text-finance-offwhite hover:text-finance-accent"
                        >
                          {expandedItems.includes(item.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                      )}
                      <span className="text-finance-offwhite font-medium">{item.name}</span>
                      <span className="ml-2 text-finance-steel text-sm">{item.path}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => moveItem(item.id, 'up')}
                        className="h-8 w-8"
                      >
                        <MoveUp className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => moveItem(item.id, 'down')}
                        className="h-8 w-8"
                      >
                        <MoveDown className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <div className="flex items-center space-x-2">
                        <Switch 
                          checked={item.visible} 
                          onCheckedChange={() => toggleItemVisibility(item.id)} 
                        />
                        {item.visible ? (
                          <Eye className="h-4 w-4 text-finance-offwhite" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-finance-steel" />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {expandedItems.includes(item.id) && item.children.length > 0 && (
                    <ul className="pl-6 mt-2 space-y-2">
                      {item.children.map((child) => (
                        <li key={child.id} className="border-t border-finance-steel/10 pt-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <span className="text-finance-offwhite">{child.name}</span>
                              <span className="ml-2 text-finance-steel text-sm">{child.path}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => moveItem(child.id, 'up', item.id)}
                                className="h-7 w-7"
                              >
                                <MoveUp className="h-3 w-3" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => moveItem(child.id, 'down', item.id)}
                                className="h-7 w-7"
                              >
                                <MoveDown className="h-3 w-3" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <div className="flex items-center space-x-2">
                                <Switch 
                                  checked={child.visible}
                                  size="sm"
                                  onCheckedChange={() => toggleItemVisibility(child.id, item.id)}
                                />
                                {child.visible ? (
                                  <Eye className="h-3 w-3 text-finance-offwhite" />
                                ) : (
                                  <EyeOff className="h-3 w-3 text-finance-steel" />
                                )}
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-finance-accent flex items-center">
              <Settings className="mr-2 h-5 w-5" />
              {safeTranslate(t, 'admin.siteTextManagement', 'Site Text Management')}
            </h3>
            <Button size="sm">
              {safeTranslate(t, 'admin.saveAllText', 'Save All Text')}
            </Button>
          </div>
          
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{safeTranslate(t, 'admin.key', 'Key')}</TableHead>
                  <TableHead>{safeTranslate(t, 'admin.value', 'Value')}</TableHead>
                  <TableHead>{safeTranslate(t, 'admin.description', 'Description')}</TableHead>
                  <TableHead className="w-[100px]">{safeTranslate(t, 'admin.actions', 'Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {siteText.map((text) => (
                  <TableRow key={text.id}>
                    <TableCell className="font-medium">{text.key}</TableCell>
                    <TableCell>
                      {editingTextId === text.id ? (
                        <Input 
                          value={editedTextValue} 
                          onChange={(e) => setEditedTextValue(e.target.value)}
                          className="bg-finance-dark"
                        />
                      ) : (
                        text.value
                      )}
                    </TableCell>
                    <TableCell className="text-finance-steel">{text.description}</TableCell>
                    <TableCell>
                      {editingTextId === text.id ? (
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleSaveText(text.id)}
                          className="h-8 w-8"
                        >
                          <Save className="h-4 w-4 text-green-400" />
                        </Button>
                      ) : (
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleEditText(text.id, text.value)}
                          className="h-8 w-8"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminStructure;
