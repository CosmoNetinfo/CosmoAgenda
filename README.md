# 🚀 Orbita Agent (by Cosmonet)

> L'agenda spaziale, pucciosa e intelligente per le tue giornate, pensata per smartphone e guidata dall'IA.

---

## ✨ Caratteristiche

- **Stile Pucciosa e Pastello**: Sfondo crema (`#FFF8F3`), testo viola scuro (`#4A4458`), angoli morbidi (20-24px), font Nunito e mascotte alieno blu Cosmino.
- **Mobile-first**: Pensata per essere usata comodamente con il pollice su smartphone.
- **Tre Viste Principali**:
  - **Oggi**: Elenco del giorno ordinato per orario, spunta rapida, sezione "Da recuperare" per attività arretrate con tasto "Sposta a oggi", coriandoli al completamento.
  - **Settimana**: 7 colonne/righe con contatori di avanzamento e selettore rapido.
  - **Mese**: Calendario completo con puntini colorati in base al tipo di attività.
- **Tipi di Attività Colorati**: Articolo, vignetta, lo-sapevi-che, consiglio-rapido, flash-news, call, app, sito, social, altro.
- **Sotto-attività**: Mini checklist integrata dentro ogni attività.
- **Connettore MCP per Claude & Grok**: Server MCP Streamable HTTP (`/api/mcp/<token>`) con strumenti: `add_task`, `list_tasks`, `get_day`, `update_task`, `complete_task`, `skip_task`, `add_note` (nessun comando di cancellazione per sicurezza).
- **API REST & OpenAPI**: Endpoint `/api/openapi.json` pronto per Azioni GPT personalizzate e Comandi Rapidi di Siri.
- **Dettatura Vocale IA (Fase 5)**: Trascrizione con Groq Whisper (`whisper-large-v3-turbo`) ed estrazione strutturata dei campi con Llama 3.3; salvataggio solo dopo anteprima e conferma dell'utente.
- **PWA (Installabile su Telefono)**: Web App Manifest, icona a tutto schermo e cache locale per consultare le attività anche con rete debole.
- **Brand Centralizzato**: Personalizzabile al 100% dal singolo file `src/config/app.ts`.

---

## 🛠️ Stack Tecnologico

- **Framework**: Next.js 14 (App Router, React 18, TypeScript)
- **Stile**: Tailwind CSS, Lucide React, Canvas Confetti
- **Database & Auth**: Supabase (Postgres + Row Level Security)
- **IA Vocale**: Groq Whisper + Groq Llama (opzionale)
- **Connettore IA**: Model Context Protocol (MCP) Streamable HTTP + OpenAPI 3.0

---

## 📦 Installazione e Avvio Rapido

### 1. Clona il repository
```bash
git clone https://github.com/CosmoNetinfo/CosmoAgenda.git
cd CosmoAgenda
```

### 2. Installa le dipendenze
```bash
npm install
```

### 3. Configura le variabili d'ambiente
Copia il file di esempio:
```bash
cp .env.example .env.local
```

Modifica `.env.local` con i tuoi valori:
```env
NEXT_PUBLIC_SUPABASE_URL=https://tuo-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=la_tua_anon_key_di_supabase
SUPABASE_SERVICE_ROLE_KEY=la_tua_service_role_key_segreta

# Genera un token sicuro (almeno 32 caratteri casuali):
#   openssl rand -base64 32       ← su macOS/Linux/WSL
#   [System.Convert]::ToBase64String((1..32 | %{ [byte](Get-Random -Max 256) }))  ← PowerShell
MCP_AUTH_TOKEN=un-token-lungo-e-casuale-di-almeno-32-caratteri

# UUID del tuo utente Supabase: Dashboard > Authentication > Users > copia l'ID
ORBITA_USER_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

GROQ_API_KEY=la_tua_chiave_groq_opzionale
```

### 4. Applica la migrazione SQL su Supabase
Nella dashboard del tuo progetto Supabase:
1. Vai su **SQL Editor**.
2. Copia e incolla l'intero contenuto del file `supabase/migrations/20261022000000_create_tasks.sql`.
3. Clicca su **Run**.

Questo creerà la tabella `tasks`, gli indici per data e stato, i trigger di aggiornamento e le policy di sicurezza RLS.

### 5. Avvia il server di sviluppo
```bash
npm run dev
```
Apri [http://localhost:3000](http://localhost:3000) nel tuo browser.

---

## 🤖 Configurazione Connettore MCP (Claude / Grok)

Orbita Agent include un server MCP HTTP Streamable nativo.

1. Esegui il deploy dell'app su **Vercel**.
2. Inserisci le stesse variabili d'ambiente di `.env.local` nelle impostazioni di Vercel (*Settings > Environment Variables*).
3. L'URL del connettore è:
   ```text
   https://<tuo-dominio>.vercel.app/api/mcp/<MCP_AUTH_TOKEN>
   ```
4. Su **Claude** (o **Grok**):
   - Vai nelle impostazioni di integrazione / Connettori personalizzati.
   - Aggiungi un nuovo connettore HTTP con l'URL sopra riportato.

### Strumenti disponibili per Claude:
- `add_task`: Aggiunge un'attività specificando titolo, data, ora, tipo, progetto, note.
- `list_tasks`: Cerca attività per intervallo di date, stato (`todo`, `done`, `all`), progetto o tipo.
- `get_day`: Restituisce tutte le attività di una giornata specifica.
- `update_task`: Modifica titolo, orario o dettagli di un compito.
- `complete_task`: Segna un'attività come completata.
- `skip_task`: Segna un'attività come saltata.
- `add_note`: Accoda un appunto all'attività.

---

## 📱 Installazione sul Telefono (PWA)

### iPhone (iOS Safari)
1. Apri l'indirizzo dell'app su Safari.
2. Tocca l'icona **Condividi** (il quadrato con la freccia verso l'alto).
3. Scorri e seleziona **Aggiungi alla schermata Home**.
4. L'app si aprirà a schermo intero come un'applicazione nativa.

### Android (Google Chrome)
1. Apri l'indirizzo dell'app su Chrome.
2. Tocca il menu con i tre puntini in alto a destra.
3. Seleziona **Aggiungi a schermata Home** o **Installa app**.

---

## 🎨 Personalizzazione Marchio e Colori

Per cambiare nome, marchi, progetti o palette dei colori pastello, modifica semplicemente:
`src/config/app.ts`

---

## 📄 Licenza

Tutti i diritti riservati • Prodotto per uso personale e personalizzabile.
