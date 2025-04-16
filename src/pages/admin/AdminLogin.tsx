
import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Lock, Shield } from 'lucide-react';
import { safeTranslate } from '../../utils/translationUtils';

interface LoginFormValues {
  username: string;
  password: string;
}

const AdminLogin = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  
  // Initialize react-hook-form
  const form = useForm<LoginFormValues>({
    defaultValues: {
      username: '',
      password: ''
    }
  });
  
  const onSubmit = (data: LoginFormValues) => {
    // In a real app, this would be a proper authentication check
    // For this demo, we'll use a hardcoded admin username/password
    if (data.username === 'admin' && data.password === 'admin123') {
      // Store authentication in localStorage or a proper auth state
      localStorage.setItem('isAdminAuthenticated', 'true');
      navigate('/admin-dashboard');
    } else {
      setError(safeTranslate(t, 'admin.invalidCredentials', 'Invalid username or password'));
    }
  };
  
  return (
    <>
      <Helmet>
        <title>Admin Login | The Trading Lab</title>
      </Helmet>
      
      <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md bg-finance-charcoal border-finance-steel/30">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-6">
              <Shield className="h-12 w-12 text-finance-accent" />
            </div>
            <CardTitle className="text-2xl text-center text-finance-accent">
              {safeTranslate(t, 'admin.adminLogin', 'Admin Login')}
            </CardTitle>
            <CardDescription className="text-center text-finance-offwhite">
              {safeTranslate(t, 'admin.loginDesc', 'Enter your credentials to access the admin panel')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-500 p-3 rounded-md mb-4">
                {error}
              </div>
            )}
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-finance-offwhite">
                        {safeTranslate(t, 'admin.username', 'Username')}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="admin"
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
                        {safeTranslate(t, 'admin.password', 'Password')}
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
                
                <Button className="w-full mt-2 flex items-center justify-center" type="submit">
                  <Lock className="mr-2 h-4 w-4" />
                  {safeTranslate(t, 'admin.login', 'Login')}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-finance-steel">
              {safeTranslate(t, 'admin.secureAccess', 'Secure access for administrators only')}
            </p>
          </CardFooter>
        </Card>
      </div>
    </>
  );
};

export default AdminLogin;
