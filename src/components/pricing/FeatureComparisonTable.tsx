
import React from "react";
import { useTranslation } from "react-i18next";
import { Star, GraduationCap, Rocket, Check, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { safeTranslate } from "../../utils/translationUtils";

const FeatureComparisonTable = () => {
  const { t } = useTranslation();
  const st = (key: string, defaultValue: string) =>
    safeTranslate(t, key, defaultValue);

  const featureComparison = [
    {
      category: st('pricing.comparison.category1', 'Content Access'),
      features: [
        {
          name: st('pricing.comparison.fundamentals', 'Fundamentals Content'),
          freemium: true,
          student: true,
          pro: true
        },
        {
          name: st('pricing.comparison.intermediate', 'Intermediate Content'),
          freemium: false,
          student: true,
          pro: true
        },
        {
          name: st('pricing.comparison.advanced', 'Advanced Content'),
          freemium: false,
          student: false,
          pro: true
        }
      ]
    },
    {
      category: st('pricing.comparison.category2', 'Learning Tools'),
      features: [
        {
          name: st('pricing.comparison.basicExercises', 'Basic Exercises'),
          freemium: true,
          student: true,
          pro: true
        },
        {
          name: st('pricing.comparison.intermediateExercises', 'Intermediate Exercises'),
          freemium: false,
          student: true,
          pro: true
        },
        {
          name: st('pricing.comparison.advancedExercises', 'Advanced Exercises'),
          freemium: false,
          student: false,
          pro: true
        },
        {
          name: st('pricing.comparison.survivalMode', 'Survival Mode'),
          freemium: 'limited',
          student: true,
          pro: true
        }
      ]
    },
    {
      category: st('pricing.comparison.category3', 'Trading Tools'),
      features: [
        {
          name: st('pricing.comparison.basicTools', 'Basic Trading Tools'),
          freemium: true,
          student: true,
          pro: true
        },
        {
          name: st('pricing.comparison.advancedTools', 'Advanced Trading Tools'),
          freemium: false,
          student: true,
          pro: true
        },
        {
          name: st('pricing.comparison.notebooks', 'Interactive Notebooks'),
          freemium: false,
          student: true,
          pro: true
        }
      ]
    },
    {
      category: st('pricing.comparison.category4', 'Professional Features'),
      features: [
        {
          name: st('pricing.comparison.certificates', 'Course Certificates'),
          freemium: false,
          student: 'basic',
          pro: true
        },
        {
          name: st('pricing.comparison.linkedinIntegration', 'LinkedIn Integration'),
          freemium: false,
          student: false,
          pro: true
        },
        {
          name: st('pricing.comparison.performanceReports', 'Performance Reports'),
          freemium: false,
          student: true,
          pro: true
        },
        {
          name: st('pricing.comparison.projectChallenges', 'Project Challenges'),
          freemium: false,
          student: false,
          pro: true
        },
        {
          name: st('pricing.comparison.gptAssistant', 'AI Assistant'),
          freemium: false,
          student: false,
          pro: true
        }
      ]
    }
  ];

  const renderFeatureAvailability = (available: boolean | string) => {
    if (available === true) {
      return <Check className="h-5 w-5 text-green-500" />;
    } else if (available === false) {
      return <X className="h-5 w-5 text-gray-400" />;
    } else if (available === 'limited') {
      return <span className="text-xs text-yellow-400">Limited</span>;
    } else if (available === 'basic') {
      return <span className="text-xs text-blue-400">Basic</span>;
    }
    return available;
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-[#2A2F3C]">
            <TableHead className="text-left py-4 px-4 w-1/3 text-finance-offwhite">{st('pricing.comparison.feature', 'Feature')}</TableHead>
            <TableHead className="text-center py-4 px-4 w-1/5 text-finance-offwhite">
              <div className="flex flex-col items-center">
                <Star className="h-5 w-5 text-yellow-400 mb-2" />
                {st('pricing.freemium.title', 'Free')}
                <span className="text-[#8E9196] text-sm">{st('pricing.freemium.price', '0€')}</span>
              </div>
            </TableHead>
            <TableHead className="text-center py-4 px-4 w-1/5 text-finance-offwhite">
              <div className="flex flex-col items-center">
                <GraduationCap className="h-5 w-5 text-blue-400 mb-2" />
                {st('pricing.student.title', 'Student')}
                <span className="text-finance-accent text-sm">19€ / {st('pricing.monthly', 'Monthly')}</span>
              </div>
            </TableHead>
            <TableHead className="text-center py-4 px-4 w-1/5 text-finance-offwhite">
              <div className="flex flex-col items-center">
                <Rocket className="h-5 w-5 text-finance-accent mb-2" />
                {st('pricing.pro.title', 'Professional')}
                <span className="text-finance-accent text-sm">49€ / {st('pricing.monthly', 'Monthly')}</span>
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {featureComparison.map((category, categoryIndex) => (
            <React.Fragment key={categoryIndex}>
              <TableRow className="bg-[#1A1F2C]/30">
                <TableCell colSpan={4} className="py-3 px-4 font-medium text-finance-offwhite">{category.category}</TableCell>
              </TableRow>
              {category.features.map((feature, featureIndex) => (
                <TableRow
                  key={`${categoryIndex}-${featureIndex}`}
                  className="border-b border-[#2A2F3C]/30"
                >
                  <TableCell className="py-3 px-4 text-[#8E9196]">{feature.name}</TableCell>
                  <TableCell className="py-3 px-4 text-center">{renderFeatureAvailability(feature.freemium)}</TableCell>
                  <TableCell className="py-3 px-4 text-center">{renderFeatureAvailability(feature.student)}</TableCell>
                  <TableCell className="py-3 px-4 text-center">{renderFeatureAvailability(feature.pro)}</TableCell>
                </TableRow>
              ))}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default FeatureComparisonTable;
