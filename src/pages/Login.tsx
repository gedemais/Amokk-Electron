import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff } from "lucide-react";
import logo from "@/assets/logo.png";
import { logger } from "@/utils/logger";
import { useDebugPanel } from "@/hooks/useDebugPanel";
import { useLanguage } from "@/context/LanguageContext";

// Backend API URL from environment variables
const BACKEND_HOST = import.meta.env.VITE_BACKEND_HOST || '127.0.0.1';
const BACKEND_PORT = import.meta.env.VITE_BACKEND_PORT || '8000';
const BACKEND_URL = `http://${BACKEND_HOST}:${BACKEND_PORT}`;

const Login = () => {
  const navigate = useNavigate();
  const debug = useDebugPanel();
  const { t } = useLanguage();
  const isDev = import.meta.env.DEV;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Fetch local data to autofill email
  useEffect(() => {
    const fetch_local_data = async () => {
      try {
        logger.api('GET', '/get_local_data');
        const response = await fetch(`${BACKEND_URL}/get_local_data`);
        const data = await response.json();

        debug.log('GET_LOCAL_DATA', data);
        logger.apiResponse('/get_local_data', response.status, data);

        if (data.email) {
          setEmail(data.email);
        }

        // In dev mode, also pre-fill password
        if (isDev) {
          setPassword("admin");
        }
      } catch (error) {
        logger.error('GET_LOCAL_DATA failed', error);
        debug.log('GET_LOCAL_DATA_ERROR', {
          error: error instanceof Error ? error.message : 'Unknown error',
          url: `${BACKEND_URL}/get_local_data`,
          method: 'GET'
        });

        // Fallback to dev credentials if fetch fails in dev mode
        if (isDev) {
          setEmail("admin@amokk.fr");
          setPassword("admin");
        }
      }
    };

    fetch_local_data();
  }, [isDev]);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      logger.api("POST", "/login", { email, password });

      const response = await fetch(`${BACKEND_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || t('pages.Login.login_failed_default'));
      }

      debug.log("LOGIN RESPONSE", data);
      logger.success("Login successful", data);

      // Store token (optional - for future use)
      localStorage.setItem("auth_token", data.token);

      navigate("/dashboard");
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : t('pages.Login.login_failed_default');
      logger.error("Login error", errorMsg);
      debug.log("LOGIN_ERROR", {
        error: errorMsg,
        url: `${BACKEND_URL}/login`,
        method: "POST"
      });
      setErrorMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/20 animate-pulse" style={{ animationDuration: '8s' }} />
      
      <Card className="w-full max-w-md relative z-10 border-border/50 bg-card/95 backdrop-blur">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <img src={logo} alt="AMOKK Logo" className="h-20 w-20" />
          </div>
          <CardTitle className="text-3xl font-bold glow-text">{t('pages.Login.welcome_title')}</CardTitle>
          <CardDescription className="text-muted-foreground">
            {t('pages.Login.welcome_description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('pages.Login.email_label')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('pages.Login.email_placeholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-input border-border focus:border-accent focus:ring-accent"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('pages.Login.password_label')}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t('pages.Login.password_placeholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-input border-border focus:border-accent focus:ring-accent pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {errorMessage && (
              <div className="p-3 rounded-lg bg-red-900/30 border border-red-500/50 text-red-400 text-sm">
                {errorMessage}
              </div>
            )}
            <Button
              type="button"
              variant="gaming"
              className="w-full text-lg h-12"
              disabled={isLoading}
              onClick={(e) => handleLogin(e as unknown as React.FormEvent)}
            >
              {isLoading ? t('pages.Login.login_button_loading') : t('pages.Login.login_button')}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {t('pages.Login.no_account')}{" "}
              <a
                href="https://amokk.fr/auth"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 font-medium transition-colors"
              >
                {t('pages.Login.create_account')}
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
