import OpenAI from "openai";

export interface ConversationExtractionInput {
  conversationId: string;
  customerId: string;
  title: string;
  transcript: string;
}

export interface ExtractedSignalDraft {
  type: "pain_point" | "objection" | "feature_request" | "next_step" | "soft_blocker";
  title: string;
  summary: string;
  confidence: number;
}

export interface ConversationExtractionResult {
  summary: string;
  signals: ExtractedSignalDraft[];
}

const EXTRACTION_SCHEMA = {
  name: "conversation_extraction",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      summary: { type: "string" },
      signals: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            type: {
              type: "string",
              enum: ["pain_point", "objection", "feature_request", "next_step", "soft_blocker"],
            },
            title: { type: "string" },
            summary: { type: "string" },
            confidence: { type: "number" },
          },
          required: ["type", "title", "summary", "confidence"],
        },
      },
    },
    required: ["summary", "signals"],
  },
} as const;

let cachedClient: OpenAI | undefined;

export function createOpenAiClient(apiKey: string): OpenAI {
  if (!cachedClient || cachedClient.apiKey !== apiKey) {
    cachedClient = new OpenAI({ apiKey });
  }

  return cachedClient;
}

export async function extractConversationArtifacts(
  apiKey: string,
  model: string,
  input: ConversationExtractionInput,
): Promise<ConversationExtractionResult> {
  const client = createOpenAiClient(apiKey);
  const response = await client.responses.create({
    model,
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text: [
              "You extract structured product-operations insights from transcripts.",
              "Return concise, evidence-grounded output only.",
              "Do not invent customer links or execution state.",
              "Only emit soft_blocker when the transcript clearly implies execution or delivery risk.",
            ].join(" "),
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: JSON.stringify(input),
          },
        ],
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: EXTRACTION_SCHEMA.name,
        strict: true,
        schema: EXTRACTION_SCHEMA.schema,
      },
    },
  });

  const content = response.output_text;
  if (!content) {
    return {
      summary: "",
      signals: [],
    };
  }

  const parsed = JSON.parse(content) as ConversationExtractionResult;
  return {
    summary: parsed.summary,
    signals: parsed.signals.filter((signal) => signal.confidence >= 0.7),
  };
}
