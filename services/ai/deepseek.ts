import "server-only";

export type DeepSeekMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

/**
 * Requests a streamed completion from DeepSeek and returns an async
 * generator yielding content deltas as they arrive from the upstream SSE
 * response. Returns null (instead of a generator) when no API key is
 * configured, so callers can fall back before any request is made.
 */
export async function streamDeepSeekReply(
  messages: DeepSeekMessage[],
): Promise<AsyncGenerator<string> | null> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return null;
  }

  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.DEEPSEEK_MODEL ?? "deepseek-v4-flash",
      messages,
      temperature: 0.6,
      max_tokens: 800,
      stream: true,
    }),
  });

  if (!response.ok || !response.body) {
    throw new Error(`DeepSeek request failed with status ${response.status}.`);
  }

  return readDeepSeekEventStream(response.body);
}

async function* readDeepSeekEventStream(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;

      const payload = trimmed.slice(5).trim();
      if (payload === "[DONE]") return;

      try {
        const parsed = JSON.parse(payload) as {
          choices?: Array<{ delta?: { content?: string } }>;
        };
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) yield delta;
      } catch {
        // Ignore malformed keep-alive lines from the upstream stream.
      }
    }
  }
}
