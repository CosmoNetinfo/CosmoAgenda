"use client";

import React, { useState, useEffect, useRef } from "react";
import { APP_CONFIG } from "@/config/app";
import { MascotCosmino } from "./MascotCosmino";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { offlineStorage } from "@/lib/offline-storage";
import {
  X,
  Bell,
  BellRing,
  Mic,
  Volume2,
  Database,
  CheckCircle2,
  AlertCircle,
  XCircle,
  RefreshCw,
  Send,
  Loader2,
  ShieldCheck,
  Smartphone,
  Cpu,
  Trash2,
} from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string | null;
  onRefreshData?: () => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  userEmail,
  onRefreshData,
}: SettingsModalProps) {
  const {
    isSupported: pushSupported,
    permission: pushPermission,
    isSubscribed,
    loading: pushLoading,
    subscribe,
    sendTestNotification,
  } = usePushNotifications();

  // Test Microfono
  const [micPermission, setMicPermission] = useState<string>("unknown");
  const [isTestingMic, setIsTestingMic] = useState(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Diagnostica Salute Database
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [healthLoading, setHealthLoading] = useState(false);

  // Notifica test inviata
  const [testNotificationStatus, setTestNotificationStatus] = useState<string | null>(null);

  // Controllo iniziale permessi
  useEffect(() => {
    if (!isOpen) return;

    // Check permessi microfono
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: "microphone" as PermissionName })
        .then((permissionStatus) => {
          setMicPermission(permissionStatus.state);
          permissionStatus.onchange = () => {
            setMicPermission(permissionStatus.state);
          };
        })
        .catch(() => {
          setMicPermission("unknown");
        });
    }

    // Check salute database
    checkDatabaseHealth();
  }, [isOpen]);

  // Pulizia stream microfono alla chiusura
  useEffect(() => {
    return () => {
      stopMicTest();
    };
  }, []);

  const checkDatabaseHealth = async () => {
    setHealthLoading(true);
    try {
      const res = await fetch("/api/health");
      const data = await res.json();
      setHealthStatus({ ok: res.ok, ...data });
    } catch (err: any) {
      setHealthStatus({ ok: false, error: err.message });
    } finally {
      setHealthLoading(false);
    }
  };

  const startMicTest = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      setMicPermission("granted");
      setIsTestingMic(true);

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateLevel = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        // Normalizza tra 0 e 100
        const normalized = Math.min(100, Math.round((average / 128) * 100));
        setAudioLevel(normalized);

        animationFrameRef.current = requestAnimationFrame(updateLevel);
      };

      updateLevel();
    } catch (err: any) {
      console.error("Errore accesso microfono:", err);
      setMicPermission("denied");
      alert("Impossibile accedere al microfono: " + err.message);
    }
  };

  const stopMicTest = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsTestingMic(false);
    setAudioLevel(0);
  };

  const handleTestNotification = async () => {
    setTestNotificationStatus("Invio in corso...");
    const res = await sendTestNotification();
    if (res?.success) {
      setTestNotificationStatus("✅ Banner inviato! Controlla lo schermo.");
    } else {
      setTestNotificationStatus("❌ Invio fallito. Verifica che il dispositivo sia iscritto.");
    }
    setTimeout(() => setTestNotificationStatus(null), 5000);
  };

  const handleClearCache = () => {
    if (confirm("Vuoi svuotare la cache offline locale e risincronizzare con Supabase?")) {
      offlineStorage.clearCache();
      if (onRefreshData) onRefreshData();
      alert("Cache locale ripulita! I dati sono risincronizzati.");
    }
  };

  if (!isOpen) return null;

  const hasVapidKey = !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-plum-900/50 backdrop-blur-xs animate-pop-in">
      <div className="w-full max-w-lg bg-cream-50 rounded-4xl border border-cream-300 shadow-floating p-5 sm:p-6 overflow-hidden max-h-[92vh] overflow-y-auto">
        {/* Header modale */}
        <div className="flex items-center justify-between pb-3 border-b border-cream-200">
          <div className="flex items-center gap-2">
            <MascotCosmino size={32} animate={false} />
            <div>
              <h3 className="text-base font-bold text-plum-900 leading-none">
                Pannello Impostazioni &amp; Test
              </h3>
              <p className="text-[11px] text-plum-500 mt-0.5">
                Verifica notifiche, microfono e stato dell&apos;agenda
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopMicTest();
              onClose();
            }}
            className="p-1.5 rounded-full hover:bg-cream-100 text-plum-400"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 py-3">
          {/* SEZIONE 1: NOTIFICHE PUSH */}
          <div className="bg-white rounded-3xl p-4 border border-cream-300 shadow-card space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className={`p-2 rounded-2xl ${isSubscribed ? "bg-pastel-mint text-[#1D4E3A]" : "bg-pastel-peach text-[#5C3A20]"}`}>
                  {isSubscribed ? <BellRing size={18} /> : <Bell size={18} />}
                </span>
                <div>
                  <h4 className="text-sm font-bold text-plum-900 leading-none">
                    Notifiche Push Native (Banner)
                  </h4>
                  <p className="text-[11px] text-plum-500 mt-0.5">
                    Avvisi tipo WhatsApp quando c&apos;è una cosa da fare
                  </p>
                </div>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isSubscribed
                    ? "bg-pastel-mint text-[#1D4E3A] border-[#A4D8BF]"
                    : "bg-pastel-butter text-[#554316] border-[#ECD182]"
                }`}
              >
                {isSubscribed ? "Attive ✅" : "Non attive"}
              </span>
            </div>

            {/* Griglia stato permessi */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-cream-100/70 p-2.5 rounded-2xl border border-cream-200">
                <span className="text-[10px] text-plum-500 uppercase font-bold block">Supporto Browser</span>
                <span className="font-semibold text-plum-800 flex items-center gap-1 mt-0.5">
                  {pushSupported ? (
                    <>
                      <CheckCircle2 size={13} className="text-green-600" /> Supportato
                    </>
                  ) : (
                    <>
                      <XCircle size={13} className="text-red-500" /> Non supportato
                    </>
                  )}
                </span>
              </div>

              <div className="bg-cream-100/70 p-2.5 rounded-2xl border border-cream-200">
                <span className="text-[10px] text-plum-500 uppercase font-bold block">Permesso Sistema</span>
                <span className="font-semibold text-plum-800 flex items-center gap-1 mt-0.5">
                  {pushPermission === "granted" && (
                    <>
                      <CheckCircle2 size={13} className="text-green-600" /> Concesso
                    </>
                  )}
                  {pushPermission === "denied" && (
                    <>
                      <XCircle size={13} className="text-red-500" /> Bloccato
                    </>
                  )}
                  {pushPermission === "default" && (
                    <>
                      <AlertCircle size={13} className="text-amber-500" /> Da richiedere
                    </>
                  )}
                </span>
              </div>

              <div className="bg-cream-100/70 p-2.5 rounded-2xl border border-cream-200">
                <span className="text-[10px] text-plum-500 uppercase font-bold block">Chiavi VAPID Vercel</span>
                <span className="font-semibold text-plum-800 flex items-center gap-1 mt-0.5">
                  {hasVapidKey ? (
                    <>
                      <CheckCircle2 size={13} className="text-green-600" /> Configurate
                    </>
                  ) : (
                    <>
                      <AlertCircle size={13} className="text-amber-600" /> Da aggiungere su Vercel
                    </>
                  )}
                </span>
              </div>

              <div className="bg-cream-100/70 p-2.5 rounded-2xl border border-cream-200">
                <span className="text-[10px] text-plum-500 uppercase font-bold block">Dispositivo Registrato</span>
                <span className="font-semibold text-plum-800 flex items-center gap-1 mt-0.5">
                  {isSubscribed ? (
                    <>
                      <CheckCircle2 size={13} className="text-green-600" /> Iscritto ✅
                    </>
                  ) : (
                    <>
                      <AlertCircle size={13} className="text-amber-500" /> Non iscritto
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Avviso se permessi bloccati */}
            {pushPermission === "denied" && (
              <div className="bg-pastel-pink/50 border border-pastel-pink p-2.5 rounded-2xl text-[11px] text-[#7A1D36] flex items-start gap-1.5">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>
                  Le notifiche sono state bloccate nelle impostazioni del browser. Tocca l&apos;icona del lucchetto accanto all&apos;indirizzo del sito e imposta Notifiche su &quot;Consenti&quot;.
                </span>
              </div>
            )}

            {/* Azioni Notifiche */}
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              {!isSubscribed ? (
                <button
                  type="button"
                  onClick={async () => {
                    await subscribe();
                  }}
                  disabled={pushLoading || !pushSupported}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-cosmo-alien to-[#4A72E8] text-white font-bold text-xs rounded-xl shadow-soft hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {pushLoading ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Bell size={15} />
                  )}
                  Attiva Notifiche su questo Telefono/PC
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleTestNotification}
                  disabled={pushLoading}
                  className="w-full py-2.5 px-4 bg-pastel-butter text-[#554316] hover:bg-[#FBE8A6] border border-[#ECD182] font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center justify-center gap-2"
                >
                  {pushLoading ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Send size={14} />
                  )}
                  Invia Notifica di Prova Banner 🚀
                </button>
              )}
            </div>

            {testNotificationStatus && (
              <p className="text-xs font-bold text-center text-plum-800 animate-pop-in">
                {testNotificationStatus}
              </p>
            )}
          </div>

          {/* SEZIONE 2: TEST MICROFONO */}
          <div className="bg-white rounded-3xl p-4 border border-cream-300 shadow-card space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className={`p-2 rounded-2xl ${isTestingMic ? "bg-pastel-pink text-[#7A1D36]" : "bg-pastel-sky text-cosmo-alien"}`}>
                  <Mic size={18} />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-plum-900 leading-none">
                    Microfono (Note Vocali Groq)
                  </h4>
                  <p className="text-[11px] text-plum-500 mt-0.5">
                    Trascrizione con Whisper e Llama 3.3
                  </p>
                </div>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  micPermission === "granted"
                    ? "bg-pastel-mint text-[#1D4E3A] border-[#A4D8BF]"
                    : "bg-cream-100 text-plum-600 border-cream-300"
                }`}
              >
                {micPermission === "granted" ? "Autorizzato ✅" : micPermission === "denied" ? "Bloccato ❌" : "In attesa"}
              </span>
            </div>

            {/* Visualizzatore volume audio in tempo reale durante il test */}
            {isTestingMic && (
              <div className="bg-cream-100/80 p-3 rounded-2xl border border-cream-300 space-y-1.5 animate-pop-in">
                <div className="flex items-center justify-between text-xs font-bold text-plum-800">
                  <span className="flex items-center gap-1.5">
                    <Volume2 size={14} className="text-cosmo-alien animate-bounce-gentle" />
                    Parla ora per testare la voce:
                  </span>
                  <span>{audioLevel}%</span>
                </div>
                {/* Barra volume dinamica */}
                <div className="w-full h-3.5 bg-cream-200 rounded-full overflow-hidden p-0.5 border border-cream-300">
                  <div
                    className="h-full rounded-full transition-all duration-75 bg-gradient-to-r from-pastel-mint via-pastel-butter to-pastel-pink"
                    style={{ width: `${Math.max(4, audioLevel)}%` }}
                  />
                </div>
                <p className="text-[10px] text-plum-500 text-center">
                  Se la barra colorata si muove quando parli, il microfono funziona perfettamente!
                </p>
              </div>
            )}

            <div className="flex gap-2">
              {!isTestingMic ? (
                <button
                  type="button"
                  onClick={startMicTest}
                  className="w-full py-2.5 px-4 bg-pastel-sky hover:bg-[#B8DCFC] text-cosmo-alien font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center justify-center gap-2"
                >
                  <Mic size={15} /> Avvia Test Microfono Live
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopMicTest}
                  className="w-full py-2.5 px-4 bg-pastel-pink text-[#7A1D36] hover:bg-[#FFAEC0] font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center justify-center gap-2"
                >
                  Ferma Test Microfono
                </button>
              )}
            </div>
          </div>

          {/* SEZIONE 3: DIAGNOSTICA SUPABASE & KEEP-ALIVE */}
          <div className="bg-white rounded-3xl p-4 border border-cream-300 shadow-card space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-2xl bg-pastel-lavender text-plum-900">
                  <Database size={18} />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-plum-900 leading-none">
                    Stato Database &amp; Keep-Alive
                  </h4>
                  <p className="text-[11px] text-plum-500 mt-0.5">
                    Supabase Postgres + GitHub Action anti-pausa
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={checkDatabaseHealth}
                disabled={healthLoading}
                className="p-1.5 rounded-xl hover:bg-cream-100 text-plum-500 transition-all"
                title="Ricarica stato database"
              >
                <RefreshCw size={14} className={healthLoading ? "animate-spin" : ""} />
              </button>
            </div>

            <div className="bg-cream-100/70 p-3 rounded-2xl border border-cream-200 text-xs space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-plum-600">Connessione Postgres:</span>
                <span className="font-bold flex items-center gap-1">
                  {healthLoading ? (
                    <Loader2 size={12} className="animate-spin text-plum-400" />
                  ) : healthStatus?.ok ? (
                    <span className="text-green-700 flex items-center gap-1">
                      <CheckCircle2 size={12} /> Attivo ({healthStatus.latencyMs}ms)
                    </span>
                  ) : (
                    <span className="text-red-600 flex items-center gap-1">
                      <XCircle size={12} /> Non raggiungibile
                    </span>
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-cream-200/60">
                <span className="text-plum-600">GitHub Action anti-pausa:</span>
                <span className="font-bold text-green-700">Attiva ogni giorno alle 07:00</span>
              </div>
              {userEmail && (
                <div className="flex justify-between items-center pt-1 border-t border-cream-200/60">
                  <span className="text-plum-600">Utente connesso:</span>
                  <span className="font-mono text-[11px] text-plum-800">{userEmail}</span>
                </div>
              )}
            </div>
          </div>

          {/* SEZIONE 4: CACHE OFFLINE */}
          <div className="bg-white rounded-3xl p-3.5 border border-cream-300 shadow-card flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-2xl bg-cream-100 text-plum-600">
                <Smartphone size={16} />
              </span>
              <div>
                <h4 className="text-xs font-bold text-plum-900 leading-none">
                  Memoria Offline Locale (PWA)
                </h4>
                <p className="text-[10px] text-plum-500 mt-0.5">
                  Ripulisci la cache se noti compiti non allineati
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClearCache}
              className="py-1.5 px-3 rounded-xl bg-cream-100 hover:bg-[#FFE5E5] text-plum-700 hover:text-red-600 font-bold text-[11px] transition-all border border-cream-300 hover:border-red-200 flex items-center gap-1"
            >
              <Trash2 size={12} /> Svuota
            </button>
          </div>
        </div>

        <button
          onClick={() => {
            stopMicTest();
            onClose();
          }}
          className="w-full mt-2 py-3 bg-plum-800 text-white font-bold text-xs rounded-2xl transition-all hover:bg-plum-900"
        >
          Chiudi Impostazioni
        </button>
      </div>
    </div>
  );
}
