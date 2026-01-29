import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";

// Helper to get headers with auth token
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export function useDocuments() {
  return useQuery({
    queryKey: [api.documents.list.path],
    queryFn: async () => {
      const res = await fetch(api.documents.list.path, {
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
          // Don't set Content-Type for FormData, browser does it with boundary
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
