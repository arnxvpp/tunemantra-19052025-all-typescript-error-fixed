import { UploadForm } from "@/components/upload/upload-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProtectedFeature } from "@/components/subscription/ProtectedFeature";
import { useFeatureAccess } from "@/hooks/use-feature-access";

export default function UploadPage() {
  const { getUsageLimit, getPlanName } = useFeatureAccess();
  
  // Get file size limit based on subscription plan
  const maxFileSizeMB = getUsageLimit('maxFileSize');
  const maxFileSizeDisplay = maxFileSizeMB === 'unlimited' ? 
    'Unlimited' : `${maxFileSizeMB}MB`;
  
  return (
    <div className="min-h-screen">
      <main className="max-w-7xl mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Upload Music</h1>
          <p className="text-muted-foreground">
            Add new tracks to your catalog
          </p>
        </div>

        <div className="grid gap-6">
          <ProtectedFeature feature="release_creation" showLockedCard={true}>
            <Card>
              <CardHeader>
                <CardTitle>Track Details</CardTitle>
              </CardHeader>
              <CardContent>
                <UploadForm />
              </CardContent>
            </Card>
          </ProtectedFeature>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Upload Guidelines</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm">
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                    Supported format: WAV only
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                    Sample rate: 44.1kHz or 48kHz
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                    Bit depth: 16-bit or 24-bit
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                    No silence longer than 5 seconds
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                    Maximum file size: {maxFileSizeDisplay}
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Distribution Requirements</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm">
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                    Include accurate and complete metadata
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                    Ensure you have rights to distribute the content
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                    Cover art: minimum 3000x3000px JPG/PNG
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                    Properly tag explicit content
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                    ISRC codes will be assigned after upload
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
