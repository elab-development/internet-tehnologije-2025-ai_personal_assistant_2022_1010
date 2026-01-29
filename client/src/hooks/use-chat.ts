import { useMutation } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { z } from "zod";

type ChatInput = z.infer<typeof api.chat.query.input>;

export function useChat() {
  return useMutation({
    mutationFn: async (data: ChatInput) => {
      const token = localStorage.getItem("token");
      const res = await fetch(api.chat.query.path, {
        method: api.chat.query.method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Failed to send query");
      return await res.json();
    },
  });
}
