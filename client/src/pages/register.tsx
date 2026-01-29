import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { Brain, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const { register } = useAuth();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    register.mutate(
      { username, password, email },
      {
        onError: (error) => {
          toast({
            title: "Registration Failed",
            description: error.message,
            variant: "destructive",
          });
        },
        onSuccess: () => {
          toast({
            title: "Success!",
            description: "Account created. Please login.",
          });
        }
      }
    );
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />

      <div className="w-full max-w-md animate-enter">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6">
            <Sparkles className="w-4 h-4" />
            <span>Join the AI Revolution</span>
          </div>
          <h1 className="font-display text-4xl font-bold mb-3 tracking-tight">Create Account</h1>
          <p className="text-muted-foreground text-lg">Start building your personal knowledge base</p>
        </div>

        <div className="bg-card border border-border/50 shadow-xl shadow-black/5 rounded-2xl p-8 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground/80">Username</label>
              <Input
                type="text"
                placeholder="Choose a username"
                className="h-11 rounded-xl bg-background/50"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground/80">Email (Optional)</label>
              <Input
                type="email"
                placeholder="you@example.com"
                className="h-11 rounded-xl bg-background/50"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground/80">Password</label>
              <Input
                type="password"
                placeholder="Create a strong password"
                className="h-11 rounded-xl bg-background/50"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-base font-semibold shadow-xl shadow-primary/20 mt-2" 
              disabled={register.isPending}
            >
              {register.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  Get Started <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary font-semibold hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
