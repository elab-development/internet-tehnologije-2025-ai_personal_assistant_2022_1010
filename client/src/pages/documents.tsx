import { useState, useRef } from "react";
import { LayoutShell } from "@/components/layout-shell";
// Added useDeleteDocument to the imports
import { useDocuments, useUploadDocument, useDeleteDocument } from "@/hooks/use-documents";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  FileText, 
  Upload, 
  Search, 
  Loader2, 
  File, 
  MoreVertical,
  Trash2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function DocumentsPage() {
  const { data: documents, isLoading } = useDocuments();
  const uploadMutation = useUploadDocument();
  const deleteMutation = useDeleteDocument(); // <--- Initialize the delete hook
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    uploadMutation.mutate(file, {
      onSuccess: () => {
        toast({
          title: "Document Uploaded",
          description: "Processing complete. It's now ready for chat.",
        });
        if (fileInputRef.current) fileInputRef.current.value = "";
      },
      onError: () => {
        toast({
          title: "Upload Failed",
          description: "Please try again with a PDF, TXT, or MD file.",
          variant: "destructive",
        });
      },
    });
  };

  // --- NEW: Delete Logic ---
  const handleDelete = (id: number) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    deleteMutation.mutate(id, {
      onSuccess: () => {
        toast({
          title: "Document Deleted",
          description: "The file has been removed from your knowledge base.",
        });
      },
      onError: (error: any) => {
        toast({
          title: "Delete Failed",
          description: error.response?.data?.detail || "Could not remove the document.",
          variant: "destructive",
        });
      },
    });
  };

  const filteredDocs = documents?.filter((doc: any) => 
    doc.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <LayoutShell>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Documents</h1>
            <p className="text-muted-foreground mt-1">
              Manage your knowledge base files.
            </p>
          </div>
          <div className="relative">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".pdf,.txt,.md,.markdown"
              onChange={handleFileChange}
            />
            <Button 
              onClick={() => fileInputRef.current?.click()} 
              disabled={uploadMutation.isPending}
              className="shadow-lg shadow-primary/20"
            >
              {uploadMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              {uploadMutation.isPending ? "Uploading..." : "Upload File"}
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search documents..." 
            className="pl-10 h-12 rounded-xl bg-card border-border/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : filteredDocs?.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-border rounded-3xl bg-card/50">
            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <File className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No documents found</h3>
            <p className="text-muted-foreground max-w-sm mx-auto mb-6">
              Upload PDF, TXT, or Markdown files to start building your knowledge base.
            </p>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              Upload First Document
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocs?.map((doc: any) => (
              <Card key={doc.id} className="group hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                      <FileText className="h-6 w-6" />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {/* FIXED: Added onClick and disabled state */}
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive cursor-pointer"
                          onClick={() => handleDelete(doc.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> 
                          {deleteMutation.isPending ? "Deleting..." : "Delete"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <h3 className="font-semibold text-lg truncate mb-1" title={doc.title}>
                    {doc.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 truncate">
                    {doc.filename}
                  </p>
                  
                  <div className="pt-4 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                    <span className="bg-secondary px-2 py-1 rounded-md text-foreground font-medium">
                      Processed
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </LayoutShell>
  );
}