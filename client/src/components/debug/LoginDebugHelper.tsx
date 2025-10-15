import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export function LoginDebugHelper() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, user } = useAuth();
  const { toast } = useToast();
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Debug login attempt:', { username, password });
    try {
      setIsLoading(true);
      const result = await login(username, password);
      if (!result.success) {
        toast({
          title: "Login failed",
          description: result.message || "Invalid credentials",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error('Login error:', err);
      toast({
        title: "Login error",
        description: "An unexpected error occurred during login",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mt-4 mx-auto">
      <CardHeader>
        <CardTitle>Debug Login</CardTitle>
      </CardHeader>
      <CardContent>
        {user ? (
          <div className="text-sm space-y-2">
            <p className="font-medium">Currently logged in as:</p>
            <pre className="bg-muted p-2 rounded overflow-auto text-xs">
              {JSON.stringify(user, null, 2)}
            </pre>
            <p className="text-xs text-muted-foreground mt-2">
              User ID: {user.id}, Role: {user.role}
            </p>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input 
                id="username" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Log In'}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}