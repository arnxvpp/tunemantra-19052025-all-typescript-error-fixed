import { useEffect } from "react";
import { useLocation } from "wouter";

export default function RightsPage() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    setLocation("/rights/overview");
  }, [setLocation]);

  return null;
}