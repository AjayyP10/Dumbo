import { useQuery } from "@tanstack/react-query";
import { api } from "../api";

interface TranslationResponse {
  translation: string;
  level: string;
}

export const useTranslation = (
  text: string,
  targetLang: string,
  level: string,
) => {
  return useQuery({
    queryKey: ["translation", text, targetLang, level],
    queryFn: async (): Promise<TranslationResponse> => {
      const response = await api.post("/translate/", {
        text,
        target_lang: targetLang,
        level,
      });
      return response.data;
    },
    enabled: !!text.trim(),
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    retry: 1,
  });
};
