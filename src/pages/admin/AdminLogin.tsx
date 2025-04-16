
import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Lock, Shield } from 'lucide-react';
import { safeTranslate } from '../../utils/translationUtils';

const AdminLogin = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const handleLogin = (e) => {
    e.preventDefault();
    
    // In a real app, this would be a proper authentication check
    // For this demo, we'll use a hardcoded admin username/password
    if (username === 'admin' && password === 'admin123') {
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
            
            <form onSubmit={handleLogin}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <FormLabel htmlFor="username" className="text-finance-offwhite">
                    {safeTranslate(t, 'admin.username', 'Username')}
                  </FormLabel>
                  <Input
                    id="username"
                    type="text"
                    autoCapitalize="none"
                    autoCorrect="off"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-finance-dark text-finance-offwhite"
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <FormLabel htmlFor="password" className="text-finance-offwhite">
                      {safeTranslate(t, 'admin.password', 'Password')}
                    </FormLabel>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-finance-dark text-finance-offwhite"
                  />
                </div>
                <Button className="w-full mt-2 flex items-center justify-center" type="submit">
                  <Lock className="mr-2 h-4 w-4" />
                  {safeTranslate(t, 'admin.login', 'Login')}
                </Button>
              </div>
            </form>
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
