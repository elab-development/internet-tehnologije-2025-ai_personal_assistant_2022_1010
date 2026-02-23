import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";

// 1. FIX: Added explicit return type to satisfy TypeScript's fetch requirements
const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem("token");
  return token ? { "Authorization": `Bearer ${token}` } : {};
};

export function useDocuments() {
  return useQuery({
    queryKey: [api.documents.list.path],
    queryFn: async () => {
      const res = await fetch(api.documents.list.path, {
        // Headers are now correctly typed
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch documents");
      return await res.json();
    },
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(api.documents.upload.path, {
        method: api.documents.upload.method,
        headers: {
          ...getAuthHeaders(),
          // Boundary is automatically set by the browser for FormData
        },
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.documents.list.path] });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      // 2. FIX: Ensure path matches your FastAPI route exactly
      const res = await fetch(`/api/documents/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Delete failed");
      }
      return await res.json();
    },
    onSuccess: () => {
      // Refresh the list immediately after a successful delete
      queryClient.invalidateQueries({ queryKey: [api.documents.list.path] });
    },
  });
}
