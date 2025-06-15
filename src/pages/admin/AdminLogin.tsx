
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, Shield, AlertTriangle } from 'lucide-react';
import { safeTranslate } from '../../utils/translationUtils';

interface LoginFormValues {
  email: string;
  password: string;
}

const AdminLogin = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { signIn, user, isLoading } = useAuth();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<LoginFormValues>({
    defaultValues: {
      email: '',
      password: ''
    }
  });

  useEffect(() => {
    // If user is already logged in and is admin, redirect to dashboard
    if (!isLoading && user) {
      const userRole = user.user_metadata?.role;
      if (userRole === 'admin') {
        navigate('/admin-dashboard');
      } else {
        setError('Votre compte ne dispose pas des privilèges d\'administrateur');
      }
    }
  }, [user, isLoading, navigate]);
  
  const onSubmit = async (data: LoginFormValues) => {
    try {
      setIsSubmitting(true);
      setError('');
      
      await signIn(data.email, data.password);
      
      // The useEffect will handle the redirection based on user role
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Erreur de connexion');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <>
      <Helmet>
        <title>Admin Login | The Pricing Library</title>
      </Helmet>
      
      <div className="min-h-screen bg-finance-dark flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md bg-finance-charcoal border-finance-steel/30">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-6">
              <div className="p-3 rounded-full bg-finance-burgundy/20">
                <Shield className="h-8 w-8 text-finance-accent" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center text-finance-accent">
              {safeTranslate(t, 'admin.adminLogin', 'Administration')}
            </CardTitle>
            <CardDescription className="text-center text-finance-offwhite">
              {safeTranslate(t, 'admin.loginDesc', 'Connectez-vous avec vos identifiants administrateur')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert className="bg-red-500/20 border-red-500 text-red-500 mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-finance-offwhite">
                        {safeTranslate(t, 'admin.email', 'Email')}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="admin@example.com"
                          autoCapitalize="none"
                          autoCorrect="off"
                          className="bg-finance-dark text-finance-offwhite"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-finance-offwhite">
                        {safeTranslate(t, 'admin.password', 'Mot de passe')}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          className="bg-finance-dark text-finance-offwhite"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  className="w-full mt-2 flex items-center justify-center" 
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-finance-offwhite mr-2"></div>
                  ) : (
                    <Lock className="mr-2 h-4 w-4" />
                  )}
                  {safeTranslate(t, 'admin.login', 'Se connecter')}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-finance-steel">
              {safeTranslate(t, 'admin.secureAccess', 'Accès sécurisé pour les administrateurs uniquement')}
            </p>
          </CardFooter>
        </Card>
      </div>
    </>
  );
};

export default AdminLogin;
