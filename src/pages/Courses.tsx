
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet-async";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight, LockIcon, BookOpen, Sparkles, Star, Award, Zap } from "lucide-react";
import { SubscriptionPlan } from "@/data/survival-waves";
import { safeTranslate } from "../utils/translationUtils";

const Courses = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState("fundamentals");
  const [userPlan] = useState<SubscriptionPlan>("freemium"); // Simulate user's current plan
  
  // Helper function to check if course is available for user's plan
  const isCourseAvailable = (requiredPlan: SubscriptionPlan): boolean => {
    if (requiredPlan === "freemium") return true;
    if (requiredPlan === "student" && (userPlan === "student" || userPlan === "pro")) return true;
    if (requiredPlan === "pro" && userPlan === "pro") return true;
    return false;
  };

  const courses = {
    fundamentals: [
      {
        title: safeTranslate(t, 'coursesPage.fundamentals.blackScholes.title', "Black-Scholes Model"),
        description: safeTranslate(t, 'coursesPage.fundamentals.blackScholes.description', "Master the foundational option pricing model"),
        image: "https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?q=80&w=1740&auto=format&fit=crop",
        url: "/courses/fundamentals/black-scholes",
        level: safeTranslate(t, 'coursesPage.beginner', "Beginner"),
        duration: "2h 30m",
        modules: 6,
        plan: "freemium" as SubscriptionPlan,
      },
      {
        title: safeTranslate(t, 'coursesPage.fundamentals.yieldCurves.title', "Yield Curves"),
        description: safeTranslate(t, 'coursesPage.fundamentals.yieldCurves.description', "Understand interest rates and yield curves"),
        image: "https://images.unsplash.com/photo-1569025690938-a00729c9e1f9?q=80&w=1740&auto=format&fit=crop",
        url: "/courses/fundamentals/yield-curves",
        level: safeTranslate(t, 'coursesPage.beginner', "Beginner"),
        duration: "2h",
        modules: 5,
        plan: "freemium" as SubscriptionPlan,
      },
      {
        title: safeTranslate(t, 'coursesPage.fundamentals.greeks.title', "Option Greeks"),
        description: safeTranslate(t, 'coursesPage.fundamentals.greeks.description', "Master Delta, Gamma, Theta, Vega, and Rho"),
        image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1740&auto=format&fit=crop",
        url: "/courses/fundamentals/greeks",
        level: safeTranslate(t, 'coursesPage.intermediate', "Intermediate"),
        duration: "3h",
        modules: 7,
        plan: "freemium" as SubscriptionPlan,
      }
    ],
    advanced: [
      {
        title: safeTranslate(t, 'coursesPage.advanced.impliedVol.title', "Implied Volatility Analysis"),
        description: safeTranslate(t, 'coursesPage.advanced.impliedVol.description', "Understanding and analyzing implied volatility across strike prices and maturities"),
        image: "https://images.unsplash.com/photo-1607799632518-da91dd151b38?q=80&w=1740&auto=format&fit=crop",
        url: "/courses/advanced/implied-vol",
        level: safeTranslate(t, 'coursesPage.intermediate', "Intermediate"),
        duration: "4h",
        modules: 8,
        plan: "student" as SubscriptionPlan,
      },
      {
        title: safeTranslate(t, 'coursesPage.advanced.volProducts.title', "Volatility Products"),
        description: safeTranslate(t, 'coursesPage.advanced.volProducts.description', "Trade and invest in volatility through specialized financial products"),
        image: "https://images.unsplash.com/photo-1642790035755-07ddc698ca36?q=80&w=1740&auto=format&fit=crop",
        url: "/courses/advanced/vol-products",
        level: safeTranslate(t, 'coursesPage.advanced', "Advanced"),
        duration: "3h 30m",
        modules: 6,
        plan: "student" as SubscriptionPlan,
      },
      {
        title: safeTranslate(t, 'coursesPage.advanced.hedging.title', "Advanced Hedging Strategies"),
        description: safeTranslate(t, 'coursesPage.advanced.hedging.description', "Implement sophisticated hedging techniques for complex portfolios"),
        image: "https://images.unsplash.com/photo-1524334591525-d1d9f3f5cf7a?q=80&w=1740&auto=format&fit=crop",
        url: "/courses/advanced/hedging-strategies",
        level: safeTranslate(t, 'coursesPage.advanced', "Advanced"),
        duration: "4h 15m",
        modules: 9,
        plan: "student" as SubscriptionPlan,
      }
    ],
    complex: [
      {
        title: safeTranslate(t, 'coursesPage.complex.exotic.title', "Exotic Options"),
        description: safeTranslate(t, 'coursesPage.complex.exotic.description', "Price and analyze path-dependent and multi-asset derivatives"),
        image: "https://images.unsplash.com/photo-1614583225154-5fcdda07019e?q=80&w=1752&auto=format&fit=crop",
        url: "/courses/complex/exotic-options",
        level: safeTranslate(t, 'coursesPage.expert', "Expert"),
        duration: "5h",
        modules: 10,
        plan: "pro" as SubscriptionPlan,
      },
      {
        title: safeTranslate(t, 'coursesPage.complex.monteCarlo.title', "Monte Carlo Methods"),
        description: safeTranslate(t, 'coursesPage.complex.monteCarlo.description', "Master simulation-based pricing and risk management techniques"),
        image: "https://images.unsplash.com/photo-1605792657660-596af9009e82?q=80&w=1742&auto=format&fit=crop",
        url: "/courses/complex/monte-carlo",
        level: safeTranslate(t, 'coursesPage.expert', "Expert"),
        duration: "6h",
        modules: 12,
        plan: "pro" as SubscriptionPlan,
      },
      {
        title: safeTranslate(t, 'coursesPage.complex.stochastic.title', "Stochastic Calculus"),
        description: safeTranslate(t, 'coursesPage.complex.stochastic.description', "Apply advanced mathematical techniques to financial modeling"),
        image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1740&auto=format&fit=crop",
        url: "/courses/complex/stochastic-calculus",
        level: safeTranslate(t, 'coursesPage.expert', "Expert"),
        duration: "8h",
        modules: 15,
        plan: "pro" as SubscriptionPlan,
      }
    ]
  };
  
  // Helper function to render course cards
  const renderCourseCard = (course) => {
    const isAvailable = isCourseAvailable(course.plan);
    
    return (
      <Card key={course.title} className="overflow-hidden">
        <div className="relative h-48 overflow-hidden">
          <img 
            src={course.image} 
            alt={course.title}
            className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
          />
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-black/30 to-transparent"></div>
          <div className="absolute top-3 right-3">
            <Badge variant={course.plan === "freemium" ? "default" : course.plan === "student" ? "secondary" : "destructive"}>
              {course.plan === "freemium" ? safeTranslate(t, 'pricing.freemium.badge', "Free") : 
               course.plan === "student" ? safeTranslate(t, 'pricing.student.badge', "Student") : 
               safeTranslate(t, 'pricing.pro.badge', "Pro")}
            </Badge>
          </div>
        </div>
        
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle>{course.title}</CardTitle>
          </div>
          <CardDescription>{course.description}</CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center">
              <BookOpen className="mr-1 h-4 w-4 opacity-70" />
              <span>{course.modules} modules</span>
            </div>
            <div className="flex items-center">
              <Sparkles className="mr-1 h-4 w-4 opacity-70" />
              <span>{course.level}</span>
            </div>
            <div className="flex items-center">
              <Zap className="mr-1 h-4 w-4 opacity-70" />
              <span>{course.duration}</span>
            </div>
          </div>
        </CardContent>
        
        <CardFooter>
          {isAvailable ? (
            <Button className="w-full" asChild>
              <Link to={course.url}>
                {safeTranslate(t, 'coursesPage.startCourse', "Start Course")} <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button variant="outline" className="w-full" asChild>
              <Link to="/pricing">
                <LockIcon className="mr-2 h-4 w-4" /> {safeTranslate(t, 'coursesPage.unlock', "Unlock")}
              </Link>
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{safeTranslate(t, 'coursesPage.title', "Courses")} | The Pricing Lab</title>
        <meta name="description" content={safeTranslate(t, 'coursesPage.description', "Interactive courses on quantitative finance, options pricing, and trading strategies")} />
      </Helmet>
      
      <Navbar />
      
      <main className="container mx-auto px-4 py-10">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">{safeTranslate(t, 'coursesPage.title', "Courses")}</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {safeTranslate(t, 'coursesPage.subtitle', "From fundamental concepts to advanced techniques in quantitative finance")}
          </p>
        </div>
        
        <Tabs defaultValue="fundamentals" className="mb-12" value={selectedTab} onValueChange={setSelectedTab}>
          <div className="flex justify-center mb-8">
            <TabsList className="grid grid-cols-3 w-full max-w-md">
              <TabsTrigger value="fundamentals" className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                <span className="hidden sm:inline">{safeTranslate(t, 'coursesPage.fundamentals.tab', "Fundamentals")}</span>
              </TabsTrigger>
              <TabsTrigger value="advanced" className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                <span className="hidden sm:inline">{safeTranslate(t, 'coursesPage.advanced.tab', "Advanced")}</span>
              </TabsTrigger>
              <TabsTrigger value="complex" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                <span className="hidden sm:inline">{safeTranslate(t, 'coursesPage.complex.tab', "Complex")}</span>
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="fundamentals">
            <h2 className="text-2xl font-bold mb-6">{safeTranslate(t, 'coursesPage.fundamentals.title', "Fundamental Concepts")}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.fundamentals.map(renderCourseCard)}
            </div>
          </TabsContent>
          
          <TabsContent value="advanced">
            <h2 className="text-2xl font-bold mb-6">{safeTranslate(t, 'coursesPage.advanced.title', "Advanced Techniques")}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.advanced.map(renderCourseCard)}
            </div>
          </TabsContent>
          
          <TabsContent value="complex">
            <h2 className="text-2xl font-bold mb-6">{safeTranslate(t, 'coursesPage.complex.title', "Complex Methods")}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.complex.map(renderCourseCard)}
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="py-10 px-6 rounded-lg bg-muted/50 text-center mb-12">
          <h2 className="text-2xl font-bold mb-4">{safeTranslate(t, 'coursesPage.learning.title', "Continue Your Learning")}</h2>
          <p className="text-lg max-w-3xl mx-auto mb-6">{safeTranslate(t, 'coursesPage.learning.subtitle', "Explore other ways to improve your quantitative finance skills")}</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button variant="outline" asChild>
              <Link to="/mentoring">
                {safeTranslate(t, 'coursesPage.learning.mentoring', "1-on-1 Mentoring")}
              </Link>
            </Button>
            <Button asChild>
              <Link to="/exercises">
                {safeTranslate(t, 'coursesPage.learning.practice', "Practice Exercises")}
              </Link>
            </Button>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Courses;
