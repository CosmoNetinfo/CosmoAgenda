import { NextRequest, NextResponse } from "next/server";
import { sendPushToUser } from "@/lib/push";

export async function POST(request: NextRequest) {
  try {
    const userId = process.env.ORBITA_USER_ID;
    if (!userId) {
      return NextResponse.json(
        { error: "ORBITA_USER_ID non configurata" },
        { status: 500 }
      );
    }

    const result = await sendPushToUser(userId, {
      title: "👾 Orbita Agent",
      body: "C'è da fare una cosa! 🚀 Le notifiche funzionano alla perfezione.",
      url: "/",
    });

    return NextResponse.json({
      success: true,
      message: `Inviata notifica a ${result.sent} dispositivo/i.`,
      result,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
