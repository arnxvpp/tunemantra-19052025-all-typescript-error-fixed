import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { TestCredentialsHelper } from '@/components/debug/TestCredentialsHelper';
import { DebugNavigation } from '@/components/debug/DebugNavigation';

export default function LoginDebugPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, logout, user } = useAuth();
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
      } else {
        toast({
          title: "Login successful",
          description: `Logged in as ${username}`,
          variant: "default"
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

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
        variant: "default"
      });
    } catch (err) {
      console.error('Logout error:', err);
      toast({
        title: "Logout error",
        description: "An error occurred during logout",
        variant: "destructive"
      });
    }
  };

  const handleSelectCredential = (username: string, password: string) => {
    setUsername(username);
    setPassword(password);
    toast({
      title: "Credentials selected",
      description: `Username: ${username} / Password: ${password}`,
      variant: "default"
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 bg-background">
      <div className="w-full max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">TuneMantra Debug Login</h1>
          <p className="text-muted-foreground">Use this page to test various user roles and permissions</p>
          <Separator className="my-6" />
        </div>

        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Authentication Test</CardTitle>
            <CardDescription>
              {user ? 'Currently authenticated' : 'Sign in with any account'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {user ? (
              <div className="space-y-4">
                <div className="text-sm space-y-2">
                  <p className="font-medium">Currently logged in as:</p>
                  <pre className="bg-muted p-2 rounded overflow-auto text-xs">
                    {JSON.stringify(user, null, 2)}
                  </pre>
                  <div className="flex items-center gap-x-2 mt-2">
                    <span className="text-xs font-medium">User ID:</span>
                    <span className="text-xs text-muted-foreground">{user.id}</span>
                    <span className="text-xs font-medium ml-4">Role:</span>
                    <span className="text-xs text-muted-foreground">{user.role}</span>
                  </div>
                </div>
                <Button 
                  onClick={handleLogout}
                  variant="outline" 
                  className="w-full"
                >
                  Log Out
                </Button>
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

        {!user && (
          <TestCredentialsHelper onSelectCredential={handleSelectCredential} />
        )}
        
        {user && <DebugNavigation />}
      </div>
    </div>
  );
}