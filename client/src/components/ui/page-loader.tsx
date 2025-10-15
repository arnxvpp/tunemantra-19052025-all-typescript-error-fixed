import { Spinner } from "./spinner";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface PageLoaderProps {
  isLoading: boolean;
}

export function PageLoader({ isLoading }: PageLoaderProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (isLoading) {
      setVisible(true);
    } else {
      // Add a small delay before hiding to ensure smooth transitions
      timeout = setTimeout(() => {
        setVisible(false);
      }, 300);
    }

    return () => clearTimeout(timeout);
  }, [isLoading]);

  if (!visible && !isLoading) return null;

  return (
    <div 
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm transition-all duration-300",
        isLoading ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
    >
      <div className="flex items-center justify-center p-6">
        <div className="relative">
          <Spinner size="lg" className="text-primary" />
          <div className="absolute inset-0 animate-ping opacity-30 rounded-full bg-primary/20"></div>
        </div>
      </div>
    </div>
  );
}