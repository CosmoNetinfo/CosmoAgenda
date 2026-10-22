import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createAdminClient();
    const startTime = Date.now();

    // Query per mantenere attivo il database Postgres di Supabase (anti-pausa)
    const { data, error } = await supabase
      .from("tasks")
      .select("id")
      .limit(1);

    const latency = Date.now() - startTime;

    if (error) {
      return NextResponse.json(
        {
          status: "error",
          database: "error",
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: "ok",
      server: "Orbita Agent",
      database: "connected",
      latencyMs: latency,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: "error", message: err.message },
      { status: 500 }
    );
  }
}
