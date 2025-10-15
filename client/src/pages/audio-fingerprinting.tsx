import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { 
  Fingerprint, 
  Shield, 
  Layers, 
  ArrowRight, 
  Music, 
  FileAudio, 
  AlertTriangle,
  CheckCircle,
  Waves
} from "lucide-react";

export default function AudioFingerprintingPage() {
  return (
    <div className="container py-12 max-w-6xl">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold mb-4 flex items-center justify-center">
          <Fingerprint className="h-12 w-12 mr-3 text-primary" />
          Audio Fingerprinting
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Powerful audio identification technology to protect your content, validate metadata, 
          and detect samples before distribution.
        </p>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Card className="flex flex-col h-full">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2 text-primary" />
              Copyright Protection
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-muted-foreground">
              Identify potential copyright issues before distribution by comparing your tracks 
              against a database of millions of songs.
            </p>
            <ul className="mt-4 space-y-2">
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 mr-2 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Prevent content takedowns</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 mr-2 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Avoid copyright strikes</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 mr-2 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Confidence-based matching</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="flex flex-col h-full">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Waves className="h-5 w-5 mr-2 text-primary" />
              Sample Detection
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-muted-foreground">
              Detect when your tracks contain samples from other works to ensure 
              proper clearance before distribution.
            </p>
            <ul className="mt-4 space-y-2">
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 mr-2 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Precise timestamp matching</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 mr-2 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Identify uncleared samples</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 mr-2 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Sample clearance guidance</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="flex flex-col h-full">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileAudio className="h-5 w-5 mr-2 text-primary" />
              Metadata Validation
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-muted-foreground">
              Verify that your track's metadata matches what's detected in the audio,
              ensuring accurate representation.
            </p>
            <ul className="mt-4 space-y-2">
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 mr-2 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Title verification</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 mr-2 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Artist name validation</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 mr-2 text-green-600 flex-shrink-0 mt-0.5" />
                <span>ISRC cross-reference</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Technology Overview */}
      <Card className="mb-12">
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
          <CardDescription>
            Our audio fingerprinting technology uses acoustic fingerprinting to create a unique 
            digital signature of your track
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex flex-col items-center text-center p-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">1</div>
              <h3 className="font-medium mb-2">Analysis</h3>
              <p className="text-sm text-muted-foreground">
                Your audio file is analyzed to create a unique acoustic fingerprint
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center p-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">2</div>
              <h3 className="font-medium mb-2">Comparison</h3>
              <p className="text-sm text-muted-foreground">
                The fingerprint is compared against a database of millions of songs
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center p-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">3</div>
              <h3 className="font-medium mb-2">Detection</h3>
              <p className="text-sm text-muted-foreground">
                Matches are identified with confidence scores and potential issues
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center p-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">4</div>
              <h3 className="font-medium mb-2">Validation</h3>
              <p className="text-sm text-muted-foreground">
                You receive detailed results to make informed distribution decisions
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Demo Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="flex flex-col h-full border-primary/50">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center">
                <Fingerprint className="h-5 w-5 mr-2" />
                Standalone Fingerprinting
              </CardTitle>
              <Badge variant="outline" className="bg-primary/10 text-primary">Basic</Badge>
            </div>
            <CardDescription>
              Test individual audio files with our fingerprinting validator
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <ul className="space-y-2">
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 mr-2 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Upload and analyze individual tracks</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 mr-2 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Get copyright and sample detection results</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 mr-2 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Verify basic track metadata</span>
              </li>
            </ul>
            <div className="mt-4 pl-7 text-sm text-muted-foreground">
              Perfect for quick checks of individual audio files
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <Link href="/fingerprint-demo">
              <Button className="w-full">
                Try Fingerprint Demo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <Card className="flex flex-col h-full bg-primary/5 border-primary">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center">
                <Layers className="h-5 w-5 mr-2" />
                Enhanced Track Manager
              </CardTitle>
              <Badge variant="default" className="bg-primary text-primary-foreground">Advanced</Badge>
            </div>
            <CardDescription>
              A unified interface for track management with integrated fingerprinting
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <ul className="space-y-2">
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 mr-2 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Complete track metadata management</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 mr-2 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Integrated fingerprinting validation</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 mr-2 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Comprehensive validation workflow</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 mr-2 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Multiple track management</span>
              </li>
            </ul>
            <div className="mt-4 pl-7 text-sm text-muted-foreground">
              Ideal for full release preparation with built-in validation
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <Link href="/enhanced-track-manager-demo">
              <Button variant="default" className="w-full">
                Try Enhanced Track Manager
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>

      {/* Technology Notes */}
      <div className="mt-12 border-t pt-8">
        <h3 className="text-xl font-medium mb-4">Powered by ACRCloud</h3>
        <p className="text-muted-foreground">
          Our audio fingerprinting technology is built on ACRCloud's industry-leading acoustic 
          fingerprinting platform, which powers content identification for major streaming services 
          and media companies worldwide. The system can identify tracks even when they've been 
          modified in tempo, pitch, or quality.
        </p>
      </div>
    </div>
  );
}