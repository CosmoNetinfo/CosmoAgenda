"use client";

import { useState, useEffect } from "react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window
    ) {
      setIsSupported(true);
      setPermission(Notification.permission);

      navigator.serviceWorker.ready.then((registration) => {
        registration.pushManager.getSubscription().then((sub) => {
          setIsSubscribed(!!sub);
        });
      });
    }
  }, []);

  const subscribe = async () => {
    if (!isSupported) {
      alert("Il tuo browser o dispositivo non supporta le notifiche Web Push.");
      return false;
    }

    setLoading(true);
    try {
      // 1. Chiedi il permesso all'utente
      const userPermission = await Notification.requestPermission();
      setPermission(userPermission);

      if (userPermission !== "granted") {
        alert("Permesso notifiche non concesso. Puoi abilitarlo dalle impostazioni del browser.");
        setLoading(false);
        return false;
      }

      // 2. Registra o ottieni il service worker
      const registration = await navigator.serviceWorker.ready;

      // 3. Iscrivi il client usando la chiave VAPID pubblica
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        throw new Error("Chiave VAPID pubblica mancante");
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      // 4. Invia la sottoscrizione al server
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription }),
      });

      if (!res.ok) {
        throw new Error("Impossibile salvare la sottoscrizione sul server");
      }

      setIsSubscribed(true);
      return true;
    } catch (err: any) {
      console.error("Errore attivazione notifiche:", err);
      alert(`Errore nell'attivazione delle notifiche: ${err.message}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const sendTestNotification = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/push/test", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Errore invio prova");
      return data;
    } catch (err: any) {
      alert(`Errore test notifica: ${err.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    isSupported,
    permission,
    isSubscribed,
    loading,
    subscribe,
    sendTestNotification,
  };
}
