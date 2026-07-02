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
    const result = await chatService.handleChatTurn(user.id, parsed.data);

    return streamText(result.reply, {
      "x-daimon-safety-level": result.safety.level,
      "x-daimon-prompt-version-id": result.promptVersionId ?? "",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected chat service error.";

    return Response.json({ error: message }, { status: 500 });
  }
}

function streamText(content: string, extraHeaders: Record<string, string>) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      for (const chunk of chunkText(content, 32)) {
        controller.enqueue(encoder.encode(chunk));
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      ...extraHeaders,
    },
  });
}

function chunkText(content: string, size: number) {
  const chunks: string[] = [];

  for (let index = 0; index < content.length; index += size) {
    chunks.push(content.slice(index, index + size));
  }

  return chunks;
}
