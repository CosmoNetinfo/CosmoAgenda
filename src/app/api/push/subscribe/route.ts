import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscription } = body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { error: "Dati di sottoscrizione non validi" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const userId = process.env.ORBITA_USER_ID;

    if (!userId) {
      return NextResponse.json(
        { error: "ORBITA_USER_ID non configurata sul server" },
        { status: 500 }
      );
    }

    const { endpoint, keys } = subscription;
    const userAgent = request.headers.get("user-agent") || null;

    // Upsert nella tabella delle sottoscrizioni
    const { data, error } = await supabase
      .from("push_subscriptions")
      .upsert(
        {
          user_id: userId,
          endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
          user_agent: userAgent,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "endpoint" }
      )
      .select()
      .single();

    if (error) {
      console.error("Errore salvataggio sottoscrizione push:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, subscription: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Errore interno" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json({ error: "Endpoint mancante" }, { status: 400 });
    }

    const supabase = createAdminClient();
    await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
