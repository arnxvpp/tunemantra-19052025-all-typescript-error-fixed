import { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import ReactMarkdown from 'react-markdown';

/**
 * Documentation Page Component
 * 
 * This component fetches and displays the unified documentation file
 * that contains all platform documentation in a single place.
 */
export default function DocumentationPage() {
  const [documentationContent, setDocumentationContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch the documentation file
    fetch('/docs/unified/index.md')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load documentation');
        }
        return response.text();
      })
      .then(text => {
        setDocumentationContent(text);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Error loading documentation:", err);
        setError("Failed to load documentation. Please try again later.");
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold">TuneMantra Documentation</h1>
      </div>

      <Card className="p-6 prose dark:prose-invert max-w-none">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" className="text-primary" />
          </div>
        ) : error ? (
          <div className="text-destructive p-4 border border-destructive/20 rounded-md bg-destructive/10">
            {error}
          </div>
        ) : (
          <ReactMarkdown>{documentationContent}</ReactMarkdown>
        )}
      </Card>
    </div>
  );
}