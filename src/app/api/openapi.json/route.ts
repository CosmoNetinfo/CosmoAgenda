import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;

  const openApiDoc = {
    openapi: "3.0.3",
    info: {
      title: "Orbita Agent API",
      description:
        "API REST per la gestione delle attività dell'agenda Orbita Agent (Cosmonet). Connessione per Azioni GPT, Comandi Siri e automazioni.",
      version: "1.0.0",
    },
    servers: [
      {
        url: `${origin}/api`,
        description: "Server Orbita Agent",
      },
    ],
    paths: {
      "/tasks": {
        get: {
          summary: "Elenca le attività",
          operationId: "listTasks",
          parameters: [
            {
              name: "start_date",
              in: "query",
              schema: { type: "string", format: "date" },
              description: "Data inizio (YYYY-MM-DD)",
            },
            {
              name: "end_date",
              in: "query",
              schema: { type: "string", format: "date" },
              description: "Data fine (YYYY-MM-DD)",
            },
            {
              name: "status",
              in: "query",
              schema: { type: "string", enum: ["all", "todo", "done", "skipped"] },
            },
          ],
          responses: {
            "200": {
              description: "Elenco attività",
            },
          },
        },
        post: {
          summary: "Crea una nuova attività",
          operationId: "createTask",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["title", "date"],
                  properties: {
                    title: { type: "string" },
                    date: { type: "string", format: "date" },
                    time: { type: "string" },
                    kind: { type: "string" },
                    project: { type: "string" },
                    priority: { type: "string", enum: ["bassa", "normale", "alta"] },
                    notes: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "Attività creata" },
          },
        },
      },
      "/tasks/day/{date}": {
        get: {
          summary: "Ottieni le attività del giorno specificato",
          operationId: "getDayTasks",
          parameters: [
            {
              name: "date",
              in: "path",
              required: true,
              schema: { type: "string", format: "date" },
            },
          ],
          responses: {
            "200": { description: "Attività del giorno" },
          },
        },
      },
      "/tasks/{id}/complete": {
        post: {
          summary: "Segna attività come completata",
          operationId: "completeTask",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ],
          responses: {
            "200": { description: "Attività completata" },
          },
        },
      },
      "/tasks/{id}/skip": {
        post: {
          summary: "Segna attività come saltata",
          operationId: "skipTask",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ],
          responses: {
            "200": { description: "Attività saltata" },
          },
        },
      },
    },
  };

  return NextResponse.json(openApiDoc);
}
