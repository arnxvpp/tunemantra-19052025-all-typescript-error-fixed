import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { 
  Fingerprint, 
  AlertTriangle, 
  Shield, 
  Waves, 
  Music, 
  Check, 
  X, 
  Clock, 
  Info, 
  ShieldCheck,
  CheckCircle2 as CheckCircle
} from "lucide-react";
import { 
  checkForCopyrightIssues, 
  validateAudioMetadata, 
  detectSamplesInTrack,
  CopyrightDetectionResult
} from '@/lib/audioFingerprinting';

interface AudioFingerprintValidatorProps {
  audioFile?: File;
  metadata: {
    title: string;
    artist: string;
    isrc?: string;
  };
  onValidationComplete?: (result: {
    isValid: boolean;
    hasCopyrightIssues: boolean;
    containsUnclaimedSamples: boolean;
    needsAdditionalReview: boolean;
  }) => void;
}

export default function AudioFingerprintValidator({ 
  audioFile, 
  metadata,
  onValidationComplete
}: AudioFingerprintValidatorProps) {
  const { toast } = useToast();
  const [isValidating, setIsValidating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState<string>('');
  const [fingerprintResult, setFingerprintResult] = useState<{
    copyrightIssues?: CopyrightDetectionResult;
    metadataValidation?: {
      isValid: boolean;
      issues: string[];
      confidence: number;
    };
    sampleDetection?: {
      containsSamples: boolean;
      detectedSamples: {
        artist: string;
        title: string;
        timestampStart: string;
        timestampEnd: string;
        confidence: number;
      }[];
    };
  }>({});
  
  const [validationComplete, setValidationComplete] = useState(false);
  const [summaryResult, setSummaryResult] = useState<{
    isValid: boolean;
    hasCopyrightIssues: boolean;
    containsUnclaimedSamples: boolean;
    needsAdditionalReview: boolean;
  }>({
    isValid: false,
    hasCopyrightIssues: false,
    containsUnclaimedSamples: false,
    needsAdditionalReview: false
  });

  const runFingerprinting = async () => {
    if (!audioFile) {
      toast({
        title: "No Audio File",
        description: "Please upload an audio file to validate",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsValidating(true);
      setProgress(0);
      setStep('Starting fingerprinting process...');
      setFingerprintResult({});
      setValidationComplete(false);

      // Copyright check
      setStep('Checking for copyright matches...');
      setProgress(20);
      const copyrightResult = await checkForCopyrightIssues(audioFile);
      setFingerprintResult(prev => ({
        ...prev,
        copyrightIssues: copyrightResult
      }));

      // Metadata validation
      setStep('Validating metadata against audio content...');
      setProgress(50);
      const metadataResult = await validateAudioMetadata(audioFile, metadata);
      setFingerprintResult(prev => ({
        ...prev,
        metadataValidation: metadataResult
      }));

      // Sample detection
      setStep('Analyzing for uncleared samples...');
      setProgress(80);
      const sampleResult = await detectSamplesInTrack(audioFile);
      setFingerprintResult(prev => ({
        ...prev,
        sampleDetection: sampleResult
      }));

      // Compile results
      setStep('Compiling results...');
      setProgress(95);

      // Determine overall validation status
      const hasCopyrightIssues = copyrightResult.hasMatch && 
                               copyrightResult.matchConfidence > 0.8;
      
      const hasMetadataIssues = !metadataResult.isValid;
      
      const hasUnclaimedSamples = sampleResult.containsSamples;
      
      const needsReview = hasCopyrightIssues || 
                          hasMetadataIssues || 
                          hasUnclaimedSamples || 
                          (copyrightResult.hasMatch && copyrightResult.matchConfidence > 0.6);

      const summary = {
        isValid: !hasCopyrightIssues && !hasMetadataIssues,
        hasCopyrightIssues,
        containsUnclaimedSamples: hasUnclaimedSamples,
        needsAdditionalReview: needsReview
      };
      
      // Set summary results
      setSummaryResult(summary);
      setValidationComplete(true);
      
      // Notify parent component
      if (onValidationComplete) {
        onValidationComplete(summary);
      }

      // Complete
      setStep('Fingerprinting complete');
      setProgress(100);
      
      toast({
        title: "Fingerprinting Complete",
        description: hasCopyrightIssues 
          ? "Copyright issues detected! Review required before distribution."
          : hasUnclaimedSamples
          ? "Samples detected! Make sure they're cleared for use."
          : "Fingerprinting validation completed successfully"
      });
    } catch (error) {
      console.error('Fingerprinting error:', error);
      toast({
        title: "Fingerprinting Failed",
        description: "An error occurred during audio analysis",
        variant: "destructive"
      });
    } finally {
      setIsValidating(false);
    }
  };

  const renderCopyrightSection = () => {
    const result = fingerprintResult.copyrightIssues;
    
    if (!result) return null;
    
    return (
      <div className="space-y-4">
        {result.hasMatch ? (
          <>
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium flex items-center">
                  {result.matchConfidence > 0.8 ? (
                    <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
                  ) : result.matchConfidence > 0.6 ? (
                    <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
                  ) : (
                    <Info className="h-4 w-4 mr-2 text-blue-500" />
                  )}
                  Matched Content Detected
                </h4>
                <p className="text-sm text-muted-foreground">
                  Your track has been identified as similar to existing content
                </p>
              </div>
              <Badge className={
                result.matchConfidence > 0.8 
                  ? "bg-red-500" 
                  : result.matchConfidence > 0.6 
                  ? "bg-amber-500" 
                  : "bg-blue-500"
              }>
                {Math.round(result.matchConfidence * 100)}% Match
              </Badge>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Artist</TableHead>
                  <TableHead>ISRC</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.matchedTracks.map((track, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{track.title}</TableCell>
                    <TableCell>{track.artist}</TableCell>
                    <TableCell>{track.isrc || "—"}</TableCell>
                    <TableCell>
                      <Badge className={
                        track.confidence > 0.8 
                          ? "bg-red-500" 
                          : track.confidence > 0.6 
                          ? "bg-amber-500" 
                          : "bg-blue-500"
                      }>
                        {Math.round(track.confidence * 100)}%
                      </Badge>
                    </TableCell>
                    <TableCell>{track.source}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {result.possibleIssues.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Potential Copyright Issues</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-5 mt-2">
                    {result.possibleIssues.map((issue, index) => (
                      <li key={index}>{issue}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            
            <div className="text-sm text-muted-foreground">
              <p>
                <strong>What does this mean?</strong> Your track has similarities to existing content. 
                If you're using samples, ensure you have proper clearance. If this is an original 
                composition, you may need to provide proof of ownership.
              </p>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <ShieldCheck className="h-16 w-16 mx-auto mb-2 text-green-600" />
            <h4 className="font-medium text-green-600">No Copyright Matches Found</h4>
            <p className="text-sm text-muted-foreground mt-2">
              Your track appears to be original and does not match any known copyrighted content
              in our database.
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderMetadataSection = () => {
    const result = fingerprintResult.metadataValidation;
    
    if (!result) return null;
    
    return (
      <div className="space-y-4">
        {!result.isValid ? (
          <>
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
                  Metadata Inconsistencies Detected
                </h4>
                <p className="text-sm text-muted-foreground">
                  The metadata you provided doesn't match what we detected in the audio
                </p>
              </div>
              <Badge className="bg-amber-500">
                {Math.round(result.confidence * 100)}% Match
              </Badge>
            </div>
            
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Metadata Issues</AlertTitle>
              <AlertDescription>
                <ul className="list-disc pl-5 mt-2">
                  {result.issues.map((issue, index) => (
                    <li key={index}>{issue}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
            
            <div className="text-sm text-muted-foreground">
              <p>
                <strong>What does this mean?</strong> The track's audio fingerprint suggests 
                different metadata than what you provided. This could indicate a mismatch
                between your file and metadata, or potential misattribution.
              </p>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <CheckCircle className="h-16 w-16 mx-auto mb-2 text-green-600" />
            <h4 className="font-medium text-green-600">Metadata Validated</h4>
            <p className="text-sm text-muted-foreground mt-2">
              The metadata you provided matches the audio content fingerprint
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderSamplesSection = () => {
    const result = fingerprintResult.sampleDetection;
    
    if (!result) return null;
    
    return (
      <div className="space-y-4">
        {result.containsSamples ? (
          <>
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium flex items-center">
                  <Waves className="h-4 w-4 mr-2 text-amber-500" />
                  Samples Detected
                </h4>
                <p className="text-sm text-muted-foreground">
                  Your track appears to contain samples from other works
                </p>
              </div>
              <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                {result.detectedSamples.length} Sample{result.detectedSamples.length !== 1 ? 's' : ''}
              </Badge>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Original Track</TableHead>
                  <TableHead>Artist</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Confidence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.detectedSamples.map((sample, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{sample.title}</TableCell>
                    <TableCell>{sample.artist}</TableCell>
                    <TableCell>
                      {sample.timestampStart} - {sample.timestampEnd}
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        sample.confidence > 0.9 
                          ? "bg-red-500" 
                          : sample.confidence > 0.8 
                          ? "bg-amber-500" 
                          : "bg-blue-500"
                      }>
                        {Math.round(sample.confidence * 100)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Sample Clearance Required</AlertTitle>
              <AlertDescription>
                The samples detected in your track may require clearance before distribution.
                Please ensure you have the necessary rights or licenses for these samples.
              </AlertDescription>
            </Alert>
          </>
        ) : (
          <div className="text-center py-4">
            <ShieldCheck className="h-16 w-16 mx-auto mb-2 text-green-600" />
            <h4 className="font-medium text-green-600">No Samples Detected</h4>
            <p className="text-sm text-muted-foreground mt-2">
              Your track does not appear to contain uncleared samples from other works
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Fingerprint className="h-5 w-5 mr-2" />
          Audio Fingerprinting Validation
        </CardTitle>
        <CardDescription>
          Validate your audio for copyright issues and sample identification
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!audioFile ? (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>No Audio File</AlertTitle>
            <AlertDescription>
              Upload an audio file to perform fingerprinting validation
            </AlertDescription>
          </Alert>
        ) : isValidating ? (
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>{step}</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        ) : validationComplete ? (
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="copyright">
              <AccordionTrigger className="font-medium">
                <div className="flex items-center">
                  <Shield className="h-4 w-4 mr-2" />
                  Copyright Detection
                  {fingerprintResult.copyrightIssues?.hasMatch ? (
                    <Badge variant="destructive" className="ml-2">Issues Found</Badge>
                  ) : (
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 ml-2">Passed</Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {renderCopyrightSection()}
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="metadata">
              <AccordionTrigger className="font-medium">
                <div className="flex items-center">
                  <Music className="h-4 w-4 mr-2" />
                  Metadata Validation
                  {fingerprintResult.metadataValidation?.isValid ? (
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 ml-2">Passed</Badge>
                  ) : (
                    <Badge variant="destructive" className="ml-2">Issues Found</Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {renderMetadataSection()}
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="samples">
              <AccordionTrigger className="font-medium">
                <div className="flex items-center">
                  <Waves className="h-4 w-4 mr-2" />
                  Sample Detection
                  {fingerprintResult.sampleDetection?.containsSamples ? (
                    <Badge variant="destructive" className="ml-2">Samples Found</Badge>
                  ) : (
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 ml-2">No Samples</Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {renderSamplesSection()}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        ) : (
          <div className="text-center py-8">
            <Fingerprint className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              Ready to analyze your audio for copyright issues, metadata validation, and sample detection.
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        {!isValidating && (
          <Button 
            onClick={runFingerprinting}
            disabled={!audioFile}
            className="w-full"
          >
            {validationComplete ? 'Run Validation Again' : 'Start Fingerprinting Validation'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}