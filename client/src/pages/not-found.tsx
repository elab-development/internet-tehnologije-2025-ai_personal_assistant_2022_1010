import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <div className="text-center max-w-md space-y-6">
        <div className="flex justify-center">
          <div className="h-20 w-20 bg-destructive/10 rounded-full flex items-center justify-center">
            <AlertCircle className="h-10 w-10 text-destructive" />
          </div>
        </div>
        
        <h1 className="text-4xl font-display font-bold text-foreground">
          Page Not Found
        </h1>
        
        <p className="text-muted-foreground text-lg">
          The page you are looking for doesn't exist or has been moved.
        </p>

        <Link href="/">
          <Button size="lg" className="w-full">
            Return Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
