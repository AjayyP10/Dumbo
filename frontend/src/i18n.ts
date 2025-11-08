import i18n from "i18next";
import { initReactI18next } from "react-i18next";

/* Simple in-bundle resources.
   You can later move these into public/locales/{lng}/translation.json
   and load them with i18next-http-backend if desired. */
const resources = {
  en: {
    translation: {
      translate: "Translate",
      translating: "Translating...",
      clear: "Clear",
      history: "History",
      copied: "Copied!",
      copy: "Copy",
      logout: "Logout",
      hello: "Hello {{name}}",
      noTranslationsYet: "No translations yet.",
      placeholderOutput: "Your translated text will appear here.",
    },
  },
  de: {
    translation: {
      translate: "Übersetzen",
      translating: "Übersetze...",
      clear: "Löschen",
      history: "Verlauf",
      copied: "Kopiert!",
      copy: "Kopieren",
      logout: "Abmelden",
      hello: "Hallo {{name}}",
      noTranslationsYet: "Noch keine Übersetzungen.",
      placeholderOutput: "Ihre Übersetzung erscheint hier.",
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "en",          // default language
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;