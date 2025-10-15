import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Lock, ShieldAlert, Loader2 } from 'lucide-react';
import { LampContainer } from '@/components/ui/lamp';
import { motion } from 'framer-motion';
import { useAdminAuth } from '@/hooks/use-admin-auth';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registrationCode, setRegistrationCode] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { login, isLoading: authLoading, isAuthenticated } = useAdminAuth();
  
  // Extract the intended destination from URL if it exists
  const params = new URLSearchParams(window.location.search);
  const returnTo = params.get('returnTo') || '/admin/dashboard';

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      console.log('Already authenticated as admin, redirecting to dashboard');
      window.location.href = returnTo;
    }
  }, [isAuthenticated, returnTo]);

  // Combine local and auth loading states
  const isLoading = localLoading || authLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalLoading(true);

    try {
      if (isRegistering) {
        // Registration is not implemented in the current version
        toast({
          title: 'Registration not available',
          description: 'Please contact the system administrator for an account.',
          variant: 'destructive',
        });
        setLocalLoading(false);
        return;
      }

      // Use the admin auth hook for login
      const result = await login(username, password);

      if (!result.success) {
        throw new Error(result.message || 'Authentication failed. Please check your credentials.');
      }

      // Success notification is handled by the hook

      console.log(`Authentication successful, redirecting to ${returnTo}...`);
      // The hook handles redirection

    } catch (error: any) {
      console.error('Authentication error:', error);
      toast({
        title: 'Authentication Error',
        description: error.message || 'Failed to authenticate. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <LampContainer className="min-h-screen">
      <div className="relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="mb-8 text-center"
        >
          <motion.h1 
            initial={{ opacity: 0.5, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6, ease: "easeInOut" }}
            className="bg-gradient-to-br from-cyan-300 to-cyan-600 py-4 bg-clip-text text-center text-4xl font-medium tracking-tight text-transparent md:text-7xl"
          >
            TuneMantra <br /> Admin Portal
          </motion.h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          <Card className="w-full max-w-md bg-black/60 backdrop-blur-sm border-slate-800">
            <CardHeader className="space-y-1">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.5 }}
                className="flex items-center justify-center mb-2"
              >
                <ShieldAlert size={48} className="text-cyan-400" />
              </motion.div>
              <CardTitle className="text-2xl text-center text-white">
                Admin {isRegistering ? 'Registration' : 'Login'}
              </CardTitle>
              <CardDescription className="text-center text-slate-300">
                {isRegistering
                  ? 'Create a new admin account'
                  : 'Enter your credentials to access the Admin dashboard'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-slate-300">Username</Label>
                  <Input
                    id="username"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="bg-slate-900/70 border-slate-700 text-white"
                  />
                </div>

                {isRegistering && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-slate-300">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="bg-slate-900/70 border-slate-700 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="registrationCode" className="text-slate-300">Registration Code</Label>
                      <Input
                        id="registrationCode"
                        type="password"
                        placeholder="Enter registration code"
                        value={registrationCode}
                        onChange={(e) => setRegistrationCode(e.target.value)}
                        required
                        className="bg-slate-900/70 border-slate-700 text-white"
                      />
                      <p className="text-xs text-slate-400">
                        The registration code is required to create an admin account.
                      </p>
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-300">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-slate-900/70 border-slate-700 text-white"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-cyan-500 hover:bg-cyan-600 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>Loading...</>
                  ) : isRegistering ? (
                    'Register'
                  ) : (
                    'Login'
                  )}
                </Button>
              </form>
            </CardContent>
            <CardFooter>
              <Button
                variant="link"
                className="w-full text-slate-300 hover:text-white"
                onClick={() => setIsRegistering(!isRegistering)}
                disabled={isLoading}
              >
                {isRegistering
                  ? 'Already have an account? Login'
                  : 'Need to create an account? Register'}
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </LampContainer>
  );
}