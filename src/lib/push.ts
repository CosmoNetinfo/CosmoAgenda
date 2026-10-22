import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

// Configura i dettagli VAPID per le notifiche Web Push
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:info@cosmonet.info";

if (vapidPublicKey && vapidPrivateKey) {
  try {
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
  } catch (err) {
    console.error("Errore configurazione VAPID:", err);
  }
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  icon?: string;
  badge?: string;
}

/**
 * Invia una notifica push a tutti i dispositivi registrati per un determinato utente
 */
export async function sendPushToUser(
  userId: string,
  payload: PushNotificationPayload
): Promise<{ sent: number; failed: number }> {
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn("Notifiche push disabilitate: chiavi VAPID mancanti nelle variabili d'ambiente.");
    return { sent: 0, failed: 0 };
  }

  const supabase = createAdminClient();

  const { data: subscriptions, error } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (error || !subscriptions || subscriptions.length === 0) {
    return { sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;
  const expiredIds: string[] = [];

  const jsonPayload = JSON.stringify({
    title: payload.title || "👾 Orbita Agent",
    body: payload.body || "C'è da fare una cosa!",
    url: payload.url || "/",
    tag: payload.tag || `orbita-task-${Date.now()}`,
    icon: payload.icon || "/icon.svg",
    badge: payload.badge || "/icon.svg",
  });

  for (const sub of subscriptions) {
    const pushSubscription = {
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth,
      },
    };

    try {
      await webpush.sendNotification(pushSubscription, jsonPayload);
      sent++;
    } catch (err: any) {
      failed++;
      console.error("Errore invio push al dispositivo:", err.statusCode || err.message);
      // Se il token è scaduto o non più valido (404 o 410 Gone), rimuovi la sottoscrizione
      if (err.statusCode === 404 || err.statusCode === 410) {
        expiredIds.push(sub.id);
      }
    }
  }

  if (expiredIds.length > 0) {
    await supabase.from("push_subscriptions").delete().in("id", expiredIds);
  }

  return { sent, failed };
}
