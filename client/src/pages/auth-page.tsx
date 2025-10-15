import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { LampContainer } from '@/components/ui/lamp';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CheckCircle, Music, Users, Building2 } from 'lucide-react';
import { PaymentModal } from '@/components/payment/PaymentModal';

// Subscription plans data from the middleware
const SUBSCRIPTION_PLANS = {
  label: {
    name: "Label Plan",
    displayName: "Label",
    maxArtists: "Unlimited",
    maxReleases: "Unlimited per year",
    maxTracks: "Unlimited per year",
    maxFileSize: "2GB",
    yearlyPriceInINR: 6000,
    icon: <Building2 className="h-5 w-5" />,
    features: [
      "Unlimited primary artists",
      "Unlimited releases and tracks per year",
      "Manage sub-labels",
      "Team management",
      "Advanced royalty splits",
      "Priority support"
    ]
  },
  artist_manager: {
    name: "Artist Manager Plan",
    displayName: "Artist Manager",
    maxArtists: "10",
    maxReleases: "Unlimited per year",
    maxTracks: "Unlimited per year",
    maxFileSize: "500MB",
    yearlyPriceInINR: 2499,
    icon: <Users className="h-5 w-5" />,
    features: [
      "Up to 10 primary artists",
      "Unlimited releases and tracks per year",
      "Artist management",
      "Content approval",
      "Analytics access"
    ]
  },
  artist: {
    name: "Artist Plan",
    displayName: "Artist",
    maxArtists: "1",
    maxReleases: "Unlimited per year",
    maxTracks: "Unlimited per year",
    maxFileSize: "200MB",
    yearlyPriceInINR: 999,
    icon: <Music className="h-5 w-5" />,
    features: [
      "1 primary artist",
      "Unlimited releases and tracks per year",
      "Basic analytics",
      "Distribution management"
    ]
  },
  free: {
    name: "Free Trial",
    displayName: "Free Trial",
    maxArtists: "1",
    maxReleases: "1 per month",
    maxTracks: "1 per month",
    maxFileSize: "50MB",
    yearlyPriceInINR: 0,
    icon: <Music className="h-5 w-5" />,
    features: [
      "1 primary artist",
      "1 release and 1 track per month",
      "Basic analytics",
      "7-day trial"
    ]
  }
};

export default function AuthPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const [selectedPlan, setSelectedPlan] = useState('free');
  const [selectedRole, setSelectedRole] = useState('artist');
  const [registrationStep, setRegistrationStep] = useState(1);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [registeredUserId, setRegisteredUserId] = useState<number | null>(null);
  const auth = useAuth();
  const { toast } = useToast();

  // Auto-redirect if user is already logged in and not in payment process
  useEffect(() => {
    if (auth.user && !showPaymentModal) {
      setLocation('/');
    }
  }, [auth.user, showPaymentModal, setLocation]);

  // Handle role selection logic
  const handleRoleChange = (role: string) => {
    setSelectedRole(role);
    // Set default plan based on role
    switch (role) {
      case 'label':
        setSelectedPlan('label');
        break;
      case 'artist_manager':
        setSelectedPlan('artist_manager');
        break;
      case 'artist':
        setSelectedPlan('artist');
        break;
      default:
        setSelectedPlan('free');
    }
  };

  // Next step in registration
  const goToNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (registrationStep < 3) {
      setRegistrationStep(registrationStep + 1);
    }
  };

  // Previous step in registration
  const goToPreviousStep = () => {
    if (registrationStep > 1) {
      setRegistrationStep(registrationStep - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isRegistering) {
        // --- Registration Logic ---
        const endpoint = '/api/register';
        // Construct body according to server/schemas/auth-schemas.ts
        const body = {
          username,
          password,
          email,
          role: selectedRole, // Add the selected role back
          acceptTerms: true // Keep required acceptTerms field
          // status and subscriptionInfo are not part of the registerUserSchema
          // Optional fields like fullName, phoneNumber, entityName are not currently collected by this form
        };

        console.log(`Submitting registration request to ${endpoint} with body:`, body);
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          credentials: 'include', // Important for session handling if needed post-registration
          body: JSON.stringify(body),
        });
        console.log('Registration response status:', response.status);

        let data;
        try {
          const responseText = await response.text();
          if (responseText) {
            data = JSON.parse(responseText);
            console.log('Received registration response data');
          } else {
             console.warn('Empty registration response received');
             data = { message: 'Empty response received from server' };
          }
        } catch (error) {
          console.error('Failed to read/parse registration response:', error);
          throw new Error('Server returned an invalid response during registration');
        }

        if (!response.ok) {
          throw new Error(data?.message || 'Registration failed');
        }

        // Handle post-registration steps (payment or redirect)
        if (selectedPlan !== 'free' && data.paymentRequired) {
          setRegisteredUserId(data.id);
          toast({
            title: 'Account Created',
            description: 'Please complete the payment to activate your subscription'
          });
          setShowPaymentModal(true);
        } else {
          toast({
            title: 'Registration successful',
            description: 'Your account has been created. Please log in.',
          });
          // Switch to login tab after successful free registration
          setIsRegistering(false);
          // Optionally clear fields or redirect to login with a message
          // setLocation('/auth?registered=true'); // Example redirect
        }

      } else {
        // --- Login Logic ---
        console.log(`Submitting login request for ${username}`);
        // Use the login function from the auth context
        // It handles API call, state update, and redirection internally
        const result = await auth.login(username, password);
        
        // auth.login already handles toasts and redirection on success/failure
        // No further action needed here for the login case unless specific error handling is required
        if (!result.success) {
           console.log("Login attempt failed via auth context.");
           // Toast is already shown by auth.login
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Something went wrong"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle successful payment
  const handlePaymentSuccess = () => {
    console.log('Payment successful, redirecting to home page...');
    
    // Close payment modal
    setShowPaymentModal(false);
    
    // Redirect to home page using wouter
    setTimeout(() => {
      setLocation('/');
    }, 1000);
  };

  const renderRoleSelection = () => (
    <div className="space-y-4">
      <Label className="text-slate-300 block mb-4">Select your role in the music industry</Label>
      <RadioGroup defaultValue={selectedRole} onValueChange={handleRoleChange} className="grid grid-cols-1 gap-4">
        <label 
          className={`flex items-center space-x-3 border p-4 rounded-md cursor-pointer transition-colors ${selectedRole === 'label' ? 'border-cyan-400 bg-slate-800/70' : 'border-slate-700 bg-slate-900/70 hover:bg-slate-800/50'}`}
          htmlFor="role-label"
        >
          <RadioGroupItem value="label" id="role-label" className="sr-only" />
          <Building2 className="h-5 w-5 text-cyan-400" />
          <div className="flex-1">
            <p className="font-medium text-white">Label Admin</p>
            <p className="text-xs text-slate-400">For record labels managing multiple artists</p>
          </div>
          {selectedRole === 'label' && <CheckCircle className="h-5 w-5 text-cyan-400" />}
        </label>
        
        <label 
          className={`flex items-center space-x-3 border p-4 rounded-md cursor-pointer transition-colors ${selectedRole === 'artist_manager' ? 'border-cyan-400 bg-slate-800/70' : 'border-slate-700 bg-slate-900/70 hover:bg-slate-800/50'}`}
          htmlFor="role-artist-manager"
        >
          <RadioGroupItem value="artist_manager" id="role-artist-manager" className="sr-only" />
          <Users className="h-5 w-5 text-cyan-400" />
          <div className="flex-1">
            <p className="font-medium text-white">Artist Manager</p>
            <p className="text-xs text-slate-400">For managers overseeing multiple artists</p>
          </div>
          {selectedRole === 'artist_manager' && <CheckCircle className="h-5 w-5 text-cyan-400" />}
        </label>
        
        <label 
          className={`flex items-center space-x-3 border p-4 rounded-md cursor-pointer transition-colors ${selectedRole === 'artist' ? 'border-cyan-400 bg-slate-800/70' : 'border-slate-700 bg-slate-900/70 hover:bg-slate-800/50'}`}
          htmlFor="role-artist"
        >
          <RadioGroupItem value="artist" id="role-artist" className="sr-only" />
          <Music className="h-5 w-5 text-cyan-400" />
          <div className="flex-1">
            <p className="font-medium text-white">Artist</p>
            <p className="text-xs text-slate-400">For individual musicians and artists</p>
          </div>
          {selectedRole === 'artist' && <CheckCircle className="h-5 w-5 text-cyan-400" />}
        </label>
      </RadioGroup>
    </div>
  );

  const renderSubscriptionSelection = () => (
    <div className="space-y-4">
      <Label className="text-slate-300 block mb-4">Choose your subscription plan</Label>
      <RadioGroup defaultValue={selectedPlan} onValueChange={setSelectedPlan} className="grid grid-cols-1 gap-4">
        {/* Only show plans that match the selected role or are lower tier */}
        {selectedRole === 'label' && (
          <label 
            className={`flex flex-col border p-4 rounded-md cursor-pointer transition-colors ${selectedPlan === 'label' ? 'border-cyan-400 bg-slate-800/70' : 'border-slate-700 bg-slate-900/70 hover:bg-slate-800/50'}`}
            htmlFor="plan-label"
          >
            <div className="flex items-center space-x-3 mb-2">
              <RadioGroupItem value="label" id="plan-label" className="sr-only" />
              <Building2 className="h-5 w-5 text-cyan-400" />
              <div className="flex-1">
                <p className="font-medium text-white">Label Admin Plan</p>
                <p className="text-xs text-slate-400">₹{SUBSCRIPTION_PLANS.label.yearlyPriceInINR} per year</p>
              </div>
              {selectedPlan === 'label' && <CheckCircle className="h-5 w-5 text-cyan-400" />}
            </div>
            <div className="mt-2 text-xs text-slate-300 space-y-1">
              <div className="flex justify-between">
                <span>Artists:</span>
                <span>{SUBSCRIPTION_PLANS.label.maxArtists}</span>
              </div>
              <div className="flex justify-between">
                <span>Releases:</span>
                <span>{SUBSCRIPTION_PLANS.label.maxReleases}</span>
              </div>
              <div className="flex justify-between">
                <span>Tracks:</span>
                <span>{SUBSCRIPTION_PLANS.label.maxTracks}</span>
              </div>
              <div className="flex justify-between">
                <span>File Size:</span>
                <span>{SUBSCRIPTION_PLANS.label.maxFileSize}</span>
              </div>
            </div>
          </label>
        )}
        
        {(selectedRole === 'label' || selectedRole === 'artist_manager') && (
          <label 
            className={`flex flex-col border p-4 rounded-md cursor-pointer transition-colors ${selectedPlan === 'artist_manager' ? 'border-cyan-400 bg-slate-800/70' : 'border-slate-700 bg-slate-900/70 hover:bg-slate-800/50'}`}
            htmlFor="plan-artist-manager"
          >
            <div className="flex items-center space-x-3 mb-2">
              <RadioGroupItem value="artist_manager" id="plan-artist-manager" className="sr-only" />
              <Users className="h-5 w-5 text-cyan-400" />
              <div className="flex-1">
                <p className="font-medium text-white">Artist Manager Plan</p>
                <p className="text-xs text-slate-400">₹{SUBSCRIPTION_PLANS.artist_manager.yearlyPriceInINR} per year</p>
              </div>
              {selectedPlan === 'artist_manager' && <CheckCircle className="h-5 w-5 text-cyan-400" />}
            </div>
            <div className="mt-2 text-xs text-slate-300 space-y-1">
              <div className="flex justify-between">
                <span>Artists:</span>
                <span>{SUBSCRIPTION_PLANS.artist_manager.maxArtists}</span>
              </div>
              <div className="flex justify-between">
                <span>Releases:</span>
                <span>{SUBSCRIPTION_PLANS.artist_manager.maxReleases}</span>
              </div>
              <div className="flex justify-between">
                <span>Tracks:</span>
                <span>{SUBSCRIPTION_PLANS.artist_manager.maxTracks}</span>
              </div>
              <div className="flex justify-between">
                <span>File Size:</span>
                <span>{SUBSCRIPTION_PLANS.artist_manager.maxFileSize}</span>
              </div>
            </div>
          </label>
        )}
        
        <label 
          className={`flex flex-col border p-4 rounded-md cursor-pointer transition-colors ${selectedPlan === 'artist' ? 'border-cyan-400 bg-slate-800/70' : 'border-slate-700 bg-slate-900/70 hover:bg-slate-800/50'}`}
          htmlFor="plan-artist"
        >
          <div className="flex items-center space-x-3 mb-2">
            <RadioGroupItem value="artist" id="plan-artist" className="sr-only" />
            <Music className="h-5 w-5 text-cyan-400" />
            <div className="flex-1">
              <p className="font-medium text-white">Artist Plan</p>
              <p className="text-xs text-slate-400">₹{SUBSCRIPTION_PLANS.artist.yearlyPriceInINR} per year</p>
            </div>
            {selectedPlan === 'artist' && <CheckCircle className="h-5 w-5 text-cyan-400" />}
          </div>
          <div className="mt-2 text-xs text-slate-300 space-y-1">
            <div className="flex justify-between">
              <span>Artists:</span>
              <span>{SUBSCRIPTION_PLANS.artist.maxArtists}</span>
            </div>
            <div className="flex justify-between">
              <span>Releases:</span>
              <span>{SUBSCRIPTION_PLANS.artist.maxReleases}</span>
            </div>
            <div className="flex justify-between">
              <span>Tracks:</span>
              <span>{SUBSCRIPTION_PLANS.artist.maxTracks}</span>
            </div>
            <div className="flex justify-between">
              <span>File Size:</span>
              <span>{SUBSCRIPTION_PLANS.artist.maxFileSize}</span>
            </div>
          </div>
        </label>
        
        <label 
          className={`flex flex-col border p-4 rounded-md cursor-pointer transition-colors ${selectedPlan === 'free' ? 'border-cyan-400 bg-slate-800/70' : 'border-slate-700 bg-slate-900/70 hover:bg-slate-800/50'}`}
          htmlFor="plan-free"
        >
          <div className="flex items-center space-x-3 mb-2">
            <RadioGroupItem value="free" id="plan-free" className="sr-only" />
            <Music className="h-5 w-5 text-cyan-400" />
            <div className="flex-1">
              <p className="font-medium text-white">Free Trial</p>
              <p className="text-xs text-slate-400">Free</p>
            </div>
            {selectedPlan === 'free' && <CheckCircle className="h-5 w-5 text-cyan-400" />}
          </div>
          <div className="mt-2 text-xs text-slate-300 space-y-1">
            <div className="flex justify-between">
              <span>Artists:</span>
              <span>{SUBSCRIPTION_PLANS.free.maxArtists}</span>
            </div>
            <div className="flex justify-between">
              <span>Releases:</span>
              <span>{SUBSCRIPTION_PLANS.free.maxReleases}</span>
            </div>
            <div className="flex justify-between">
              <span>Tracks:</span>
              <span>{SUBSCRIPTION_PLANS.free.maxTracks}</span>
            </div>
            <div className="flex justify-between">
              <span>File Size:</span>
              <span>{SUBSCRIPTION_PLANS.free.maxFileSize}</span>
            </div>
          </div>
        </label>
      </RadioGroup>
    </div>
  );

  const renderUserDetailsForm = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username" className="text-slate-300">Username</Label>
        <Input
          id="username"
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="bg-slate-900/70 border-slate-700 text-white"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-slate-300">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="bg-slate-900/70 border-slate-700 text-white"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-slate-300">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="bg-slate-900/70 border-slate-700 text-white"
        />
      </div>
      
      <div className="mt-4 space-y-2">
        <h4 className="text-sm font-medium text-slate-300">Selected Role: <span className="text-cyan-400">{SUBSCRIPTION_PLANS[selectedRole as keyof typeof SUBSCRIPTION_PLANS].displayName}</span></h4>
        <h4 className="text-sm font-medium text-slate-300">Selected Plan: <span className="text-cyan-400">{SUBSCRIPTION_PLANS[selectedPlan as keyof typeof SUBSCRIPTION_PLANS].name}</span></h4>
        
        {selectedPlan !== 'free' && (
          <div className="mt-2 p-2 bg-slate-800/50 rounded border border-cyan-800/50">
            <p className="text-xs text-cyan-300">
              <span className="font-semibold">Payment Required:</span> This plan requires payment of ₹{SUBSCRIPTION_PLANS[selectedPlan as keyof typeof SUBSCRIPTION_PLANS].yearlyPriceInINR} after registration.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const renderRegistrationForm = () => (
    <div className="space-y-4">
      {registrationStep === 1 && renderRoleSelection()}
      {registrationStep === 2 && renderSubscriptionSelection()}
      {registrationStep === 3 && renderUserDetailsForm()}
      
      <div className="flex justify-between pt-4">
        {registrationStep > 1 && (
          <Button 
            type="button" 
            variant="outline"
            onClick={goToPreviousStep}
            className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
          >
            Back
          </Button>
        )}
        
        {registrationStep < 3 ? (
          <Button 
            type="button" 
            className="ml-auto bg-cyan-500 hover:bg-cyan-600 text-white"
            onClick={goToNextStep}
          >
            Next
          </Button>
        ) : (
          <Button 
            type="submit" 
            className="ml-auto bg-cyan-500 hover:bg-cyan-600 text-white"
            disabled={isLoading}
          >
            {isLoading ? 'Creating Account...' : 'Complete Registration'}
          </Button>
        )}
      </div>
    </div>
  );

  const renderLoginForm = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="login-username" className="text-slate-300">Username</Label>
        <Input
          id="login-username"
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="bg-slate-900/70 border-slate-700 text-white"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="login-password" className="text-slate-300">Password</Label>
        <Input
          id="login-password"
          type="password"
          placeholder="Password"
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
        {isLoading ? 'Signing In...' : 'Sign In'}
      </Button>
    </div>
  );

  return (
    <>
      <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-b from-slate-950 to-black p-4">
        <div className="relative z-10 w-full max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="mb-8 text-center"
          >
            <motion.h1 
              initial={{ opacity: 0.5, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8, ease: "easeInOut" }}
              className="bg-gradient-to-br from-cyan-300 to-cyan-600 py-4 bg-clip-text text-center text-4xl font-medium tracking-tight text-transparent md:text-7xl"
            >
              TuneMantra <br /> Distribution
            </motion.h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="w-full"
          >
            <Card className={`w-full ${isRegistering ? 'max-w-lg' : 'max-w-md'} mx-auto bg-black/60 backdrop-blur-sm border-slate-800`}>
              <CardHeader>
                <Tabs defaultValue={isRegistering ? "register" : "login"} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-slate-900/70">
                    <TabsTrigger 
                      value="login" 
                      className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white"
                      onClick={() => setIsRegistering(false)}
                    >
                      Sign In
                    </TabsTrigger>
                    <TabsTrigger 
                      value="register" 
                      className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white"
                      onClick={() => {
                        setIsRegistering(true);
                        setRegistrationStep(1);
                      }}
                    >
                      Create Account
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
                
                <CardDescription className="text-slate-300 mt-4">
                  {isRegistering 
                    ? 'Join TuneMantra Distribution today' 
                    : 'Enter your credentials to access your account'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {isRegistering ? renderRegistrationForm() : renderLoginForm()}
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal 
        open={showPaymentModal}
        onOpenChange={setShowPaymentModal}
        planType={selectedPlan}
        onSuccess={handlePaymentSuccess}
      />
    </>
  );
}