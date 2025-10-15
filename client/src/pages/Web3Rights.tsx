import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWeb3 } from '@/web3/Web3Provider';
import { RightsRegistrationForm } from '@/components/rights/RightsRegistrationForm'; // Use named import
import Web3RightsVerification from '@/components/rights/Web3RightsVerification';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const Web3RightsPage: React.FC = () => {
  const { web3Enabled } = useWeb3();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('register');

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Blockchain Rights Management</h1>
        <p className="text-muted-foreground">
          Register and verify music rights on multiple blockchain networks with enhanced security and
          territorial licensing support.
        </p>
      </div>

      {!web3Enabled && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Web3 Support Required</AlertTitle>
          <AlertDescription>
            To use blockchain rights management features, please install a Web3 provider like MetaMask.
            <a 
              href="https://metamask.io/download/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline ml-1"
            >
              Download MetaMask
            </a>
          </AlertDescription>
        </Alert>
      )}

      <Tabs 
        defaultValue="register" 
        className="w-full"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="register">Register Rights</TabsTrigger>
          <TabsTrigger value="verify">Verify Rights</TabsTrigger>
        </TabsList>
        
        <TabsContent value="register" className="space-y-6">
          <RightsRegistrationForm />
        </TabsContent>
        
        <TabsContent value="verify" className="space-y-6">
          <Web3RightsVerification />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Web3RightsPage;