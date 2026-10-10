import "jsr:@supabase/functions-js/edge-runtime.d.ts";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

Deno.serve(async (req: Request) => {
  // CORS handling
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    // 1. Verificación obligatoria de autorización (Bloquea invocaciones anónimas o públicas no autorizadas)
    const authHeader = req.headers.get("Authorization");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (serviceRoleKey) {
      if (!authHeader || authHeader !== `Bearer ${serviceRoleKey}`) {
        return new Response(
          JSON.stringify({ error: "Unauthorized: Requiere autenticación de service_role" }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }
    } else if (!authHeader || !authHeader.startsWith("Bearer ") || authHeader.length < 20) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Falta token de autorización válido" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const chatId = Deno.env.get("TELEGRAM_CHAT_ID");

    if (!botToken || !chatId) {
      console.warn("TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID no configurados en Supabase Secrets.");
      return new Response(
        JSON.stringify({ error: "Telegram credentials missing in edge environment" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const payload = await req.json();
    const { ticket_number, sender_name, sender_phone, subject, message, category, image_url } = payload;

    // Sanitizar y validar URL de adjunto para prevenir inyecciones HTML en Telegram
    const cleanImageUrl =
      typeof image_url === "string" &&
      (image_url.startsWith("https://") || image_url.startsWith("http://"))
        ? image_url.trim()
        : null;

    const captionHtml = 
`🚨 <b>NUEVO TICKET DE SOPORTE #${escapeHtml(ticket_number || "S/N")}</b>
━━━━━━━━━━━━━━━━━━
👤 <b>De:</b> ${escapeHtml(sender_name || "Desconocido")}
📞 <b>Teléfono:</b> ${escapeHtml(sender_phone || "N/A")}
📂 <b>Categoría:</b> ${escapeHtml(category || "general")}
📌 <b>Asunto:</b> ${escapeHtml(subject || "Soporte")}

📝 <b>Comentario:</b>
${escapeHtml(message || "")}
${cleanImageUrl ? `\n📎 <b>Adjunto:</b>\n${escapeHtml(cleanImageUrl)}` : ""}

🌐 <i>Enviado vía Supabase Edge Function • tenddy.shop</i>`;

    if (cleanImageUrl) {
      const formData = new FormData();
      formData.append("chat_id", chatId);
      formData.append("caption", captionHtml);
      formData.append("parse_mode", "HTML");
      formData.append("photo", cleanImageUrl);

      const res = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        // Fallback a sendMessage si sendPhoto falla por la URL
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: captionHtml,
            parse_mode: "HTML",
          }),
        });
      }
    } else {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: captionHtml,
          parse_mode: "HTML",
        }),
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Error interno";
    console.error("Error en Edge Function support-notification:", errorMsg);
    return new Response(JSON.stringify({ error: errorMsg }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
