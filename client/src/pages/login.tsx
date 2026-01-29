import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { Brain, ArrowRight, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate(
      { username, password },
      {
        onError: (error) => {
          toast({
            title: "Login Failed",
            description: error.message,
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl opacity-50" />
      </div>

      <div className="w-full max-w-md animate-enter">
        <div className="text-center mb-8">
          <div className="h-16 w-16 bg-gradient-to-tr from-primary to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/20">
            <Brain className="h-8 w-8 text-white" />
          </div>
          <h1 className="font-display text-4xl font-bold mb-3 tracking-tight">Welcome Back</h1>
          <p className="text-muted-foreground text-lg">Sign in to access your knowledge base</p>
        </div>

        <div className="bg-card border border-border/50 shadow-xl shadow-black/5 rounded-2xl p-8 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground/80">Username</label>
              <Input
                type="text"
                placeholder="Enter your username"
                className="h-12 rounded-xl bg-background/50 border-2 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground/80">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                className="h-12 rounded-xl bg-background/50 border-2 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-base font-semibold shadow-xl shadow-primary/20" 
              disabled={login.isPending}
            >
              {login.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Signing In...
                </>
              ) : (
                <>
                  Sign In <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/register" className="text-primary font-semibold hover:underline">
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
