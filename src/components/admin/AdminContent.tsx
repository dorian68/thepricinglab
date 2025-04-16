
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Search, Filter, PlusCircle, BookOpen, FileText, Layers, 
  Edit, Trash2, Eye, MoveUp, MoveDown, Tag
} from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { safeTranslate } from '../../utils/translationUtils';

// Mock courses data
const mockCourses = [
  { id: 1, title: 'Black-Scholes Model', type: 'Course', modules: 5, difficulty: 'Intermediate', status: 'Published' },
  { id: 2, title: 'Greeks Explained', type: 'Course', modules: 4, difficulty: 'Beginner', status: 'Published' },
  { id: 3, title: 'Implied Volatility', type: 'Course', modules: 3, difficulty: 'Advanced', status: 'Published' },
  { id: 4, title: 'Exotic Options', type: 'Course', modules: 6, difficulty: 'Advanced', status: 'Draft' },
  { id: 5, title: 'Option Strategies Quiz', type: 'Quiz', modules: 1, difficulty: 'Intermediate', status: 'Published' },
  { id: 6, title: 'Monte Carlo Simulation', type: 'Exercise', modules: 2, difficulty: 'Expert', status: 'Draft' },
];

const AdminContent = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [courses, setCourses] = useState(mockCourses);
  const [selectedContent, setSelectedContent] = useState(null);
  
  const handleAddContent = () => {
    // In a real application, this would add a new content item
    console.log('Add new content item');
  };
  
  const handleDeleteContent = (id) => {
    setCourses(courses.filter(course => course.id !== id));
  };
  
  const filteredCourses = courses.filter(course => 
    course.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-finance-accent">
          {safeTranslate(t, 'admin.contentManagement', 'Content Management')}
        </h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="flex items-center">
              <PlusCircle className="mr-2 h-4 w-4" />
              {safeTranslate(t, 'admin.addContent', 'Add Content')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] bg-finance-charcoal text-finance-offwhite">
            <DialogHeader>
              <DialogTitle className="text-finance-accent">{safeTranslate(t, 'admin.addNewContent', 'Add New Content')}</DialogTitle>
              <DialogDescription>
                {safeTranslate(t, 'admin.createNewContentDesc', 'Create a new course, module, or exercise')}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right">{safeTranslate(t, 'admin.contentType', 'Content Type')}</label>
                <Select defaultValue="course">
                  <SelectTrigger className="col-span-3 bg-finance-dark">
                    <SelectValue placeholder={safeTranslate(t, 'admin.selectContentType', 'Select content type')} />
                  </SelectTrigger>
                  <SelectContent className="bg-finance-dark text-finance-offwhite">
                    <SelectItem value="course">{safeTranslate(t, 'admin.course', 'Course')}</SelectItem>
                    <SelectItem value="module">{safeTranslate(t, 'admin.module', 'Module')}</SelectItem>
                    <SelectItem value="exercise">{safeTranslate(t, 'admin.exercise', 'Exercise')}</SelectItem>
                    <SelectItem value="quiz">{safeTranslate(t, 'admin.quiz', 'Quiz')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right">{safeTranslate(t, 'admin.title', 'Title')}</label>
                <Input className="col-span-3 bg-finance-dark" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right">{safeTranslate(t, 'admin.difficulty', 'Difficulty')}</label>
                <Select defaultValue="beginner">
                  <SelectTrigger className="col-span-3 bg-finance-dark">
                    <SelectValue placeholder={safeTranslate(t, 'admin.selectDifficulty', 'Select difficulty')} />
                  </SelectTrigger>
                  <SelectContent className="bg-finance-dark text-finance-offwhite">
                    <SelectItem value="beginner">{safeTranslate(t, 'admin.beginner', 'Beginner')}</SelectItem>
                    <SelectItem value="intermediate">{safeTranslate(t, 'admin.intermediate', 'Intermediate')}</SelectItem>
                    <SelectItem value="advanced">{safeTranslate(t, 'admin.advanced', 'Advanced')}</SelectItem>
                    <SelectItem value="expert">{safeTranslate(t, 'admin.expert', 'Expert')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right">{safeTranslate(t, 'admin.status', 'Status')}</label>
                <Select defaultValue="draft">
                  <SelectTrigger className="col-span-3 bg-finance-dark">
                    <SelectValue placeholder={safeTranslate(t, 'admin.selectStatus', 'Select status')} />
                  </SelectTrigger>
                  <SelectContent className="bg-finance-dark text-finance-offwhite">
                    <SelectItem value="draft">{safeTranslate(t, 'admin.draft', 'Draft')}</SelectItem>
                    <SelectItem value="published">{safeTranslate(t, 'admin.published', 'Published')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">{safeTranslate(t, 'admin.create', 'Create')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="flex flex-col gap-4 md:flex-row md:items-center mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={safeTranslate(t, 'admin.searchContent', 'Search content...')}
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={safeTranslate(t, 'admin.contentType', 'Content Type')} />
          </SelectTrigger>
          <SelectContent className="bg-finance-dark text-finance-offwhite">
            <SelectItem value="all">{safeTranslate(t, 'admin.all', 'All')}</SelectItem>
            <SelectItem value="course">{safeTranslate(t, 'admin.courses', 'Courses')}</SelectItem>
            <SelectItem value="module">{safeTranslate(t, 'admin.modules', 'Modules')}</SelectItem>
            <SelectItem value="exercise">{safeTranslate(t, 'admin.exercises', 'Exercises')}</SelectItem>
            <SelectItem value="quiz">{safeTranslate(t, 'admin.quizzes', 'Quizzes')}</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="all">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={safeTranslate(t, 'admin.status', 'Status')} />
          </SelectTrigger>
          <SelectContent className="bg-finance-dark text-finance-offwhite">
            <SelectItem value="all">{safeTranslate(t, 'admin.all', 'All')}</SelectItem>
            <SelectItem value="published">{safeTranslate(t, 'admin.published', 'Published')}</SelectItem>
            <SelectItem value="draft">{safeTranslate(t, 'admin.draft', 'Draft')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{safeTranslate(t, 'admin.title', 'Title')}</TableHead>
              <TableHead>{safeTranslate(t, 'admin.type', 'Type')}</TableHead>
              <TableHead>{safeTranslate(t, 'admin.modules', 'Modules')}</TableHead>
              <TableHead>{safeTranslate(t, 'admin.difficulty', 'Difficulty')}</TableHead>
              <TableHead>{safeTranslate(t, 'admin.status', 'Status')}</TableHead>
              <TableHead className="text-right">{safeTranslate(t, 'admin.actions', 'Actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCourses.map((course) => (
              <TableRow key={course.id}>
                <TableCell className="font-medium">{course.title}</TableCell>
                <TableCell>{course.type}</TableCell>
                <TableCell>{course.modules}</TableCell>
                <TableCell>{course.difficulty}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    course.status === 'Published' 
                      ? 'bg-green-100/20 text-green-400' 
                      : 'bg-amber-100/20 text-amber-400'
                  }`}>
                    {course.status}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-finance-charcoal text-finance-offwhite">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-finance-accent">
                            {safeTranslate(t, 'admin.deleteContent', 'Delete Content')}
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            {safeTranslate(t, 'admin.deleteContentConfirm', `Are you sure you want to delete "${course.title}"? This action cannot be undone.`)}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-finance-steel text-finance-offwhite hover:bg-finance-steel/80 hover:text-white">
                            {safeTranslate(t, 'admin.cancel', 'Cancel')}
                          </AlertDialogCancel>
                          <AlertDialogAction 
                            className="bg-red-600 text-white hover:bg-red-700"
                            onClick={() => handleDeleteContent(course.id)}
                          >
                            {safeTranslate(t, 'admin.delete', 'Delete')}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminContent;
