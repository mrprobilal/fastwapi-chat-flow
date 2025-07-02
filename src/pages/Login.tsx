
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { LogIn, Eye, EyeOff, AlertCircle, Key } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { creativepixelsService } from '@/services/creativepixelsService';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [apiToken, setApiToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionError, setConnectionError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setConnectionError(false);

    if (!apiToken.trim()) {
      toast.error('Please enter your API Access Token');
      setIsLoading(false);
      return;
    }

    try {
      console.log('Attempting login with Creative Pixels API token...');
      
      const response = await creativepixelsService.loginWithToken(apiToken.trim());
      console.log('Creative Pixels login response:', response);

      if (response.status === true && response.token) {
        const userData = {
          id: '1',
          email: 'user@creativepixels.site',
          name: 'Creative Pixels User'
        };
        
        console.log('Login successful, user data:', userData);
        login(userData, response.token);
        toast.success('Authentication successful!');
        navigate('/');
      } else {
        console.log('Login failed:', response);
        toast.error(response.message || 'Authentication failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setConnectionError(true);
      
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Authentication failed. Please check your API token.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Key className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-blue-600">Creative Pixels</CardTitle>
          <CardDescription>
            Enter your API Access Token to connect to Creative Pixels
          </CardDescription>
        </CardHeader>
        <CardContent>
          {connectionError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <div className="text-sm text-red-700">
                <p className="font-medium">Authentication Failed</p>
                <p>Please check your API Access Token and try again.</p>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiToken">API Access Token</Label>
              <div className="relative">
                <Input
                  id="apiToken"
                  name="apiToken"
                  type={showToken ? 'text' : 'password'}
                  placeholder="Enter your Creative Pixels API token"
                  value={apiToken}
                  onChange={(e) => setApiToken(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={isLoading}
                >
                  {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                You can find your API token in your Creative Pixels dashboard
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={isLoading}
            >
              {isLoading ? 'Authenticating...' : 'Connect'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>Need an API token?</p>
            <a 
              href="https://creativepixels.site" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Visit Creative Pixels
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
