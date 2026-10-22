# Brief Antigravity - Orbita Agent

Oct 22, 2026 · @Daniele Spalletti

## Decisioni

La web app si fa con Next.js, Supabase e Vercel, installabile sul telefono come app (PWA). Il database è Supabase e non Firebase, per tre motivi:

- Lo usi già in altri progetti, quindi la procedura è nota.
- Le richieste per data ("tutto il mese", "questa settimana") sono semplici in SQL.
- Collegare un connettore MCP a Postgres è più lineare. Il piano gratuito mette in pausa i progetti inattivi, ma un'agenda usata ogni giorno non ci arriva.

Firebase (Firestore) resta una buona alternativa se vuoi usare solo servizi Google: ha il piano gratuito senza pausa e funziona offline di serie. Per le tue esigenze la differenza è piccola, quindi scegli Supabase salvo preferenze diverse.

| Parte | Scelta |
| --- | --- |
| Interfaccia | Next.js 14 + Tailwind, in italiano, stile pucciosa con colori pastello (vedi Stile), marchio Cosmonet |
| Database e login | Supabase (un solo utente, tu) |
| Installazione sul telefono | PWA: manifest, icona, funziona anche con rete debole |
| Hosting | Vercel (piano gratuito) |
| Connettore per Claude | server MCP nella stessa app su Vercel |

## Dati

Una sola tabella, `tasks`, basta per partire.

| Campo | Tipo | Note |
| --- | --- | --- |
| id | uuid | chiave |
| title | testo | cosa fare |
| notes | testo | facoltativo |
| date | data | giorno in cui va fatta |
| time | ora | facoltativa (es. per una call) |
| kind | testo | articolo, vignetta, lo-sapevi-che, consiglio-rapido, flash-news, call, app, sito, social, altro |
| project | testo | facoltativo (es. Solfège, Cosmonet) |
| status | testo | todo, done, skipped |
| done\_at | data e ora | si compila quando spunti |
| created\_by | testo | user o claude |
| created\_at | data e ora | automatico |

Accesso: login con email e password (o link via email) solo per il tuo utente. Il server MCP usa invece la chiave di servizio, tenuta solo sul server e mai nel codice del telefono. Le regole di sicurezza (RLS) devono permettere di leggere e scrivere solo al tuo utente.

## Schermate

Semplice, curata, pensata per il telefono (una mano, pollice).

- **Barra in basso**: Oggi, Settimana, Mese.
- **Vista giorno**: elenco delle cose del giorno, ordinate per ora; spunta per segnare fatto, tocca per aprire; pulsante "+" in basso a destra per aggiungere.
- **Vista settimana**: sette colonne o righe con le attività del giorno e un indicatore di quante sono fatte.
- **Vista mese**: calendario con un puntino sui giorni che hanno attività; tocchi un giorno e vai alla vista giorno.
- **Colori per tipo** (articolo, vignetta, call...) con una piccola etichetta.
- Le attività non fatte dei giorni passati restano in evidenza ("da recuperare") con un tasto per spostarle a oggi.
- Stile pucciosa e pastello, descritto nella sezione Stile.

## Fasi

Una fase per volta, così consumi pochi token. Incolla il prompt, controlla il risultato, passa alla successiva.

**Fase 1 - Database e login**

```text
Crea un progetto Next.js 14 (App Router, TypeScript, Tailwind) chiamato orbita-agent (nome del prodotto nell'interfaccia: Orbita Agent).
Collega Supabase. Crea la tabella tasks con i campi: id (uuid), title, notes, date, time (nullable), kind, project, priority (bassa/normale/alta, default normale), repeat_rule (facoltativa), status (todo/done/skipped, default todo), done_at, created_by (default user), created_at.
Abilita RLS: solo l'utente autenticato legge e scrive le proprie righe (aggiungi user_id).
Aggiungi login con email e password. Tutto in italiano. Il codice deve essere originale: non copiare codice da altri progetti. URL e chiavi di Supabase e il nome dell'app stanno solo in variabili d'ambiente, con un file .env.example; le migrazioni SQL stanno in supabase/migrations, cosi in futuro un altro utente potra collegare il suo database. Scrivi un README breve. Non fare altro.
```

**Fase 2 - Schermate**

```text
Costruisci le schermate mobile-first: barra in basso (Oggi, Settimana, Mese), vista giorno con elenco ordinato per ora e spunta fatto/non fatto, vista settimana, vista mese con puntini sui giorni con attivita, pulsante + per aggiungere (titolo, data, ora facoltativa, tipo, progetto, note).
Stile pucciosa: colori pastello (sfondo crema #FFF8F3, rosa #FFD6E0, pesca #FFE5D0, menta #D4F1E4, lavanda #E4DAFF, celeste #D6ECFF, testo viola scuro #4A4458), angoli molto arrotondati (20-24 px), icone arrotondate, font Nunito, ombre morbide. Le attivita non fatte dei giorni passati compaiono in "Da recuperare" con un tasto "Sposta a oggi". Semplice e curato.
```

**Fase 3 - App installabile (PWA)**

```text
Rendi l'app installabile sul telefono: manifest, icone, service worker, schermata intera. Le attivita gia caricate devono restare visibili anche con rete debole. Poi fai il deploy su Vercel e dammi i passaggi per aggiungerla alla schermata Home di Android e iPhone.
```

**Fase 4 - Connettore MCP per Claude**

```text
Aggiungi nella stessa app un endpoint MCP remoto (HTTP) con questi strumenti: add_task, list_tasks (per intervallo di date e stato), get_day, update_task, complete_task, skip_task. Nessuno strumento di cancellazione.
Proteggilo con un token segreto nell'URL (/mcp/<token>, il token sta in una variabile d'ambiente), cosi funziona con Claude e con altri client come Grok. Il server usa la chiave di servizio di Supabase, che non deve mai arrivare al telefono. Dammi l'URL finale da inserire come connettore personalizzato in Claude.
```

**Dopo, a parte:** dettatura vocale nell'app, regole ricorrenti (es. "Lo sapevi che" martedì e venerdì), notifiche su Telegram, preparazione automatica delle bozze ogni mattina.

## Connettore MCP

Quando la Fase 4 è pronta, lo aggiungi a Claude come connettore personalizzato con l'URL dell'app. Poi puoi dirmi, anche da telefono:

- "Metti in agenda per domani: creare le vignette" → `add_task`
- "Cosa ho da fare questa settimana?" → `list_tasks`
- "Segna fatta la revisione dell'app X" → `complete_task`
- "Ho una call giovedì alle 15" → `add_task` con data e ora

Io posso leggere se una cosa è fatta o non fatta e segnare le attività dopo che mi dai gli articoli da dividere. Una nota: Claude gestisce bene connettori con chiave API, come quello già fatto per WordPress; se il connettore richiedesse un'altra forma di accesso, la sistemiamo in Fase 4.

## Stile

L'app deve sembrare un quaderno carino, non un gestionale. Il marchio Cosmonet resta presente ma discreto: mascotte alieno blu nella schermata iniziale, nelle pagine vuote ("niente da fare, bravo!") e nell'icona dell'app.

| Elemento | Scelta |
| --- | --- |
| Sfondo | crema #FFF8F3 |
| Colori dei tipi | rosa #FFD6E0, pesca #FFE5D0, menta #D4F1E4, lavanda #E4DAFF, celeste #D6ECFF, giallo burro #FFF3C4 |
| Testo | viola scuro #4A4458 (leggibile sui pastello) |
| Angoli | molto arrotondati, 20-24 px |
| Icone | tratto arrotondato (Lucide o Phosphor) |
| Carattere | Nunito (gratuito, Google Fonts) |
| Dettagli | ombre morbide, spunta con piccola animazione, coriandoli quando finisci tutto |

## Funzioni da avere

Le prime quattro sono la base (Fasi 1-3). Il resto si aggiunge dopo, una voce alla volta.

- [ ] Attività con titolo, data, ora, note e spunta fatto/non fatto
- [ ] Viste Oggi, Settimana, Mese
- [ ] Tipi e progetti con colore (articolo, vignetta, call, app, sito, social)
- [ ] "Da recuperare": le cose non fatte dei giorni passati, con tasto "Sposta a oggi"
- [ ] Sottoattività (mini checklist dentro un'attività)
- [ ] Priorità (bassa, normale, alta)
- [ ] Ripetizioni (es. "Lo sapevi che" ogni martedì e venerdì)
- [ ] Promemoria e notifiche (prima Telegram, poi notifiche dell'app)
- [ ] Aggiunta rapida: una riga di testo o il microfono
- [ ] Ricerca
- [ ] Segno su chi ha scritto l'attività (tu o un'AI), così vedi cosa ha inserito l'assistente
- [ ] Esportazione in calendario (formato iCal) e copia di sicurezza in JSON
- [ ] Coda di pubblicazione con stati (da preparare, pronto, pubblicato) per articoli, vignette, Lo sapevi che e Consiglio Rapido

## Fase 5 - Voce

```text
Aggiungi un pulsante microfono nella barra di aggiunta rapida. Registra l'audio dal telefono e invialo a una route del server, che lo manda alla trascrizione Whisper di Groq (modello whisper-large-v3-turbo, lingua italiana). Poi manda il testo a un modello Llama di Groq con questa istruzione: estrai titolo, data, ora, tipo e progetto e rispondi solo in JSON. Mostra l'anteprima dell'attivita e salva solo dopo che l'utente tocca Conferma. La chiave di Groq sta solo nella variabile d'ambiente del server, mai nel telefono.
```

## Connettore universale (integra la sezione Connettore MCP)

L'idea è giusta: un solo connettore MCP che qualsiasi assistente compatibile può usare. Va però detto che non tutte le AI lo supportano. Controllo di luglio 2026 su un sito di terze parti, da riverificare:

| Assistente | Connettori MCP personalizzati |
| --- | --- |
| Claude | sì (le fonti discordano se serva un piano a pagamento) |
| ChatGPT | sì, con Developer Mode, solo su web e piani a pagamento |
| Grok | sì, su web, iOS e Android |
| Perplexity | sì, su Pro e Max |
| Mistral Le Chat | sì |
| Gemini | solo da riga di comando o per aziende, non nell'app normale |
| Meta AI | no |
| Qwen, Siri | non verificato |

Per coprire anche chi non supporta MCP, il server espone la stessa cosa in due modi:

1. **MCP** con trasporto "Streamable HTTP" (il vecchio SSE è stato sostituito e alcuni client lo rifiutano).
2. **API REST con descrizione OpenAPI**, che serve a chi non ha MCP: Azioni dei GPT personalizzati, comandi di Siri e Collegamenti, script.

Accesso: token nell'URL per partire; in seguito OAuth, che Claude e ChatGPT preferiscono. Strumenti: add\_task, list\_tasks, get\_day, update\_task, complete\_task, skip\_task, e in seguito add\_note.

## Basi open source

Non ho trovato un'agenda con colori pastello, Supabase e MCP già pronta da brandizzare. Conviene costruirla da zero con Antigravity (è piccola) e usare queste come ispirazione. Controlla sempre la licenza prima di riusare codice.

| Progetto | Licenza | Stack | Utile per | Attenzione |
| --- | --- | --- | --- | --- |
| [Yuvomi](https://github.com/ulsklyc/yuvomi) | MIT | Node, SQLite, Docker, PWA | attività, calendario, ripetizioni, endpoint MCP e API OpenAPI integrati | serve un server tuo, non gira gratis su Vercel |
| [Super Productivity](https://super-productivity.com/compare/best-open-source-task-managers/) | MIT | app desktop e web | idee su ripetizioni, timer, plugin e MCP | non è pensata per un tuo database online |
| Vikunja | AGPL-3.0 | Go | attività, Kanban, API | AGPL: se la modifichi e la offri online devi pubblicare il codice, un vincolo se vuoi venderla |
| [rileybrown841/planner](https://github.com/rileybrown841/planner) | non indicata | Next.js 16, Supabase, PWA | stesso stack tuo, calendario e attività | licenza da verificare |
| [titoNeimi/weekly-planner](https://github.com/titoNeimi/weekly-planner) | non indicata | Next.js 16, Supabase | viste settimana e mese, categorie colorate | licenza da verificare |
| [chtang-hmc/Planner](https://github.com/chtang-hmc/Planner) | non indicata | Next.js 16, Supabase | ripetizioni con rrule, inserimento in linguaggio naturale | licenza da verificare |

## Nomi

Scelto: Orbita Agent. Repository e cartella: orbita-agent. Gli altri nomi restano di riserva. Sotto, l'elenco originale, tutto col marchio Cosmonet. Non ho verificato la disponibilità: prima di sceglierne uno vanno controllati App Store, Google Play, domini e marchio (UIBM/EUIPO).

- **Cosmino** (il più puccioso, richiama la mascotte)
- **CosmoPlan**
- **Cometa**
- **Orbita**
- **Astrina**
- **Lunetta**

## Regole di progetto

- **Nome**: Orbita Agent. Repository GitHub e cartella: `orbita-agent`. Il server MCP si chiama `orbita-agent`.
- **Codice nostro**: si prende spunto dalle idee e dalle funzioni dei progetti esistenti, mai dal loro codice. Così in futuro si può vendere senza vincoli di licenza.
- **Dipendenze**: usare solo librerie con licenza permissiva (MIT, Apache, BSD). Niente librerie AGPL o GPL nel codice dell'app.
- **Pensata per essere venduta**: un solo utente per installazione, tutta la configurazione in variabili d'ambiente, migrazioni SQL nel repository, README con i passi per collegare il proprio database Supabase. Il nome e i colori stanno in un unico file di configurazione, così si può cambiare marchio.
- **Marchio**: "Orbita Agent" con il segno Cosmonet (mascotte e dicitura "by Cosmonet") in un punto discreto, per esempio nella schermata Informazioni.
- **Licenza del repository**: per ora "tutti i diritti riservati" (nessuna licenza open source), da rivedere se un giorno decidi di aprire il codice.
- **Uso personale prima**: nessun pagamento, nessun multiutente, nessuna registrazione pubblica.
