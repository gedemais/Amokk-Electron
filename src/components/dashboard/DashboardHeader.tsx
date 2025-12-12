import logo from "@/assets/logo.png";

const DashboardHeader = () => {
  return (
    <header className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-3">
        <img src={logo} alt="AMOKK" className="h-12 w-12" />
        <h1 className="text-3xl font-bold glow-text">AMOKK</h1>
      </div>
    </header>
  );
};

export default DashboardHeader;
