import React, { useState } from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: React.ReactNode;
  aspectRatio?: "square" | "video" | "portrait" | "landscape";
  containerClassName?: string;
}

export function Image({
  src,
  alt,
  className,
  fallback,
  aspectRatio,
  containerClassName,
  ...props
}: ImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const aspectRatioClasses = {
    square: "aspect-square",
    video: "aspect-video",
    portrait: "aspect-[3/4]",
    landscape: "aspect-[16/9]",
  };

  const aspectClass = aspectRatio ? aspectRatioClasses[aspectRatio] : "";

  return (
    <div className={cn("relative overflow-hidden", aspectClass, containerClassName)}>
      {isLoading && (
        <Skeleton className={cn("h-full w-full absolute inset-0", className)} />
      )}

      {hasError && fallback ? (
        <div className={cn("flex items-center justify-center h-full w-full bg-muted", className)}>
          {fallback}
        </div>
      ) : (
        <img
          src={src}
          alt={alt || ""}
          className={cn(
            "object-cover transition-opacity duration-300",
            isLoading ? "opacity-0" : "opacity-100",
            hasError ? "hidden" : "block",
            className
          )}
          loading="lazy"
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
      )}
    </div>
  );
}

export default Image;