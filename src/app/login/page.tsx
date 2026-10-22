"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { APP_CONFIG } from "@/config/app";
import { MascotCosmino } from "@/components/MascotCosmino";
import { Lock, Mail, ArrowRight, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const supabase = createClient();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (isSignUp) {
        // Registrazione
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        if (data.session) {
          router.push("/");
          router.refresh();
        } else {
          setSuccessMessage(
            "Account creato! Se Supabase richiede conferma email, controlla la tua casella di posta."
          );
        }
      } else {
        // Accesso
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push("/");
        router.refresh();
      }
    } catch (err: any) {
      console.error("Errore autenticazione:", err);
      let itMsg = err.message || "Si è verificato un errore durante l'accesso.";
      if (itMsg.includes("Invalid login credentials")) {
        itMsg = "Email o password non corretti.";
      } else if (itMsg.includes("User already registered")) {
        itMsg = "Questo indirizzo email è già registrato. Prova ad accedere.";
      }
      setErrorMessage(itMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-100 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-sm">
        {/* Mascotte e Brand */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-white rounded-3xl shadow-soft border border-cream-200 mb-3">
            <MascotCosmino mood="happy" size={88} animate={true} />
          </div>
          <h1 className="text-2xl font-black text-plum-900 tracking-tight">
            {APP_CONFIG.name}
          </h1>
          <p className="text-xs font-bold text-cosmo-alien mt-0.5">
            {APP_CONFIG.brandClaim}
          </p>
          <p className="text-xs text-plum-600 mt-2">
            La tua agenda personale e pucciosa connessa con l&apos;IA
          </p>
        </div>

        {/* Scheda Form */}
        <div className="bg-white rounded-4xl p-6 border border-cream-300 shadow-soft">
          <h2 className="text-base font-bold text-plum-900 mb-4 flex items-center gap-1.5">
            <Sparkles size={16} className="text-cosmo-alien" />
            {isSignUp ? "Crea il tuo account" : "Accedi all'agenda"}
          </h2>

          <form onSubmit={handleAuth} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold text-plum-700 uppercase tracking-wider mb-1">
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="la-tua-email@cosmonet.it"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-sm text-plum-900 bg-cream-50 rounded-2xl pl-10 pr-3.5 py-2.5 border border-cream-200 focus:outline-none focus:ring-2 focus:ring-cosmo-alien/30 focus:border-cosmo-alien"
                />
                <Mail size={16} className="absolute left-3.5 top-3 text-plum-400" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-plum-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-sm text-plum-900 bg-cream-50 rounded-2xl pl-10 pr-3.5 py-2.5 border border-cream-200 focus:outline-none focus:ring-2 focus:ring-cosmo-alien/30 focus:border-cosmo-alien"
                />
                <Lock size={16} className="absolute left-3.5 top-3 text-plum-400" />
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-2xl bg-[#FFE5E5] text-[#D32F2F] text-xs font-medium border border-[#FFCDD2] flex items-start gap-2">
                <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 rounded-2xl bg-pastel-mint text-[#1D4E3A] text-xs font-medium border border-[#B4E4CE] flex items-start gap-2">
                <CheckCircle2 size={15} className="flex-shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-2xl bg-gradient-to-r from-cosmo-alien to-[#2563EB] hover:opacity-95 active:scale-[0.98] text-white font-bold text-sm shadow-soft transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {loading ? (
                "Caricamento in corso..."
              ) : isSignUp ? (
                <>
                  Registrati <ArrowRight size={16} />
                </>
              ) : (
                <>
                  Entra <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Toggle login / signup */}
          <div className="mt-4 pt-3 border-t border-cream-200 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className="text-xs font-semibold text-cosmo-alien hover:underline"
            >
              {isSignUp
                ? "Hai già un account? Accedi qui"
                : "Prima volta qui? Crea il tuo account"}
            </button>
          </div>
        </div>

        {/* Avviso configurazione */}
        <p className="text-[11px] text-plum-400 text-center mt-6">
          Riservato all&apos;amministratore • Protetto da Supabase RLS
        </p>
      </div>
    </div>
  );
}
