import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";
import React, { useState, useEffect } from 'react';
import { PageLoader } from "@/components/ui/page-loader";

export function CatalogLayout({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const tab = location.split("/").pop() || "releases";
  const [isLoading, setIsLoading] = useState(false);
  const [lastLocation, setLastLocation] = useState(location);

  // Effect to handle page transitions
  useEffect(() => {
    if (location !== lastLocation) {
      setIsLoading(true);
      setLastLocation(location);

      // Simulate loading delay with a timeout
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 800); // Adjust loading time as needed

      return () => clearTimeout(timer);
    }
  }, [location, lastLocation]);

  return (
    <div className="space-y-6">
      <PageLoader isLoading={isLoading} />
      <div className="border-b">
        <div className="px-4 sm:px-6 lg:px-8">
          <Tabs value={tab} className="w-full" onValueChange={(value) => navigate(`/catalog/${value}`)}>
            <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1">
              <TabsTrigger value="releases">Audio Releases</TabsTrigger>
              <TabsTrigger value="tracks">Tracks</TabsTrigger>
              <TabsTrigger value="bulk-upload">Bulk Upload</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="genres">Genres</TabsTrigger>
              <TabsTrigger value="playlists">Playlists</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      <div className="px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}

export default CatalogLayout;