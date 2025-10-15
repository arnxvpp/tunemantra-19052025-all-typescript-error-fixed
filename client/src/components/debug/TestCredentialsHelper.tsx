import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type TestCredential = {
  username: string;
  password: string;
  role: string;
  description: string;
};

const testCredentials: TestCredential[] = [
  {
    username: "admin",
    password: "admin123",
    role: "admin",
    description: "Full platform access with all permissions"
  },
  {
    username: "artist1",
    password: "artist123",
    role: "artist",
    description: "Artist account with catalog management and analytics"
  },
  {
    username: "manager1",
    password: "manager123",
    role: "artist_manager",
    description: "Manages multiple artists and their catalogs"
  },
  {
    username: "team1",
    password: "team123",
    role: "team_member",
    description: "Team member with limited access rights"
  },
  {
    username: "distributor1",
    password: "dist123",
    role: "distributor",
    description: "Distribution partner account"
  },
  // Try different possible passwords for Skyline
  {
    username: "skyline",
    password: "password123",
    role: "artist",
    description: "Skyline artist account with tracks like 'City Lights'"
  },
  {
    username: "skyline",
    password: "skyline123",
    role: "artist",
    description: "Skyline artist account (try with skyline123)"
  },
  {
    username: "skyline",
    password: "tunemantra",
    role: "artist",
    description: "Skyline artist account (try with tunemantra)"
  }
];

interface TestCredentialsHelperProps {
  onSelectCredential: (username: string, password: string) => void;
}

export function TestCredentialsHelper({ onSelectCredential }: TestCredentialsHelperProps) {
  return (
    <Card className="w-full max-w-4xl mt-8 mx-auto">
      <CardHeader>
        <CardTitle>Test Credentials</CardTitle>
        <CardDescription>
          Select from these test accounts to explore different user roles
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Password</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Description</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {testCredentials.map((cred, index) => (
              <TableRow key={`${cred.username}-${cred.password}-${index}`}>
                <TableCell className="font-mono">{cred.username}</TableCell>
                <TableCell className="font-mono">{cred.password}</TableCell>
                <TableCell>
                  <Badge variant={getBadgeVariant(cred.role)}>{cred.role}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">{cred.description}</TableCell>
                <TableCell>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onSelectCredential(cred.username, cred.password)}
                  >
                    Use
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function getBadgeVariant(role: string): "default" | "secondary" | "destructive" | "outline" {
  switch (role) {
    case "admin":
      return "destructive";
    case "artist_manager":
      return "secondary";
    case "artist":
      return "default";
    default:
      return "outline";
  }
}