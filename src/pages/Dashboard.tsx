import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Settings, HelpCircle, Power, CheckCircle, ChevronDown, Zap, Keyboard, Volume2, Sparkles, Target, Brain, Swords, Rocket, Check } from "lucide-react";
import logo from "@/assets/logo.png";
import { useDebugPanel } from "@/hooks/useDebugPanel";
import { logger } from "@/utils/logger";

// Backend API URL from environment variables
const BACKEND_HOST = import.meta.env.VITE_BACKEND_HOST || '127.0.0.1';
const BACKEND_PORT = import.meta.env.VITE_BACKEND_PORT || '8000';
const BACKEND_URL = `http://${BACKEND_HOST}:${BACKEND_PORT}`;
const isDev = import.meta.env.DEV;

const Dashboard = () => {
  const debug = useDebugPanel();
  const volumeDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const [amokkToggle, setAmokkToggle] = useState(false);
  const [assistantToggle, setAssistantToggle] = useState(false);
  const [pushToTalkKey, setPushToTalkKey] = useState("V");
  const [proactiveCoachEnabled, setProactiveCoachEnabled] = useState(false);
  const [troubleshootOpen, setTroubleshootOpen] = useState(false);
  const [remainingGames, setRemainingGames] = useState(42);
  const [isBindingKey, setIsBindingKey] = useState(false);
  const [volume, setVolume] = useState([70]);
  const [pricingDialogOpen, setPricingDialogOpen] = useState(false);
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);

  // Fetch initial data on component mount (once)
  useEffect(() => {
    fetchLocalData();

    // Optional: Poll data every 5 seconds
    // const interval = setInterval(fetchLocalData, 5000);
    // return () => clearInterval(interval);
  }, []);

  // Call logout when window is about to close
  useEffect(() => {
    const handle_before_unload = () => {
      clean_exit();
    };

    window.addEventListener('beforeunload', handle_before_unload);

    return () => {
      window.removeEventListener('beforeunload', handle_before_unload);
    };
  }, []);

  // Cleanup volume debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (volumeDebounceRef.current) {
        clearTimeout(volumeDebounceRef.current);
      }
    };
  }, []);

  // =====================================================================
  // Backend API Functions
  // =====================================================================

  const fetchLocalData = async () => {
    try {
      logger.api('GET', '/get_local_data');
      const response = await fetch(`${BACKEND_URL}/get_local_data`);
      const data = await response.json();

      debug.log('GET_LOCAL_DATA', data);
      logger.apiResponse('/get_local_data', response.status, data);

      // Load remaining games
      if (data.remaining_games !== undefined) {
        setRemainingGames(data.remaining_games);
      }

      // Load AMOKK toggle state (Dashboard)
      if (data.amokk_toggle !== undefined) {
        setAmokkToggle(data.amokk_toggle);
      }

      // Load assistant toggle state (Configuration)
      if (data.assistant_toggle !== undefined) {
        setAssistantToggle(data.assistant_toggle);
      }

      // Load assistant toggle state (Configuration)
      if (data.coach_toggle !== undefined) {
        setProactiveCoachEnabled(data.coach_toggle);
      }

      // Load push-to-talk key
      if (data.ptt_key !== undefined) {
        setPushToTalkKey(data.ptt_key);
      }

      // Load volume
      if (data.tts_volume !== undefined) {
        setVolume([data.tts_volume]);
      }

      // Show progress dialog if first launch
      if (data.first_launch === true) {
        setProgressDialogOpen(true);
      }
    } catch (error) {
      logger.error('GET_LOCAL_DATA failed', error);
      debug.log('GET_LOCAL_DATA_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error',
        url: `${BACKEND_URL}/get_local_data`,
        method: 'GET'
      });
    }
  };

  const toggleAmokkCoach = async (newState: boolean) => {
    try {
      logger.api('PUT', '/amokk_toggle', { active: newState });
      const response = await fetch(`${BACKEND_URL}/amokk_toggle`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: newState }),
      });
      const data = await response.json();

      debug.log('AMOKK_TOGGLE', data);
      logger.apiResponse('/amokk_toggle', response.status, data);

      setAmokkToggle(newState);
    } catch (error) {
      logger.error('AMOKK_TOGGLE failed', error);
      debug.log('AMOKK_TOGGLE_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error',
        url: `${BACKEND_URL}/amokk_toggle`,
        method: 'PUT'
      });
    }
  };

  const toggleAssistant = async (newState: boolean) => {
    try {
      logger.api('PUT', '/assistant_toggle', { active: newState });
      const response = await fetch(`${BACKEND_URL}/assistant_toggle`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: newState }),
      });
      const data = await response.json();

      debug.log('ASSISTANT_TOGGLE', data);
      logger.apiResponse('/assistant_toggle', response.status, data);

      setAssistantToggle(newState);
    } catch (error) {
      logger.error('ASSISTANT_TOGGLE failed', error);
      debug.log('ASSISTANT_TOGGLE_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error',
        url: `${BACKEND_URL}/assistant_toggle`,
        method: 'PUT'
      });
    }
  };


  const updateVolume = async (newVolume: number) => {
    try {
      logger.api('PUT', '/update_volume', { volume: newVolume });
      const response = await fetch(`${BACKEND_URL}/update_volume`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ volume: newVolume }),
      });
      const data = await response.json();

      debug.log('UPDATE_VOLUME', data);
      logger.apiResponse('/update_volume', response.status, data);

      setVolume([newVolume]);
    } catch (error) {
      logger.error('UPDATE_VOLUME failed', error);
      debug.log('UPDATE_VOLUME_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error',
        url: `${BACKEND_URL}/update_volume`,
        method: 'PUT'
      });
    }
  };

  const updatePushToTalkKey = async (newKey: string) => {
    try {
      logger.api('PUT', '/update_ptt_key', { ptt_key: newKey });
      const response = await fetch(`${BACKEND_URL}/update_ptt_key`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ptt_key: newKey }),
      });
      const data = await response.json();

      debug.log('UPDATE_PTT_KEY', data);
      logger.apiResponse('/update_ptt_key', response.status, data);

      setPushToTalkKey(newKey);
    } catch (error) {
      logger.error('UPDATE_PTT_KEY failed', error);
      debug.log('UPDATE_PTT_KEY_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error',
        url: `${BACKEND_URL}/update_ptt_key`,
        method: 'PUT'
      });
    }
  };

  const selectPlan = async (planId: number) => {
    try {
      logger.api('POST', '/mock_select_plan', { plan_id: planId });
      const response = await fetch(`${BACKEND_URL}/mock_select_plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_id: planId }),
      });
      const data = await response.json();

      debug.log('MOCK_SELECT_PLAN', data);
      logger.apiResponse('/mock_select_plan', response.status, data);

      setRemainingGames(data.remaining_games);
      setPricingDialogOpen(false);
    } catch (error) {
      logger.error('MOCK_SELECT_PLAN failed', error);
      debug.log('MOCK_SELECT_PLAN_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error',
        url: `${BACKEND_URL}/mock_select_plan`,
        method: 'POST'
      });
    }
  };

  const toggleProactiveCoach = async (newState: boolean) => {
    try {
      logger.api('PUT', '/coach_toggle', { active: newState });
      const response = await fetch(`${BACKEND_URL}/coach_toggle`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: newState }),
      });
      const data = await response.json();

      debug.log('MOCK_PROACTIVE_COACH_TOGGLE', data);
      logger.apiResponse('/mock_proactive_coach_toggle', response.status, data);

      setProactiveCoachEnabled(newState);
    } catch (error) {
      logger.error('MOCK_PROACTIVE_COACH_TOGGLE failed', error);
      debug.log('MOCK_PROACTIVE_COACH_TOGGLE_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error',
        url: `${BACKEND_URL}/mock_proactive_coach_toggle`,
        method: 'PUT'
      });
    }
  };

  const contactSupport = async () => {
    try {
      logger.api('POST', '/mock_contact_support', { subject: 'Support Request' });
      const response = await fetch(`${BACKEND_URL}/mock_contact_support`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: 'Support Request', message: '' }),
      });
      const data = await response.json();

      debug.log('MOCK_CONTACT_SUPPORT', data);
      logger.apiResponse('/mock_contact_support', response.status, data);
    } catch (error) {
      logger.error('MOCK_CONTACT_SUPPORT failed', error);
      debug.log('MOCK_CONTACT_SUPPORT_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error',
        url: `${BACKEND_URL}/mock_contact_support`,
        method: 'POST'
      });
    }
  };

  const clean_exit = async () => {
    try {
      logger.api('POST', '/logout');
      const response = await fetch(`${BACKEND_URL}/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();

      debug.log('LOGOUT', data);
      logger.apiResponse('/logout', response.status, data);
    } catch (error) {
      logger.error('LOGOUT failed', error);
      debug.log('LOGOUT_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error',
        url: `${BACKEND_URL}/logout`,
        method: 'POST'
      });
    }
  };

  // =====================================================================
  // UI Event Handlers
  // =====================================================================

  const handleAmokkToggle = (checked: boolean) => {
    toggleAmokkCoach(checked);
  };

  const handleAssistantToggle = (checked: boolean) => {
    toggleAssistant(checked);
  };

  const handleVolumeChange = (values: number[]) => {
    // Update local state immediately for visual feedback
    setVolume(values);

    // Clear existing timeout
    if (volumeDebounceRef.current) {
      clearTimeout(volumeDebounceRef.current);
    }

    // Set new timeout to call API after user stops dragging (500ms delay)
    volumeDebounceRef.current = setTimeout(() => {
      const newVolume = values[0];
      updateVolume(newVolume);
    }, 500);
  };

  const handleBindKey = () => {
    setIsBindingKey(true);
    logger.info('Listening for key press...');
    debug.log('KEY_BINDING_STARTED', { message: 'Waiting for key press...' });

    const handleKeyDown = async (event: KeyboardEvent) => {
      event.preventDefault();
      const newKey = event.key.toUpperCase();
      logger.debug('Key pressed', newKey);

      document.removeEventListener('keydown', handleKeyDown);
      setIsBindingKey(false);

      // Send to backend
      await updatePushToTalkKey(newKey);
    };

    document.addEventListener('keydown', handleKeyDown);

    // Timeout after 5 seconds
    setTimeout(() => {
      document.removeEventListener('keydown', handleKeyDown);
      setIsBindingKey(false);
      debug.log('KEY_BINDING_TIMEOUT', { message: 'Key binding timeout - no key pressed' });
    }, 5000);
  };

  const handleTestVolume = () => {
    const utterance = new SpeechSynthesisUtterance("Test du niveau de volume");
    utterance.volume = volume[0] / 100;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <img src={logo} alt="AMOKK" className="h-12 w-12" />
          <h1 className="text-3xl font-bold glow-text">AMOKK</h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Remaining Games */}
        <Card className="border-border/50 bg-card/95 backdrop-blur">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-gradient-to-br from-primary to-accent">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">{remainingGames} Parties Coachées Restantes</h3>
                  <p className="text-sm text-muted-foreground">Déverrouillez le coaching illimité avec un plan premium</p>
                </div>
              </div>
              <Button 
                variant="gaming" 
                size="lg" 
                className="px-6"
                onClick={() => setPricingDialogOpen(true)}
              >
                Améliorer le Plan
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Plans Dialog */}
        <Dialog open={pricingDialogOpen} onOpenChange={setPricingDialogOpen}>
          <DialogContent className="bg-card border-border/50 max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-3xl font-bold text-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Choisissez votre plan
              </DialogTitle>
              <DialogDescription className="text-center text-base">
                Débloquez tout le potentiel d'Amokk avec un plan premium
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6">
              {/* Starter Plan */}
              <Card className="border-border/50 hover:border-primary/50 transition-all cursor-pointer group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardContent className="pt-8 pb-8 relative">
                  <div className="text-center space-y-6">
                    <div>
                      <h3 className="text-2xl font-bold text-foreground mb-2">Starter</h3>
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-4xl font-bold">5,99€</span>
                        <span className="text-muted-foreground">/mois</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-3">
                        Idéal pour progresser tranquillement.
                      </p>
                    </div>
                    
                    <div className="space-y-3 text-left">
                      <div className="flex gap-3 items-start">
                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm"><span className="font-bold text-primary">10</span> games coachées / mois</span>
                      </div>
                      <div className="flex gap-3 items-start">
                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm">Coach proactif durant toute la game</span>
                      </div>
                      <div className="flex gap-3 items-start">
                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm">Assistant Vocal en cours de partie (Push-To-Talk)</span>
                      </div>
                      <div className="flex gap-3 items-start">
                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm">Support en moins de 24h</span>
                      </div>
                      <div className="flex gap-3 items-start">
                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm">Sans engagement</span>
                      </div>
                    </div>

                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => selectPlan(1)}
                    >
                      Commencer
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Try-Hard Plan */}
              <Card className="border-border/50 hover:border-primary/50 transition-all cursor-pointer group relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-gradient-to-br from-primary to-primary text-white text-xs font-bold px-4 py-1 rounded-bl-lg">
                  UPGRADE
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardContent className="pt-8 pb-8 relative">
                  <div className="text-center space-y-6">
                    <div>
                      <h3 className="text-2xl font-bold text-foreground mb-2">Try-Hard</h3>
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-4xl font-bold">24,99€</span>
                        <span className="text-muted-foreground">/mois</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-3">
                        Tout ce qu'il faut pour grind et progresser rapidement !
                      </p>
                    </div>
                    
                    <div className="space-y-3 text-left">
                      <div className="flex gap-3 items-start">
                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm"><span className="font-bold text-primary">50</span> games coachées / mois</span>
                      </div>
                      <div className="flex gap-3 items-start">
                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm">Coach proactif durant toute la game</span>
                      </div>
                      <div className="flex gap-3 items-start">
                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm">Assistant Vocal en cours de partie (Push-To-Talk)</span>
                      </div>
                      <div className="flex gap-3 items-start">
                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm">Support en moins de 24h</span>
                      </div>
                      <div className="flex gap-3 items-start">
                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm">Sans engagement</span>
                      </div>
                    </div>

                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => selectPlan(2)}
                    >
                      Commencer
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Rush Plan */}
              <Card className="border-border/50 hover:border-primary/50 transition-all cursor-pointer group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardContent className="pt-8 pb-8 relative">
                  <div className="text-center space-y-6">
                    <div>
                      <h3 className="text-2xl font-bold text-foreground mb-2">Rush</h3>
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-4xl font-bold">89,99€</span>
                        <span className="text-muted-foreground">/mois</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-3">
                        Pour ceux qui veulent profiter d'Amokk à chaque game !
                      </p>
                    </div>
                    
                    <div className="space-y-3 text-left">
                      <div className="flex gap-3 items-start">
                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm font-bold text-primary">ILLIMITÉ</span>
                      </div>
                      <div className="flex gap-3 items-start">
                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm">Accès anticipé aux nouveautés</span>
                      </div>
                      <div className="flex gap-3 items-start">
                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm">Coach proactif durant toute la game</span>
                      </div>
                      <div className="flex gap-3 items-start">
                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm">Assistant Vocal en cours de partie (Push-To-Talk)</span>
                      </div>
                      <div className="flex gap-3 items-start">
                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm">Support en moins de 24h</span>
                      </div>
                      <div className="flex gap-3 items-start">
                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm">Sans engagement</span>
                      </div>
                    </div>

                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => selectPlan(3)}
                    >
                      Commencer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </DialogContent>
        </Dialog>

        {/* Progresse avec Amokk */}
        <Dialog open={progressDialogOpen} onOpenChange={setProgressDialogOpen}>
          <DialogTrigger asChild>
            <Card className="cursor-pointer hover:border-accent/50 transition-all hover:shadow-lg hover:shadow-accent/20 border-border/50 bg-card/95 backdrop-blur overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="pt-6 relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-4 rounded-full bg-gradient-to-br from-primary via-accent to-primary animate-pulse">
                      <Sparkles className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        Comment progresser avec Amokk ?
                      </h3>
                      <p className="text-sm text-muted-foreground">Découvrez comment Amokk transforme votre jeu</p>
                    </div>
                  </div>
                  <Rocket className="h-6 w-6 text-accent group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="bg-gradient-to-br from-card via-card to-card/95 border-accent/30 max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
            <DialogHeader className="relative space-y-4 pb-4">
              <div className="flex items-center justify-center">
                <div className="p-4 rounded-full bg-gradient-to-br from-primary via-accent to-primary animate-pulse shadow-lg shadow-accent/50">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
              </div>
              <DialogTitle className="text-4xl font-bold text-center bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Progresse avec Amokk
              </DialogTitle>
              <DialogDescription className="text-center text-base">
                Votre compagnon ultime pour dominer League of Legends
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-8 py-6 relative">
              <div className="space-y-4 text-center px-4">
                <h4 className="text-2xl font-bold text-foreground">Pourquoi Amokk ?</h4>
                <p className="text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                  Amokk a été créé pour transformer la façon dont vous apprenez League of Legends. 
                  Nous savons que maîtriser ce jeu peut sembler écrasant, avec tant de champions, 
                  de mécaniques et de stratégies à apprendre. C'est pourquoi nous avons développé 
                  un coach IA personnel qui vous guide en temps réel, transformant chaque partie 
                  en une opportunité d'apprentissage.
                </p>
              </div>

              <div className="space-y-5">
                <h4 className="text-2xl font-bold text-center text-foreground">Ce qu'Amokk vous permet de maîtriser</h4>
                <div className="grid gap-5">
                  <div className="flex gap-4 p-6 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/30 shadow-lg hover:shadow-primary/20 transition-all hover:scale-[1.02]">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg flex-shrink-0">
                      <Brain className="h-7 w-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h5 className="text-lg font-bold text-foreground mb-2">Connaître les 170 champions</h5>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Comprenez les forces, faiblesses et capacités de chaque champion pour anticiper les actions adverses
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 p-6 rounded-2xl bg-gradient-to-br from-accent/20 via-accent/10 to-transparent border border-accent/30 shadow-lg hover:shadow-accent/20 transition-all hover:scale-[1.02]">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-accent to-primary shadow-lg flex-shrink-0">
                      <Swords className="h-7 w-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h5 className="text-lg font-bold text-foreground mb-2">Jouer les matchups</h5>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Apprenez comment gérer chaque affrontement, quand être agressif et quand jouer prudemment
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 p-6 rounded-2xl bg-gradient-to-br from-primary/20 via-accent/10 to-transparent border border-primary/30 shadow-lg hover:shadow-primary/20 transition-all hover:scale-[1.02]">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg flex-shrink-0">
                      <Target className="h-7 w-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h5 className="text-lg font-bold text-foreground mb-2">Optimiser vos décisions</h5>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Recevez des conseils sur le placement, le timing et les stratégies macro pour améliorer votre impact
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 p-6 rounded-2xl bg-gradient-to-br from-accent/20 via-primary/10 to-transparent border border-accent/30 shadow-lg hover:shadow-accent/20 transition-all hover:scale-[1.02]">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-accent to-primary shadow-lg flex-shrink-0">
                      <Zap className="h-7 w-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h5 className="text-lg font-bold text-foreground mb-2">Corriger vos erreurs en temps réel</h5>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Identifiez et corrigez vos erreurs instantanément pour progresser plus rapidement
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden p-8 rounded-2xl bg-gradient-to-br from-primary via-accent to-primary shadow-2xl">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30" />
                <div className="relative flex items-center justify-center gap-3">
                  <Rocket className="h-8 w-8 text-white animate-bounce" />
                  <p className="text-lg text-center font-bold text-white">
                    Chaque partie avec Amokk est une opportunité de devenir meilleur.<br />
                    Activez le coaching et commencez votre ascension !
                  </p>
                  <Sparkles className="h-8 w-8 text-white animate-pulse" />
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Main Control and Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Main Control */}
          <Card className="border-border/50 bg-card/95 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-3">
                <Power className={`h-6 w-6 ${amokkToggle ? 'text-accent' : 'text-muted-foreground'}`} />
                Statut du Coach
              </CardTitle>
              <CardDescription>
                {amokkToggle ? 'AMOKK est actif et prêt à vous coacher' : 'Activez AMOKK pour commencer le coaching'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-6 rounded-lg bg-muted/50 border border-border">
                <span className="text-lg font-semibold">
                  {amokkToggle ? 'Actif' : 'Inactif'}
                </span>
                <Switch
                  checked={amokkToggle}
                  onCheckedChange={handleAmokkToggle}
                  className="data-[state=checked]:bg-accent"
                />
              </div>
            </CardContent>
          </Card>

          {/* Configuration */}
          <Dialog>
            <DialogTrigger asChild>
              <Card className="cursor-pointer hover:border-accent/50 transition-colors border-border/50 bg-card/95 backdrop-blur h-full">
                <CardContent className="pt-6 h-full flex items-center">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-primary/20">
                      <Settings className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Configuration</h3>
                      <p className="text-sm text-muted-foreground">Personnalisez les paramètres de votre coach</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent className="bg-card border-border/50">
              <DialogHeader>
                <DialogTitle className="text-2xl">Configuration</DialogTitle>
                <DialogDescription>
                  Personnalisez la façon dont AMOKK vous coach
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className={`font-semibold transition-colors ${assistantToggle ? 'text-accent' : 'text-foreground'}`}>
                        Assistant
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Activez l'assistant IA pour fournir des conseils et analyses en temps réel pendant le jeu
                      </p>
                    </div>
                    <Switch
                      checked={assistantToggle}
                      onCheckedChange={handleAssistantToggle}
                      className="data-[state=checked]:bg-accent ml-4"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-semibold">Raccourci Push-to-Talk</h4>
                      <p className="text-sm text-muted-foreground">
                        Maintenez le bouton push-to-talk pendant 1 seconde pendant que AMOKK parle pour interrompre les conseils
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBindKey}
                      className="border-accent/50 hover:bg-accent/10 min-w-[100px]"
                    >
                      <Keyboard className="h-4 w-4 mr-2" />
                      {isBindingKey ? "Appuyez sur une touche..." : pushToTalkKey}
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className={`font-semibold transition-colors ${proactiveCoachEnabled ? 'text-accent' : 'text-foreground'}`}>
                        Coach Proactif (V1.9.6)
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        AMOKK identifiera de manière proactive les opportunités et les erreurs sans attendre que vous demandiez
                      </p>
                    </div>
                    <Switch
                      checked={proactiveCoachEnabled}
                      onCheckedChange={toggleProactiveCoach}
                      className="data-[state=checked]:bg-accent ml-4"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex flex-col gap-4">
                    <div className="flex-1">
                      <h4 className="font-semibold">Volume</h4>
                      <p className="text-sm text-muted-foreground">
                        Ajustez le niveau du volume de la voix
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Volume2 className="h-4 w-4 text-muted-foreground" />
                      <Slider
                        value={volume}
                        onValueChange={handleVolumeChange}
                        max={100}
                        step={1}
                        className="flex-1"
                      />
                      <span className="text-sm font-medium min-w-[3ch]">{volume[0]}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleTestVolume}
                      className="border-accent/50 hover:bg-accent/10"
                    >
                      <Volume2 className="h-4 w-4 mr-2" />
                      Tester le Volume
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tutorial */}
        <Card className="border-border/50 bg-card/95 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-xl">Tutoriel de Démarrage Rapide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { step: 'A', title: 'Configurez votre coach', description: 'Configurez vos préférences dans les paramètres' },
              { step: 'B', title: 'Activez AMOKK', description: 'Basculez l\'interrupteur ci-dessus pour activer le coaching' },
              { step: 'C', title: 'Lancez une partie', description: 'Commencez simplement à jouer - AMOKK sera là pendant vos parties' },
              { step: 'D', title: 'Contrôlez les conseils', description: 'Maintenez push-to-talk pendant 1 seconde pendant que AMOKK parle pour interrompre' }
            ].map((item, index) => (
              <div key={index} className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center font-bold">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Troubleshooting */}
        <Card className="border-border/50 bg-card/95 backdrop-blur">
            <CardContent className="pt-6">
              <Collapsible open={troubleshootOpen} onOpenChange={setTroubleshootOpen}>
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-full bg-primary/20">
                        <HelpCircle className="h-6 w-6 text-accent" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">Un problème ?</h3>
                        <p className="text-sm text-muted-foreground">Trouvez des solutions aux problèmes courants</p>
                      </div>
                    </div>
                    <ChevronDown className={`h-5 w-5 transition-transform ${troubleshootOpen ? 'rotate-180' : ''}`} />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4 space-y-3">
                  <div className="p-4 rounded-lg bg-muted/30 space-y-3">
                    <div className="space-y-2">
                      <h4 className="font-medium flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-accent" />
                        Solutions Courantes
                      </h4>
                      <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                        <li>Assurez-vous que League of Legends est en cours d'exécution</li>
                        <li>Vérifiez les autorisations de votre microphone</li>
                        <li>Vérifiez que AMOKK est défini sur Actif</li>
                        <li>Redémarrez l'application si les problèmes persistent</li>
                      </ul>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full border-accent/50 hover:bg-accent/10"
                      onClick={contactSupport}
                    >
                      Nous Contacter
                    </Button>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>
      </div>
    </div>
  );
};

export default Dashboard;
