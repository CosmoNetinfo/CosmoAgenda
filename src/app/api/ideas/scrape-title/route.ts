import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return NextResponse.json({ error: "Parametro 'url' richiesto" }, { status: 400 });
  }

  let domain = "";
  try {
    const parsed = new URL(targetUrl);
    domain = parsed.hostname.replace(/^www\./, "");
  } catch {
    return NextResponse.json({ title: targetUrl, domain: targetUrl });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; OrbitaAgent/1.0; +https://github.com/CosmoNetinfo/CosmoAgenda)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return NextResponse.json({ title: domain, domain });
    }

    const html = await response.text();

    // Cerca og:title prima, poi tag <title>
    const ogMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
                    html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i);

    let title = ogMatch ? ogMatch[1] : null;

    if (!title) {
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch) title = titleMatch[1];
    }

    if (title) {
      // Pulizia e decodifica base entità HTML
      title = title
        .trim()
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&#39;/g, "'");
      return NextResponse.json({ title, domain });
    }

    return NextResponse.json({ title: domain, domain });
  } catch {
    return NextResponse.json({ title: domain, domain });
  }
}
