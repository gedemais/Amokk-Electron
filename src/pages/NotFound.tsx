import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";

const NotFound = () => {
  const location = useLocation();
  const { t } = useLanguage();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">{t('pages.NotFound.title')}</h1>
        <p className="mb-4 text-xl text-gray-600">{t('pages.NotFound.message')}</p>
        <a href="/" className="text-blue-500 underline hover:text-blue-700">
          {t('pages.NotFound.link')}
        </a>
      </div>
    </div>
  );
};

export default NotFound;
