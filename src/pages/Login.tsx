
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { LogIn, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('Sending login request with:', formData);
      
      const response = await fetch('https://fastwapi.com/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      console.log('Login API response:', data);

      if (response.ok && data.status === true) {
        // Handle successful login - API returns user data directly in response
        const userData = {
          id: data.id.toString(),
          email: data.email,
          name: data.name
        };
        
        console.log('Login successful, user data:', userData);
        login(userData, data.token);
        toast.success('Login successful!');
        navigate('/');
      } else {
        console.log('Login failed:', data);
        toast.error(data.errMsg || data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-green-100 rounded-full">
              <LogIn className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-green-600">FastWAPI</CardTitle>
          <CardDescription>
            Sign in to your account to access WhatsApp Business API
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>Don't have an account?</p>
            <a 
              href="https://fastwapi.com/register" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-green-600 hover:text-green-700 font-medium"
            >
              Register on FastWAPI.com
            </a>
          </div>

          <div className="mt-4 text-center text-sm text-gray-500">
            <a 
              href="https://fastwapi.com/forgot-password" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-green-600"
            >
              Forgot your password?
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
