import "server-only";

export type DeepSeekToolCallRequest = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};

export type DeepSeekMessage =
  | { role: "system" | "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: DeepSeekToolCallRequest[] }
  | { role: "tool"; content: string; tool_call_id: string };

export type DeepSeekToolDefinition = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
};

export type DeepSeekToolCall = {
  id: string;
  name: string;
  arguments: string;
};

export type DeepSeekTurnEvent =
  | { type: "content"; delta: string }
  | { type: "done"; finishReason: string; toolCalls: DeepSeekToolCall[] };

/**
 * Requests a streamed completion (optionally with tool definitions) from
 * DeepSeek and returns an async generator of turn events. Content deltas are
 * forwarded as they arrive; tool-call fragments are accumulated internally
 * and reported once as part of the final "done" event. Returns null (instead
 * of a generator) when no API key is configured.
 */
export async function streamDeepSeekTurn(
  messages: DeepSeekMessage[],
  tools?: DeepSeekToolDefinition[],
): Promise<AsyncGenerator<DeepSeekTurnEvent> | null> {
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
      ...(tools && tools.length > 0 ? { tools } : {}),
    }),
  });

  if (!response.ok || !response.body) {
    throw new Error(`DeepSeek request failed with status ${response.status}.`);
  }

  return readDeepSeekTurnStream(response.body);
}

async function* readDeepSeekTurnStream(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<DeepSeekTurnEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finishReason = "stop";
  const toolCallAccumulator = new Map<
    number,
    { id?: string; name?: string; arguments: string }
  >();

  const finish = () => ({
    type: "done" as const,
    finishReason,
    toolCalls: [...toolCallAccumulator.values()]
      .filter((call): call is { id: string; name: string; arguments: string } =>
        Boolean(call.id && call.name),
      )
      .map((call) => ({ id: call.id, name: call.name, arguments: call.arguments })),
  });

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
      if (payload === "[DONE]") {
        yield finish();
        return;
      }

      try {
        const parsed = JSON.parse(payload) as {
          choices?: Array<{
            delta?: {
              content?: string | null;
              tool_calls?: Array<{
                index?: number;
                id?: string;
                function?: { name?: string; arguments?: string };
              }>;
            };
            finish_reason?: string | null;
          }>;
        };

        const choice = parsed.choices?.[0];
        const delta = choice?.delta;

        if (delta?.content) {
          yield { type: "content", delta: delta.content };
        }

        if (delta?.tool_calls) {
          for (const toolCallDelta of delta.tool_calls) {
            const index = toolCallDelta.index ?? 0;
            const existing = toolCallAccumulator.get(index) ?? { arguments: "" };

            if (toolCallDelta.id) existing.id = toolCallDelta.id;
            if (toolCallDelta.function?.name) {
              existing.name = toolCallDelta.function.name;
            }
            if (toolCallDelta.function?.arguments) {
              existing.arguments += toolCallDelta.function.arguments;
            }

            toolCallAccumulator.set(index, existing);
          }
        }

        if (choice?.finish_reason) {
          finishReason = choice.finish_reason;
        }
      } catch {
        // Ignore malformed keep-alive lines from the upstream stream.
      }
    }
  }

  yield finish();
}
