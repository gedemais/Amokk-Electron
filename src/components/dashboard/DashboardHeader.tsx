import logo from "@/assets/logo.png";
import LanguageSelector from "@/components/LanguageSelector";
import { useTranslation } from "react-i18next";
const { t } = useTranslation();

const DashboardHeader = () => {
  return (
    <header className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-3">
        <img src={logo} alt="AMOKK" className="h-12 w-12" />
        <h1 className="text-3xl font-bold glow-text">
          {t("components.dashboard.DashboardHeader")}
        </h1>
      </div>
      <LanguageSelector />
    </header>
  );
};

export default DashboardHeader;
