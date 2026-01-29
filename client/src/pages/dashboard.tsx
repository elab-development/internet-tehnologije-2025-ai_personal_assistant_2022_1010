import { LayoutShell } from "@/components/layout-shell";
import { useAuth } from "@/hooks/use-auth";
import { useDocuments } from "@/hooks/use-documents";
import { Link } from "wouter";
import { 
  FileText, 
  MessageSquare, 
  Upload, 
  Clock, 
  Search,
  ArrowRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: documents } = useDocuments();

  const stats = [
    { label: "Total Documents", value: documents?.length || 0, icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Knowledge Queries", value: "12", icon: Search, color: "text-purple-500", bg: "bg-purple-500/10" },
    { label: "Last Active", value: "Just now", icon: Clock, color: "text-green-500", bg: "bg-green-500/10" },
  ];

  return (
    <LayoutShell>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Welcome back, {user?.username}
            </h1>
            <p className="text-muted-foreground mt-1">
              Here's an overview of your knowledge base.
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/documents">
              <Button variant="outline" className="gap-2">
                <Upload className="w-4 h-4" /> Upload
              </Button>
            </Link>
            <Link href="/chat">
              <Button className="gap-2">
                <MessageSquare className="w-4 h-4" /> Ask AI
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat) => (
            <Card key={stat.label} className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6 flex items-center gap-4">
                <div className={`h-12 w-12 rounded-2xl ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold font-display">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Activity / Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Docs */}
          <Card className="h-full border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Recent Documents</span>
                <Link href="/documents" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
                  View All <ArrowRight className="w-3 h-3" />
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {documents && documents.length > 0 ? (
                <div className="space-y-4">
                  {documents.slice(0, 3).map((doc: any) => (
                    <div key={doc.id} className="flex items-center p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors group">
                      <div className="h-10 w-10 rounded-lg bg-background flex items-center justify-center mr-4 border border-border shadow-sm">
                        <FileText className="w-5 h-5 text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{doc.title}</p>
                        <p className="text-xs text-muted-foreground">{new Date(doc.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No documents yet. Upload one to get started.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Chat */}
          <Card className="h-full border-border/50 shadow-sm bg-gradient-to-br from-primary/5 via-card to-card">
            <CardHeader>
              <CardTitle>Start a Conversation</CardTitle>
              <CardDescription>Ask questions about your uploaded documents</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center text-center py-8">
              <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-primary" />
              </div>
              <p className="max-w-xs text-muted-foreground mb-6">
                Our AI can analyze your documents and answer complex questions instantly.
              </p>
              <Link href="/chat">
                <Button size="lg" className="w-full sm:w-auto shadow-xl shadow-primary/20">
                  Start Chat Session
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </LayoutShell>
  );
}
