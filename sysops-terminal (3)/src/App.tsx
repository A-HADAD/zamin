/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { 
  ShieldCheck, LogOut, Shield, Delete, Volume2, Languages, 
  Zap, Bell, Lock, PhoneCall, Play, Upload, Plus, Type, Palette,
  Terminal, Calendar, Clock, VolumeX, ExternalLink, QrCode
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { QRCodeSVG } from "qrcode.react";

type Screen = "login" | "dashboard";

const DAYS = ["א", "ב", "ג", "ד", "ה", "ו", "ש"];

// Mock or real battery API
interface BatteryManager extends EventTarget {
  level: number;
  charging: boolean;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("login");
  const [loginPin, setLoginPin] = useState("");
  const [showQr, setShowQr] = useState(false);

  const handleOpenFull = () => {
    window.open(window.location.href, '_blank');
  };
  
  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  
  // Dashboard States
  const [batteryThreshold, setBatteryThreshold] = useState(20);
  const [sleepTime, setSleepTime] = useState(30);
  const [quietModeTime, setQuietModeTime] = useState(60);
  const [autoSound, setAutoSound] = useState(false);
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [trackedNumbers, setTrackedNumbers] = useState<string[]>([]);
  const [batterySoundName, setBatterySoundName] = useState("לא נבחר קובץ");
  const [emergencySoundName, setEmergencySoundName] = useState("לא נבחר קובץ");
  const [consoleDesign, setConsoleDesign] = useState("דיפולט");
  const [systemFont, setSystemFont] = useState("Inter");

  // Refs for file inputs
  const batteryFileRef = useRef<HTMLInputElement>(null);
  const emergencyFileRef = useRef<HTMLInputElement>(null);

  // Schedule States
  const [selectedDays, setSelectedDays] = useState<number[]>([6]); // Default: Saturday only
  const [startTime, setStartTime] = useState("05:00");
  const [endTime, setEndTime] = useState("17:00");

  // Battery & Alert States
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [isBeepDelayed, setIsBeepDelayed] = useState(false);
  const [beepDelayUntil, setBeepDelayUntil] = useState<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Handlers
  const handleAddPhoneNumber = () => {
    if (phoneNumber.trim() && !trackedNumbers.includes(phoneNumber.trim())) {
      setTrackedNumbers(prev => [...prev, phoneNumber.trim()]);
      setPhoneNumber("");
      playBeep(660, 0.1);
    }
  };

  const handleRemovePhoneNumber = (num: string) => {
    setTrackedNumbers(prev => prev.filter(n => n !== num));
    playBeep(330, 0.1);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'battery' | 'emergency') => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === 'battery') setBatterySoundName(file.name);
      else setEmergencySoundName(file.name);
      playBeep(550, 0.2);
    }
  };

  const handleUpdatePin = () => {
    if (currentPin.length === 4 && newPin.length === 4) {
      alert("קוד ה-PIN עודכן בהצלחה!");
      setCurrentPin("");
      setNewPin("");
      playBeep(880, 0.3);
    } else {
      alert("נא להזין קוד PIN תקין (4 ספרות)");
    }
  };

  const cycleDesign = () => {
    const designs = ["דיפולט", "מינימליסטי", "עתידני", "קלאסי"];
    const next = designs[(designs.indexOf(consoleDesign) + 1) % designs.length];
    setConsoleDesign(next);
    playBeep(440, 0.05);
  };

  const cycleFont = () => {
    const fonts = ["Inter", "JetBrains Mono", "System", "Arial"];
    const next = fonts[(fonts.indexOf(systemFont) + 1) % fonts.length];
    setSystemFont(next);
    playBeep(440, 0.05);
  };

  // Initialize Audio Context on first interaction
  const initAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  };

  const playBeep = (frequency = 440, duration = 0.2) => {
    initAudio();
    if (!audioContextRef.current) return;
    
    const osc = audioContextRef.current.createOscillator();
    const gain = audioContextRef.current.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(frequency, audioContextRef.current.currentTime);
    
    gain.gain.setValueAtTime(0.1, audioContextRef.current.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(audioContextRef.current.destination);
    
    osc.start();
    osc.stop(audioContextRef.current.currentTime + duration);
  };

  // PWA Installation Listener
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const [showInstallModal, setShowInstallModal] = useState(false);
  const [installInstructions, setInstallInstructions] = useState("");

  const handleInstall = async () => {
    console.log("Install button clicked");
    const isIframe = window.self !== window.top;
    if (isIframe) {
      setInstallInstructions("עליך לפתוח את האפליקציה בטאב חדש כדי להתקין. לחץ על האייקון של החץ בפינה הימנית למעלה של התצוגה המקדימה.");
      setShowInstallModal(true);
      return;
    }

    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setDeferredPrompt(null);
        }
      } catch (err) {
        setInstallInstructions("אירעה שגיאה. נסה להתקין דרך תפריט הדפדפן (3 נקודות -> התקן אפליקציה).");
        setShowInstallModal(true);
      }
    } else {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;

      if (isStandalone) {
        setInstallInstructions("האפליקציה כבר מותקנת ופועלת כרגע במצב עצמאי.");
      } else if (isIOS) {
        setInstallInstructions("להתקנה באייפון: לחץ על כפתור ה-'שתף' (Share) בתחתית הדפדפן ובחר 'הוסף למסך הבית' (Add to Home Screen).");
      } else {
        setInstallInstructions("להתקנה באנדרואיד/מחשב: לחץ על 3 הנקודות בדפדפן (למעלה מימין) ובחר 'התקן אפליקציה' או 'הוסף למסך הבית'.");
      }
      setShowInstallModal(true);
    }
  };

  // Battery Monitoring
  useEffect(() => {
    const updateBattery = (battery: BatteryManager) => {
      setBatteryLevel(battery.level * 100);
    };

    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: BatteryManager) => {
        updateBattery(battery);
        battery.addEventListener('levelchange', () => updateBattery(battery));
      });
    }
  }, []);

  // Beep Delay Logic
  useEffect(() => {
    if (isBeepDelayed && beepDelayUntil) {
      const interval = setInterval(() => {
        if (Date.now() >= beepDelayUntil) {
          setIsBeepDelayed(false);
          setBeepDelayUntil(null);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isBeepDelayed, beepDelayUntil]);

  const toggleBeepDelay = () => {
    initAudio();
    if (isBeepDelayed) {
      setIsBeepDelayed(false);
      setBeepDelayUntil(null);
    } else {
      setIsBeepDelayed(true);
      setBeepDelayUntil(Date.now() + sleepTime * 60 * 1000);
    }
  };

  // Alert Sound Logic (Simulated)
  useEffect(() => {
    const checkAlert = () => {
      if (batteryLevel < batteryThreshold && !isBeepDelayed) {
        playBeep(880, 0.5); // High pitch beep for alert
      }
    };

    const interval = setInterval(checkAlert, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, [batteryLevel, batteryThreshold, isBeepDelayed]);

  const toggleDay = (index: number) => {
    setSelectedDays(prev => 
      prev.includes(index) ? prev.filter(d => d !== index) : [...prev, index]
    );
  };

  const handleKeypadPress = (num: string) => {
    initAudio();
    if (loginPin.length < 4) {
      setLoginPin(prev => prev + num);
    }
  };

  const handleBackspace = () => {
    setLoginPin(prev => prev.slice(0, -1));
  };

  useEffect(() => {
    if (loginPin.length === 4) {
      setTimeout(() => {
        setScreen("dashboard");
        setLoginPin("");
      }, 300);
    }
  }, [loginPin]);

  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-x-hidden select-none" dir="rtl">
      <AnimatePresence mode="wait">
        {screen === "login" ? (
          <motion.div
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="relative min-h-screen flex flex-col items-center justify-center p-6"
          >
            {/* Header */}
            <div className="absolute top-8 left-8 right-8 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-white/60 hover:text-white cursor-pointer transition-colors">
                  <span className="text-sm font-bold">HE</span>
                  <Languages className="w-4 h-4" />
                </div>
                
                <button 
                  onClick={handleOpenFull}
                  className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all"
                >
                  <span className="text-xs font-bold">מסך מלא</span>
                  <ExternalLink className="w-4 h-4" />
                </button>

                <button 
                  onClick={() => setShowQr(!showQr)}
                  className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all"
                >
                  <span className="text-xs font-bold">סרוק לטאבלט</span>
                  <QrCode className="w-4 h-4" />
                </button>
              </div>
              
              <div 
                onClick={toggleBeepDelay}
                className={`flex items-center gap-3 border px-4 py-2 rounded-xl transition-all cursor-pointer group ${
                  isBeepDelayed 
                    ? 'bg-[#FFB800] border-[#FFB800] text-black shadow-[0_0_15px_rgba(255,184,0,0.3)]' 
                    : 'bg-black/40 border-[#FFB800]/20 text-[#FFB800] hover:bg-[#FFB800]/10'
                }`}
              >
                <span className="text-xs font-bold tracking-wide">
                  {isBeepDelayed ? `השהייה פעילה (${Math.ceil((beepDelayUntil! - Date.now()) / 60000)} דק')` : 'השהיית צפצופים'}
                </span>
                {isBeepDelayed ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </div>
            </div>

            {/* QR Code Overlay */}
            <AnimatePresence>
              {showQr && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md"
                  onClick={() => setShowQr(false)}
                >
                  <div 
                    className="bg-white p-8 rounded-[40px] space-y-6 text-center max-w-xs w-full"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="bg-white p-4 rounded-3xl inline-block shadow-2xl">
                      <QRCodeSVG value={window.location.href} size={200} />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-black text-xl font-bold">סרוק לטאבלט</h3>
                      <p className="text-black/60 text-sm leading-relaxed">
                        סרוק את הקוד כדי לפתוח את האפליקציה ישירות בטאבלט שלך ולהתקין אותה בקלות.
                      </p>
                    </div>
                    <button 
                      onClick={() => setShowQr(false)}
                      className="w-full bg-black text-white font-bold py-4 rounded-2xl hover:bg-black/80 transition-colors"
                    >
                      סגור
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Center Shield Icon */}
            <div className="mb-8">
              <div className="w-16 h-16 rounded-2xl border-2 border-[#FFB800]/30 bg-[#1A1608] flex items-center justify-center shadow-[0_0_30px_rgba(255,184,0,0.1)]">
                <Shield className="w-8 h-8 text-[#FFB800]" />
              </div>
            </div>

            {/* Title Section */}
            <div className="text-center space-y-2 mb-12">
              <h1 className="text-[#FFB800] text-4xl md:text-5xl font-black tracking-tight">
                קונסולת SYSOPS
              </h1>
              <p className="text-white/40 text-sm font-medium tracking-widest">
                הזן קוד PIN מאובטח
              </p>
            </div>

            {/* PIN Indicators */}
            <div className="flex gap-6 mb-16">
              {[0, 1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    scale: loginPin.length > i ? 1.2 : 1,
                    backgroundColor: loginPin.length > i ? "#FFB800" : "transparent",
                    borderColor: loginPin.length > i ? "#FFB800" : "rgba(255,184,0,0.3)"
                  }}
                  className="w-4 h-4 rounded-full border-2 transition-colors duration-200"
                />
              ))}
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-4 max-w-[320px] w-full">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  onClick={() => handleKeypadPress(num.toString())}
                  className="aspect-square rounded-2xl bg-[#0A0A0A] border border-white/5 flex items-center justify-center text-2xl font-bold text-[#FFB800] hover:bg-[#1A1608] hover:border-[#FFB800]/30 active:scale-95 transition-all"
                >
                  {num}
                </button>
              ))}
              <div className="flex items-center justify-center">
                <Shield className="w-6 h-6 text-[#FFB800]/40" />
              </div>
              <button
                onClick={() => handleKeypadPress("0")}
                className="aspect-square rounded-2xl bg-[#0A0A0A] border border-white/5 flex items-center justify-center text-2xl font-bold text-[#FFB800] hover:bg-[#1A1608] hover:border-[#FFB800]/30 active:scale-95 transition-all"
              >
                0
              </button>
              <button
                onClick={handleBackspace}
                className="aspect-square rounded-2xl bg-[#0A0A0A] border border-white/5 flex items-center justify-center text-[#FFB800] hover:bg-[#1A1608] hover:border-[#FFB800]/30 active:scale-95 transition-all"
              >
                <Delete className="w-6 h-6" />
              </button>
            </div>

            {/* Footer Watermark */}
            <div className="absolute bottom-8 left-8 text-left opacity-20 pointer-events-none hidden md:block">
              <h3 className="text-2xl font-bold">הפעל את Windows</h3>
              <p className="text-sm">עבור אל 'הגדרות' כדי להפעיל את Windows.</p>
            </div>

            {/* Bottom Left Logo */}
            <div className="absolute bottom-8 left-8">
               <div className="w-12 h-12 rounded-full border border-white/10 bg-black flex items-center justify-center text-xl font-bold text-white/40">N</div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto space-y-8"
          >
            {/* Dashboard Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-6 bg-[#0A0A0A] border border-white/5 p-2 rounded-2xl">
                <div className="flex items-center gap-2 px-4 py-2 border-l border-white/10">
                  <span className="text-sm font-bold text-white/60">HE</span>
                  <Languages className="w-4 h-4 text-white/60" />
                </div>
                <div 
                  onClick={cycleDesign}
                  className="flex items-center gap-3 px-4 py-2 border-l border-white/10 hover:text-[#FFB800] cursor-pointer transition-colors group"
                >
                  <Palette className="w-4 h-4 text-white/60 group-hover:text-[#FFB800]" />
                  <div className="flex flex-col">
                    <span className="text-[10px] text-white/40 font-bold uppercase">עיצוב</span>
                    <span className="text-xs font-bold">{consoleDesign}</span>
                  </div>
                </div>
                <div 
                  onClick={cycleFont}
                  className="flex items-center gap-3 px-4 py-2 hover:text-[#FFB800] cursor-pointer transition-colors group"
                >
                  <Type className="w-4 h-4 text-white/60 group-hover:text-[#FFB800]" />
                  <div className="flex flex-col">
                    <span className="text-[10px] text-white/40 font-bold uppercase">גופן</span>
                    <span className="text-xs font-bold">{systemFont}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6 text-left" dir="ltr">
                <div className="space-y-1 text-right" dir="rtl">
                  <h1 className="text-[#FFB800] text-3xl font-black">קונסולת מערכת</h1>
                  <div className="flex items-center gap-2 justify-end">
                    <span className="text-white/40 text-[10px] font-mono tracking-wider uppercase">ניהול_מערכת_דרג_4 // מחובר</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                  </div>
                </div>
                <div className="w-14 h-14 rounded-2xl border border-[#FFB800]/20 bg-[#1A1608] flex items-center justify-center shadow-lg shadow-[#FFB800]/5">
                  <Terminal className="w-7 h-7 text-[#FFB800]" />
                </div>
              </div>
            </header>

            {/* Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Schedule & Active Hours */}
              <DashboardCard 
                title="לוח זמנים ושעות פעילות" 
                subtitle="הגדרת ימים ושעות בהם המערכת אינה פעילה" 
                icon={<Calendar className="w-5 h-5 text-[#FFB800]" />}
              >
                <div className="space-y-8">
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-[#FFB800]/60 uppercase tracking-wider block">בחר ימי פעילות</label>
                    <div className="flex justify-between gap-2">
                      {DAYS.map((day, i) => (
                        <button
                          key={i}
                          onClick={() => toggleDay(i)}
                          className={`flex-1 aspect-square rounded-xl border transition-all font-bold text-lg flex items-center justify-center ${
                            selectedDays.includes(i) 
                              ? 'bg-[#FFB800] border-[#FFB800] text-black shadow-lg shadow-[#FFB800]/20' 
                              : 'bg-[#111] border-white/5 text-white/40 hover:border-[#FFB800]/30'
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-[#FFB800]/60 uppercase tracking-wider flex items-center gap-2">
                        <Clock className="w-3 h-3" /> שעת התחלה
                      </label>
                      <input 
                        type="time" 
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full bg-[#111] border border-white/10 rounded-xl py-4 px-4 text-center font-bold text-[#FFB800] focus:border-[#FFB800]/50 outline-none transition-all [color-scheme:dark]"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-[#FFB800]/60 uppercase tracking-wider flex items-center gap-2">
                        <Clock className="w-3 h-3" /> שעת סיום
                      </label>
                      <input 
                        type="time" 
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full bg-[#111] border border-white/10 rounded-xl py-4 px-4 text-center font-bold text-[#FFB800] focus:border-[#FFB800]/50 outline-none transition-all [color-scheme:dark]"
                      />
                    </div>
                  </div>

                  <div className="bg-[#1A1608] border border-[#FFB800]/20 rounded-2xl p-4 flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-[#FFB800]/10">
                      <ShieldCheck className="w-4 h-4 text-[#FFB800]" />
                    </div>
                    <p className="text-[#FFB800] text-[11px] leading-relaxed font-medium">
                      המערכת תהיה מושבתת בין השעות {startTime} ל-{endTime} בימים שנבחרו.
                    </p>
                  </div>
                </div>
              </DashboardCard>

              {/* Power & Battery */}
              <DashboardCard 
                title="חשמל וסוללה" 
                subtitle={`רמת סוללה נוכחית: ${Math.round(batteryLevel)}%`}
                icon={<Zap className="w-5 h-5 text-[#FFB800]" />}
              >
                <div className="space-y-8">
                  <div className="flex justify-between items-end">
                    <SliderField 
                      label="סף התראת סוללה" 
                      value={batteryThreshold} 
                      unit="%" 
                      onChange={setBatteryThreshold} 
                    />
                    <button 
                      onClick={() => playBeep(440, 0.3)}
                      className="mb-1 px-4 py-2 rounded-xl bg-[#1A1608] border border-[#FFB800]/20 text-[#FFB800] text-xs font-bold hover:bg-[#FFB800]/10 transition-colors"
                    >
                      בדיקת צליל
                    </button>
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-[#FFB800]/60 block">בחירת קובץ צליל (סוללה)</label>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => playBeep(440, 0.5)}
                        className="p-3 rounded-xl bg-[#1A1608] border border-[#FFB800]/20 text-[#FFB800] hover:bg-[#FFB800]/10 transition-colors"
                      >
                        <Play className="w-4 h-4 fill-current" />
                      </button>
                      <div 
                        onClick={() => batteryFileRef.current?.click()}
                        className="flex-1 bg-[#111] border border-white/5 rounded-xl py-3 px-4 flex items-center justify-between group cursor-pointer hover:border-[#FFB800]/30 transition-all"
                      >
                        <span className="text-white/40 text-sm truncate max-w-[200px]">{batterySoundName}</span>
                        <Upload className="w-4 h-4 text-white/20 group-hover:text-[#FFB800]" />
                      </div>
                      <input 
                        type="file" 
                        ref={batteryFileRef} 
                        className="hidden" 
                        accept="audio/*"
                        onChange={(e) => handleFileChange(e, 'battery')}
                      />
                    </div>
                  </div>
                  <SliderField 
                    label="זמן השהייה (דקות)" 
                    value={sleepTime} 
                    unit="דק'" 
                    min={0}
                    max={120}
                    onChange={setSleepTime} 
                  />
                </div>
              </DashboardCard>

              {/* Sound & Notifications */}
              <DashboardCard 
                title="שמע והתראות" 
                subtitle="פרופילי סאונד והתראות" 
                icon={<Volume2 className="w-5 h-5 text-[#FFB800]" />}
              >
                <div className="space-y-10">
                  <SliderField 
                    label="איפוס מצב שקט" 
                    value={quietModeTime} 
                    unit="דקות" 
                    onChange={setQuietModeTime} 
                  />
                  <div className="bg-[#0D0D0D] border border-white/5 rounded-2xl p-6 flex items-center justify-between group hover:border-[#FFB800]/20 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-[#1A1608] border border-[#FFB800]/20">
                        <Bell className="w-5 h-5 text-[#FFB800]" />
                      </div>
                      <span className="text-[#FFB800] font-bold">מעבר אוטומטי לצליל</span>
                    </div>
                    <button 
                      onClick={() => setAutoSound(!autoSound)}
                      className={`w-14 h-8 rounded-full p-1 transition-all duration-300 ${autoSound ? 'bg-[#FFB800]' : 'bg-white/10'}`}
                    >
                      <div className={`w-6 h-6 rounded-full bg-white shadow-lg transition-all duration-300 ${autoSound ? 'mr-6' : 'mr-0'}`} />
                    </button>
                  </div>
                </div>
              </DashboardCard>

              {/* Security & PIN */}
              <DashboardCard 
                title="אבטחה וקוד PIN" 
                subtitle="נדרש אימות מחדש של פרטי גישה" 
                icon={<Lock className="w-5 h-5 text-[#FFB800]" />}
              >
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-[#FFB800]/60 block">קוד PIN נוכחי</label>
                       <input 
                         type="password" 
                         value={currentPin}
                         onChange={(e) => setCurrentPin(e.target.value.slice(0, 4))}
                         className="w-full bg-[#111] border border-white/10 rounded-xl py-4 px-4 text-center tracking-[0.5em] focus:border-[#FFB800]/50 outline-none transition-all"
                         placeholder="••••"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-[#FFB800]/60 block">קוד PIN חדש</label>
                       <input 
                         type="password" 
                         value={newPin}
                         onChange={(e) => setNewPin(e.target.value.slice(0, 4))}
                         className="w-full bg-[#111] border border-white/10 rounded-xl py-4 px-4 text-center tracking-[0.5em] focus:border-[#FFB800]/50 outline-none transition-all"
                         placeholder="••••"
                       />
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row gap-4 items-stretch">
                    <div className="flex-1 bg-[#1A1608] border border-[#FFB800]/20 rounded-2xl p-4 flex items-start gap-4">
                      <ShieldCheck className="w-5 h-5 text-[#FFB800] shrink-0 mt-0.5" />
                      <p className="text-[#FFB800] text-[11px] leading-relaxed font-medium">
                        שינוי הקוד מעדכן את הגישה המקומית.
                      </p>
                    </div>
                    <button 
                      onClick={handleUpdatePin}
                      className="bg-[#FFB800] hover:bg-[#E6A600] text-black font-bold px-8 py-4 rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-[#FFB800]/10"
                    >
                      עדכן קוד גישה
                    </button>
                  </div>
                </div>
              </DashboardCard>

              {/* Urgent Call Bypass */}
              <DashboardCard 
                title="עקיפת שיחה דחופה" 
                subtitle="השמעת התראה חזקה בכל מצב אם המספר מתקשר 3 פעמים ב-2 דקות" 
                icon={<PhoneCall className="w-5 h-5 text-[#FFB800]" />}
              >
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-[#FFB800]/60 block">בחירת קובץ צליל (חירום)</label>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => playBeep(880, 0.5)}
                        className="p-3 rounded-xl bg-[#1A1608] border border-[#FFB800]/20 text-[#FFB800] hover:bg-[#FFB800]/10 transition-colors"
                      >
                        <Play className="w-4 h-4 fill-current" />
                      </button>
                      <div 
                        onClick={() => emergencyFileRef.current?.click()}
                        className="flex-1 bg-[#111] border border-white/5 rounded-xl py-3 px-4 flex items-center justify-between group cursor-pointer hover:border-[#FFB800]/30 transition-all"
                      >
                        <span className="text-white/40 text-sm truncate max-w-[200px]">{emergencySoundName}</span>
                        <Upload className="w-4 h-4 text-white/20 group-hover:text-[#FFB800]" />
                      </div>
                      <input 
                        type="file" 
                        ref={emergencyFileRef} 
                        className="hidden" 
                        accept="audio/*"
                        onChange={(e) => handleFileChange(e, 'emergency')}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-1 bg-[#111] border border-white/10 rounded-xl py-4 px-6 flex items-center">
                      <input 
                        type="text" 
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddPhoneNumber()}
                        className="bg-transparent w-full outline-none text-white placeholder:text-white/10"
                        placeholder="מספר טלפון"
                      />
                    </div>
                    <button 
                      onClick={handleAddPhoneNumber}
                      className="w-14 h-14 bg-[#FFB800] rounded-xl flex items-center justify-center text-black hover:bg-[#E6A600] transition-colors"
                    >
                      <Plus className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="bg-[#0D0D0D] border border-white/5 rounded-2xl p-6 space-y-4">
                    <p className="text-white/20 text-xs font-bold tracking-widest uppercase text-center">מספרים במעקב</p>
                    {trackedNumbers.length > 0 ? (
                      <div className="space-y-2">
                        {trackedNumbers.map((num, i) => (
                          <div key={i} className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
                            <span className="font-mono text-[#FFB800]">{num}</span>
                            <button 
                              onClick={() => handleRemovePhoneNumber(num)}
                              className="text-red-500/50 hover:text-red-500 transition-colors"
                            >
                              <Delete className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-white/10 text-sm text-center">אין מספרים במעקב</p>
                    )}
                  </div>
                </div>
              </DashboardCard>

            </div>

            {/* Bottom Navigation */}
            <footer className="flex flex-col items-center gap-12 pt-12 pb-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setScreen("login")}
                  className="bg-[#0A0A0A] border border-white/10 rounded-3xl p-8 flex items-center justify-between group cursor-pointer hover:bg-[#111] transition-all hover:border-[#FFB800]/30"
                >
                  <div className="space-y-1">
                    <h2 className="text-[#FFB800] text-xl font-bold">נעילת קונסולה</h2>
                    <p className="text-white/40 text-sm">רכוש מערכת פנימי</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl group-hover:bg-[#FFB800]/20 transition-colors">
                    <LogOut className="w-6 h-6 text-[#FFB800]" />
                  </div>
                </motion.div>

                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleInstall}
                  className="bg-[#1A1608] border border-[#FFB800]/20 rounded-3xl p-8 flex items-center justify-between group cursor-pointer hover:bg-[#221C0A] transition-all hover:border-[#FFB800]/50"
                >
                  <div className="space-y-1">
                    <h2 className="text-[#FFB800] text-xl font-bold">התקן אפליקציה</h2>
                    <p className="text-white/40 text-sm">גישה מהירה ממסך הבית</p>
                  </div>
                  <div className="bg-[#FFB800]/10 p-4 rounded-2xl group-hover:bg-[#FFB800]/20 transition-colors">
                    <Upload className="w-6 h-6 text-[#FFB800]" />
                  </div>
                </motion.div>
              </div>

              <div className="flex flex-col items-center gap-8">
                <p className="text-white/10 font-mono text-[10px] tracking-[0.4em] uppercase">SYS_OPS_TERMINAL_V4.0.4</p>
                <div className="w-16 h-16 rounded-full border border-white/10 bg-black flex items-center justify-center text-xl font-bold text-white/20">N</div>
              </div>
            </footer>

            {/* Floating Watermark */}
            <div className="fixed bottom-8 left-8 text-left opacity-10 pointer-events-none hidden lg:block">
              <h3 className="text-2xl font-bold">הפעל את Windows</h3>
              <p className="text-sm">עבור אל 'הגדרות' כדי להפעיל את Windows.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Install Instructions Modal */}
      <AnimatePresence>
        {showInstallModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowInstallModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#0A0A0A] border border-[#FFB800]/30 rounded-3xl p-8 max-w-sm w-full space-y-6 text-center shadow-[0_0_50px_rgba(255,184,0,0.1)]"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-16 h-16 rounded-2xl bg-[#1A1608] border border-[#FFB800]/20 flex items-center justify-center mx-auto">
                <Upload className="w-8 h-8 text-[#FFB800]" />
              </div>
              <div className="space-y-2">
                <h3 className="text-[#FFB800] text-xl font-bold">הוראות התקנה</h3>
                <p className="text-white/70 text-sm leading-relaxed">
                  {installInstructions}
                </p>
              </div>
              <button 
                onClick={() => setShowInstallModal(false)}
                className="w-full bg-[#FFB800] text-black font-bold py-4 rounded-2xl hover:bg-[#E6A600] transition-colors"
              >
                הבנתי, תודה
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DashboardCard({ title, subtitle, icon, children }: { title: string, subtitle: string, icon: React.ReactNode, children: React.ReactNode }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-[#0A0A0A] border border-white/10 rounded-[32px] p-8 space-y-8 hover:border-[#FFB800]/20 transition-all shadow-2xl shadow-black"
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-[#FFB800] text-2xl font-black">{title}</h2>
          <p className="text-white/40 text-xs font-medium">{subtitle}</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-[#1A1608] border border-[#FFB800]/20 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <div className="h-px bg-white/5 w-full" />
      {children}
    </motion.div>
  );
}

function SliderField({ label, value, unit, min = 0, max = 100, onChange }: { label: string, value: number, unit: string, min?: number, max?: number, onChange: (v: number) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold text-[#FFB800]/60 uppercase tracking-wider">{label}</span>
        <span className="text-[#FFB800] font-black text-lg">{value} {unit}</span>
      </div>
      <div className="relative h-10 flex items-center">
        <div className="absolute w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#FFB800] shadow-[0_0_10px_rgba(255,184,0,0.3)]" 
            style={{ width: `${((value - min) / (max - min)) * 100}%` }} 
          />
        </div>
        <input 
          type="range" 
          min={min} 
          max={max} 
          value={value} 
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="absolute w-full h-full opacity-0 cursor-pointer z-10"
        />
        <div 
          className="absolute w-6 h-6 bg-white border-4 border-[#FFB800] rounded-full shadow-lg pointer-events-none transition-all"
          style={{ right: `calc(${((value - min) / (max - min)) * 100}% - 12px)` }}
        />
      </div>
    </div>
  );
}
