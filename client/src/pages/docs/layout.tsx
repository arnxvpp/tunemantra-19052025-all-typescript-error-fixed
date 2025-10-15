
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const tabs = [
  ["Overview", "/documentation"],
  ["Upload Guidelines", "/documentation/upload"],
  ["Distribution", "/documentation/distribution"],
  ["Rights", "/documentation/rights"],
  ["Analytics", "/documentation/analytics"]
];

export function DocsLayout({ children }: { children?: React.ReactNode }) {
  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold">Documentation</h1>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            {tabs.map(([label, href]) => (
              <Link key={href} href={href}>
                <TabsTrigger value={label.toLowerCase()}>{label}</TabsTrigger>
              </Link>
            ))}
          </TabsList>
        </Tabs>
      </div>
      <Card className="p-6 prose dark:prose-invert max-w-none">
        {children}
      </Card>
    </div>
  );
}
