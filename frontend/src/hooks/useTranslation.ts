import { useQuery } from "@tanstack/react-query";
import { api } from "../api";

interface TranslationResponse {
  translation: string;
  level: string;
}

export const useTranslation = (
  text: string,
  sourceLang: string,
  targetLang: string,
  level: string,
) => {
  return useQuery({
    queryKey: ["translation", text, sourceLang, targetLang, level],
    queryFn: async (): Promise<TranslationResponse> => {
      console.log("Fetching translation for:", text);
      try {
        const response = await api.post("translate/", {
          input_text: text,
          source_lang: sourceLang,
          target_lang: targetLang,
          level,
        });
        console.log("Translation response:", response.data);
        return response.data;
      } catch (error) {
        console.error("Translation error:", error);
        throw error;
      }
    },
    enabled: !!text.trim(),
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    retry: 1,
  });
};
