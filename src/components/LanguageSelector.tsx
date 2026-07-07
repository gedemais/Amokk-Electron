import React, { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, Globe } from "lucide-react";
import * as api from "@/lib/api";

const languages = [
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "it", name: "Italiano", flag: "🇮🇹", },
];

interface LanguageSelectorProps {
  // Called after the backend has been notified of the new language, so the
  // parent can refresh language-dependent data (e.g. TTS voice names).
  onLanguageChanged?: (lang: string) => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ onLanguageChanged }) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const currentLanguage = useMemo(() => {
    return languages.find((lang) => lang.code === i18n.resolvedLanguage);
  }, [i18n.resolvedLanguage]);

  const changeLanguage = async (langCode: string) => {
    i18n.changeLanguage(langCode);
    await api.updateLanguage(langCode);
    onLanguageChanged?.(langCode);
    setIsOpen(false);
  };

  useEffect(() => {
    if (!currentLanguage) {
      changeLanguage("fr");
    }
  }, [currentLanguage]);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors text-sm py-2 px-3 rounded-lg hover:bg-gray-800/50"
      >
        <Globe className="w-4 h-4" />
        <span className="hidden md:inline">
          {(currentLanguage ?? languages[0]).flag}
        </span>
        <span className="hidden lg:inline">
          {(currentLanguage ?? languages[0]).name}
        </span>
        <ChevronDown
          className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""
            }`}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-20 min-w-[160px]">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => changeLanguage(language.code)}
                className={`w-full flex items-center space-x-3 px-4 py-3 text-sm hover:bg-gray-800 transition-colors first:rounded-t-lg last:rounded-b-lg ${(currentLanguage ?? languages[0]).code === language.code
                    ? "text-blue-400 bg-gray-800/50"
                    : "text-gray-300 hover:text-white"
                  }`}
              >
                <span className="text-base">{language.flag}</span>
                <span>{language.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSelector;
