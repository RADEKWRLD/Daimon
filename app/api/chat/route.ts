import { getCurrentUserFromRequest } from "@/lib/auth";
import { chatRequestSchema } from "@/services/chat/schema";
import { chatService } from "@/services/chat/service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) {
    return Response.json({ error: "Authentication is required." }, { status: 401 });
  }

  const parsed = chatRequestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid chat request.", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const result = await chatService.streamChatTurn(user.id, parsed.data);

    return streamAsSSE(result.deltas, {
      safetyLevel: result.safety.level,
      promptVersionId: result.promptVersionId ?? "",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected chat service error.";

    return Response.json({ error: message }, { status: 500 });
  }
}

function streamAsSSE(
  deltas: AsyncGenerator<string>,
  done: { safetyLevel: string; promptVersionId: string },
) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      for await (const delta of deltas) {
        controller.enqueue(encoder.encode(sseEvent(undefined, { delta })));
      }

      controller.enqueue(encoder.encode(sseEvent("done", done)));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store",
      Connection: "keep-alive",
    },
  });
}

function sseEvent(event: string | undefined, data: unknown) {
  const eventLine = event ? `event: ${event}\n` : "";
  return `${eventLine}data: ${JSON.stringify(data)}\n\n`;
}
