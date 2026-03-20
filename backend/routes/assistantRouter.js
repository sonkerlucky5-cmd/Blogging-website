import express from "express";

const router = express.Router();

const OPENAI_API_URL = "https://api.openai.com/v1/responses";
const GROQ_API_URL = "https://api.groq.com/openai/v1/responses";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const CATEGORY_OPTIONS = [
  "Strategy",
  "Engineering",
  "Operations",
  "Growth",
  "Systems",
  "Leadership",
  "Design",
  "Product",
  "Editorial",
];
const LOCAL_FALLBACK_MODEL = "local-editorial-fallback";
const DEFAULT_CHAT_MAX_OUTPUT_TOKENS = 900;
const DEFAULT_READY_BLOG_MAX_OUTPUT_TOKENS = 2200;
const LOCAL_NOTICE =
  "Using local writing helper mode. Add GROQ_API_KEY, GEMINI_API_KEY, or OPENAI_API_KEY to backend/.env and restart the backend for full AI responses.";
const GENERIC_TOPIC_PHRASES = new Set([
  "that topic",
  "this topic",
  "my topic",
  "the topic",
  "my idea",
  "this idea",
  "that idea",
  "it",
  "blog",
  "article",
  "post",
]);
const SHORT_TERM_TOPIC_MAP = {
  ai: "AI",
  api: "API",
  seo: "SEO",
  ux: "UX",
  ui: "UI",
  saas: "SaaS",
  b2b: "B2B",
  cms: "CMS",
  crm: "CRM",
};
const SYSTEM_PROMPT = `
You are an intelligent AI assistant designed to solve real-world problems.

Your goal is to help users with practical solutions related to technology, programming, productivity, business ideas, and everyday problems.

Follow these rules:
1. Understand the user's problem clearly before answering.
2. Provide step-by-step solutions when possible.
3. Keep explanations simple and practical.
4. Suggest tools, technologies, or methods that can help solve the problem.
5. If the problem is technical, include examples or code when useful.
6. Focus on actionable advice rather than theory.
7. Be concise, clear, and helpful.

Always aim to provide solutions that are realistic and useful in real-world situations.
`.trim();
const DRAFT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: {
      type: "string",
      description: "Publication-ready article title",
    },
    category: {
      type: "string",
      enum: CATEGORY_OPTIONS,
    },
    summary: {
      type: "string",
      description: "Single-sentence summary of the article",
    },
    content: {
      type: "string",
      description: "Full blog draft as plain text",
    },
  },
  required: ["title", "category", "summary", "content"],
};
const STOP_WORDS = new Set([
  "about",
  "after",
  "also",
  "been",
  "blog",
  "build",
  "could",
  "create",
  "draft",
  "from",
  "full",
  "give",
  "have",
  "idea",
  "ideas",
  "into",
  "need",
  "plan",
  "post",
  "professional",
  "prompt",
  "publish",
  "ready",
  "should",
  "step",
  "steps",
  "that",
  "their",
  "there",
  "these",
  "they",
  "this",
  "through",
  "with",
  "would",
  "write",
  "your",
]);
const CATEGORY_KEYWORDS = {
  Strategy: ["strategy", "positioning", "market", "planning"],
  Engineering: ["engineering", "developer", "code", "api", "backend", "frontend"],
  Operations: ["operations", "workflow", "process", "execution", "team ops"],
  Growth: ["growth", "marketing", "acquisition", "seo", "audience"],
  Systems: ["systems", "infrastructure", "stack", "architecture", "platform"],
  Leadership: ["leadership", "manager", "culture", "hiring", "decision"],
  Design: ["design", "brand", "visual", "ux", "ui"],
  Product: ["product", "roadmap", "feature", "discovery", "launch"],
  Editorial: ["editorial", "writing", "storytelling", "content", "publishing"],
};
const CATEGORY_COVER_IMAGES = {
  Strategy:
    "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1400&q=80",
  Engineering:
    "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1400&q=80",
  Operations:
    "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1400&q=80",
  Growth:
    "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1400&q=80",
  Systems:
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80",
  Leadership:
    "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1400&q=80",
  Design:
    "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=80",
  Product:
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80",
  Editorial:
    "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1400&q=80",
};

function createHttpError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function stripCodeFences(value) {
  return value.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
}

function getOpenAiModel() {
  return process.env.OPENAI_MODEL?.trim() || "gpt-5-mini";
}

function getGroqModel() {
  return process.env.GROQ_MODEL?.trim() || "openai/gpt-oss-20b";
}

function getPreferredProvider() {
  const configuredProvider = process.env.AI_PROVIDER?.trim().toLowerCase();

  if (["groq", "google", "openai", "auto"].includes(configuredProvider)) {
    return configuredProvider;
  }

  return "auto";
}

function getAssistantRuntime(provider, noticeOverride = "") {
  return {
    model:
      provider === "groq"
        ? getGroqModel()
        : provider === "openai"
        ? getOpenAiModel()
        : provider === "google"
          ? getGeminiModel()
          : LOCAL_FALLBACK_MODEL,
    provider,
    notice: provider === "local" ? noticeOverride || LOCAL_NOTICE : "",
  };
}

function getGeminiModel() {
  return (
    process.env.GEMINI_MODEL?.trim() ||
    process.env.GOOGLE_AI_MODEL?.trim() ||
    "gemini-2.5-flash"
  );
}

function getOpenAiResponseText(payload) {
  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  if (!Array.isArray(payload.output)) {
    return "";
  }

  return payload.output
    .flatMap((item) => item.content || [])
    .filter((item) => item.type === "output_text" && item.text)
    .map((item) => item.text)
    .join("\n")
    .trim();
}

function getGeminiApiKey() {
  return (
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_AI_API_KEY?.trim() ||
    process.env.GOOGLE_API_KEY?.trim() ||
    ""
  );
}

function getGroqApiKey() {
  return process.env.GROQ_API_KEY?.trim() || "";
}

function getGeminiResponseText(payload) {
  if (!Array.isArray(payload.candidates)) {
    return "";
  }

  return payload.candidates
    .flatMap((candidate) => candidate.content?.parts || [])
    .filter((part) => typeof part.text === "string" && part.text.trim())
    .map((part) => part.text.trim())
    .join("\n")
    .trim();
}

async function requestOpenAiAssistant({
  instructions,
  input,
  textFormat,
  maxOutputTokens,
}) {
  if (!process.env.OPENAI_API_KEY) {
    throw createHttpError(
      "Missing OPENAI_API_KEY in backend environment variables",
      503
    );
  }

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: getOpenAiModel(),
      instructions,
      input,
      ...(Number.isInteger(maxOutputTokens) && maxOutputTokens > 0
        ? {
            max_output_tokens: maxOutputTokens,
          }
        : {}),
      ...(textFormat
        ? {
            text: {
              format: textFormat,
            },
          }
        : {}),
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw createHttpError(
      payload.error?.message || "OpenAI request failed",
      response.status
    );
  }

  const text = getOpenAiResponseText(payload);

  if (!text) {
    throw createHttpError("Assistant returned an empty response", 502);
  }

  return {
    provider: "openai",
    text,
  };
}

async function requestGroqAssistant({
  instructions,
  input,
  textFormat,
  maxOutputTokens,
}) {
  const apiKey = getGroqApiKey();

  if (!apiKey) {
    throw createHttpError(
      "Missing GROQ_API_KEY in backend environment variables",
      503
    );
  }

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: getGroqModel(),
      instructions,
      input,
      ...(Number.isInteger(maxOutputTokens) && maxOutputTokens > 0
        ? {
            max_output_tokens: maxOutputTokens,
          }
        : {}),
      ...(textFormat
        ? {
            text: {
              format: textFormat,
            },
          }
        : {}),
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw createHttpError(
      payload.error?.message || "Groq request failed",
      response.status
    );
  }

  const text = getOpenAiResponseText(payload);

  if (!text) {
    throw createHttpError("Assistant returned an empty response", 502);
  }

  return {
    provider: "groq",
    text,
  };
}

async function requestGeminiAssistant({
  instructions,
  input,
  textFormat,
  maxOutputTokens,
}) {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    throw createHttpError(
      "Missing GEMINI_API_KEY in backend environment variables",
      503
    );
  }

  const generationConfig = {
    candidateCount: 1,
  };

  if (Number.isInteger(maxOutputTokens) && maxOutputTokens > 0) {
    generationConfig.maxOutputTokens = maxOutputTokens;
  }

  if (textFormat?.schema) {
    generationConfig.responseMimeType = "application/json";
    generationConfig.responseJsonSchema = textFormat.schema;
  }

  const response = await fetch(
    `${GEMINI_API_URL}/${getGeminiModel()}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [
            {
              text: instructions,
            },
          ],
        },
        contents: [
          {
            role: "user",
            parts: [
              {
                text: input,
              },
            ],
          },
        ],
        generationConfig,
      }),
    }
  );

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw createHttpError(
      payload.error?.message || "Gemini request failed",
      response.status
    );
  }

  const text = getGeminiResponseText(payload);

  if (!text) {
    throw createHttpError("Assistant returned an empty response", 502);
  }

  return {
    provider: "google",
    text,
  };
}

async function requestAssistant({
  instructions,
  input,
  textFormat,
  maxOutputTokens,
}) {
  const preferredProvider = getPreferredProvider();

  if (preferredProvider === "groq") {
    return requestGroqAssistant({
      instructions,
      input,
      textFormat,
      maxOutputTokens,
    });
  }

  if (preferredProvider === "google") {
    return requestGeminiAssistant({
      instructions,
      input,
      textFormat,
      maxOutputTokens,
    });
  }

  if (preferredProvider === "openai") {
    return requestOpenAiAssistant({
      instructions,
      input,
      textFormat,
      maxOutputTokens,
    });
  }

  if (getGroqApiKey()) {
    return requestGroqAssistant({
      instructions,
      input,
      textFormat,
      maxOutputTokens,
    });
  }

  if (getGeminiApiKey()) {
    return requestGeminiAssistant({
      instructions,
      input,
      textFormat,
      maxOutputTokens,
    });
  }

  if (process.env.OPENAI_API_KEY?.trim()) {
    return requestOpenAiAssistant({
      instructions,
      input,
      textFormat,
      maxOutputTokens,
    });
  }

  throw createHttpError(
    "Missing GROQ_API_KEY, GEMINI_API_KEY, or OPENAI_API_KEY in backend environment variables",
    503
  );
}

function tokenize(text) {
  return (text.toLowerCase().match(/[a-z0-9]+/g) || []).filter(
    (word) => word.length > 2 && !STOP_WORDS.has(word)
  );
}

function toTitleCase(value) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      const normalizedWord = word.toLowerCase();

      if (SHORT_TERM_TOPIC_MAP[normalizedWord]) {
        return SHORT_TERM_TOPIC_MAP[normalizedWord];
      }

      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

function pickTopic(...sources) {
  const counts = new Map();

  sources
    .filter(Boolean)
    .flatMap((source) => tokenize(source))
    .forEach((word) => {
      counts.set(word, (counts.get(word) || 0) + 1);
    });

  const topWords = [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([word]) => word);

  return topWords.length ? toTitleCase(topWords.join(" ")) : "Modern Content Teams";
}

function inferCategory(text, fallback = "Editorial") {
  const normalizedText = text.toLowerCase();

  const matchedCategory = Object.entries(CATEGORY_KEYWORDS).find(([, keywords]) =>
    keywords.some((keyword) => normalizedText.includes(keyword))
  );

  return matchedCategory?.[0] || fallback;
}

function getTopicDescription(topic) {
  if (topic === "Modern Content Teams") {
    return "modern content teams";
  }

  const firstWord = topic.split(/\s+/)[0]?.toLowerCase();

  if (SHORT_TERM_TOPIC_MAP[firstWord]) {
    return topic;
  }

  return topic.charAt(0).toLowerCase() + topic.slice(1);
}

function normalizeForMatch(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function cleanExtractedTopic(value) {
  return value
    .replace(/["'`]/g, " ")
    .replace(/\b(?:in|with)\s+a\s+[^.?!]+tone\b.*$/i, " ")
    .replace(
      /\bfor\s+(?:founders?|developers?|marketers?|leaders?|writers?|creators?|students?|teams?|business owners?|startup teams?|small businesses?)\b.*$/i,
      " "
    )
    .replace(
      /\b(?:a|an|the|professional|ready(?:-to-publish)?|full|complete|better|stronger|blog|article|post|draft|outline|summary|meta|intro|opening|headline|title|for me)\b/gi,
      " "
    )
    .replace(/\s+/g, " ")
    .replace(/^[\s,:-]+|[\s,:-]+$/g, "")
    .trim();
}

function isUsefulTopic(value) {
  const normalized = normalizeForMatch(value);

  if (!normalized) {
    return false;
  }

  if (GENERIC_TOPIC_PHRASES.has(normalized)) {
    return false;
  }

  if (SHORT_TERM_TOPIC_MAP[normalized]) {
    return true;
  }

  return normalized.length >= 5 || normalized.includes(" ");
}

function extractTopicFromMessage(message, history = [], context = {}) {
  const candidates = [
    message,
    ...history
      .slice(-6)
      .reverse()
      .map((entry) => (typeof entry.content === "string" ? entry.content : "")),
    context?.topic,
    context?.page,
  ].filter(Boolean);

  for (const candidate of candidates) {
    const normalizedCandidate = candidate.replace(/\s+/g, " ").trim();

    if (!normalizedCandidate) {
      continue;
    }

    const quotedMatch =
      normalizedCandidate.match(/"(.+?)"/) ||
      normalizedCandidate.match(/['`](.+?)['`]/);

    if (quotedMatch) {
      const cleanedQuotedTopic = cleanExtractedTopic(quotedMatch[1]);

      if (isUsefulTopic(cleanedQuotedTopic)) {
        return toTitleCase(cleanedQuotedTopic);
      }
    }

    const patternMatches = [
      normalizedCandidate.match(/\b(?:about|on|regarding)\b\s+(.+?)(?:[.?!]|$)/i),
      normalizedCandidate.match(/\bfor\b\s+(.+?)(?:[.?!]|$)/i),
      normalizedCandidate.match(
        /\b(?:write|draft|create|generate|make)\b.+?\b(?:about|on|for)\b\s+(.+?)(?:[.?!]|$)/i
      ),
    ];

    for (const match of patternMatches) {
      const cleanedTopic = cleanExtractedTopic(match?.[1] || "");

      if (isUsefulTopic(cleanedTopic)) {
        return toTitleCase(cleanedTopic);
      }
    }
  }

  return pickTopic(...candidates);
}

function hasRepeatedPrompt(message, history = []) {
  const normalizedMessage = normalizeForMatch(message);

  if (!normalizedMessage) {
    return false;
  }

  return history
    .filter((entry) => entry.role !== "assistant" && typeof entry.content === "string")
    .slice(-3)
    .some((entry) => normalizeForMatch(entry.content) === normalizedMessage);
}

function getLastMeaningfulUserPrompt(history = []) {
  return [...history]
    .reverse()
    .find(
      (entry) => entry.role !== "assistant" && typeof entry.content === "string" && entry.content.trim()
    )?.content;
}

function wantsReadyBlog(message) {
  const lowerMessage = message.toLowerCase();

  return (
    /(ready blog|full blog|complete blog|publish-ready blog|ready article|full article|complete article)/.test(
      lowerMessage
    ) ||
    (/(write|create|draft|generate|make)/.test(lowerMessage) &&
      /(blog|article|post)/.test(lowerMessage) &&
      /(ready|full|complete|publish-ready)/.test(lowerMessage))
  );
}

function isFormattingRequest(lowerMessage) {
  return /(title|headline|name|outline|structure|framework|intro|opening|lead|summary|excerpt|meta)/.test(
    lowerMessage
  );
}

function isTechnicalRequest(lowerMessage) {
  return /(code|bug|fix|error|backend|frontend|server|api|database|mongodb|react|node|auth|login|deploy)/.test(
    lowerMessage
  );
}

function shouldAutoCreateBlog(message, history = [], context = {}) {
  const lowerMessage = message.toLowerCase();

  if (wantsReadyBlog(message)) {
    return true;
  }

  if (isFormattingRequest(lowerMessage) || isTechnicalRequest(lowerMessage)) {
    return false;
  }

  const normalizedMessage = normalizeForMatch(message);
  const messageTokens = normalizedMessage ? normalizedMessage.split(/\s+/) : [];
  const topic = extractTopicFromMessage(message, history, context);
  const hasBlogSignal =
    /(blog|article|post|write|draft|create|story|content|idea|founder|marketing|productivity|business|brand|strategy|startup|seo|ai|growth|workflow|team|product)/.test(
      lowerMessage
    ) || messageTokens.length >= 4;

  return hasBlogSignal && isUsefulTopic(topic) && messageTokens.length >= 2;
}

function formatDraftAsChatReply(draft) {
  return [
    "Ready blog prepared.",
    "",
    `Title: ${draft.title}`,
    `Category: ${draft.category}`,
    `Summary: ${draft.summary}`,
    "",
    "Article:",
    draft.content,
  ].join("\n");
}

function buildBlogDirectionReply(topic, message, repeatedPrompt) {
  const topicDescription = getTopicDescription(topic);
  const opener = repeatedPrompt
    ? `You asked for another pass, so here is a sharper version for ${topicDescription}.`
    : `Here is a more complete blog direction for ${topicDescription}.`;

  return [
    opener,
    "",
    `Working title: ${topic}: A Practical Guide to Better Decisions and Stronger Execution`,
    "",
    "Best angle:",
    `Focus on one real problem, show why the usual approach underperforms, and then give the reader a process they can apply immediately.`,
    "",
    "Suggested structure:",
    "1. Start with the problem and why it matters now.",
    "2. Show the common mistake teams make.",
    "3. Break the better approach into three practical moves.",
    "4. Add one concrete example, tool, or workflow.",
    "5. Close with the next action the reader should take.",
    "",
    "Opening paragraph:",
    `${topic} becomes useful when it moves from vague advice to a repeatable system. The strongest teams use it to make better decisions, improve output quality, and remove friction from everyday execution instead of treating it like another trend.`,
    "",
    `Next prompts you can send: "Write the full blog on ${topicDescription}", "Give me 5 SEO titles", or "Turn this into a LinkedIn post".`,
  ].join("\n");
}

function buildTitleReply(topic) {
  return [
    `Here are five stronger title options for ${getTopicDescription(topic)}:`,
    `1. ${topic}: A Practical Playbook for Teams That Need Clearer Output`,
    `2. What Strong ${topic} Looks Like in a Real Workflow`,
    `3. From Confusion to Clarity: A Better System for ${topic}`,
    `4. How Smart Teams Use ${topic} Without Adding More Noise`,
    `5. ${topic} Done Well: A Guide to Better Execution`,
  ].join("\n");
}

function buildOutlineReply(topic) {
  return [
    `Use this outline for a professional piece on ${getTopicDescription(topic)}:`,
    "1. Problem: what is broken or inefficient today.",
    "2. Why it happens: the pattern most teams miss.",
    "3. Core shift: the better operating principle.",
    "4. Practical steps: three actions readers can apply.",
    "5. Example: a realistic workflow, team, or use case.",
    "6. Conclusion: one clear next move for the reader.",
  ].join("\n");
}

function buildIntroReply(topic) {
  return [
    `Try this opening for ${getTopicDescription(topic)}:`,
    "",
    `${topic} only becomes valuable when it changes how a team works in practice. The strongest teams do not use it for surface-level output. They use it to improve clarity, reduce wasted effort, and make decisions faster without lowering quality.`,
  ].join("\n");
}

function buildSummaryReply(topic) {
  return [
    `Summary: ${topic} works best when it is treated as a practical system for better clarity, faster execution, and more reliable output.`,
    `Meta description: Learn how ${getTopicDescription(
      topic
    )} can help teams improve workflows, decisions, and publishing quality with a practical step-by-step approach.`,
  ].join("\n");
}

function buildTechnicalReply(message) {
  return [
    "Here is a practical way to handle this technical problem:",
    "1. Identify the exact failing point: UI, API, database, or auth.",
    "2. Check the error output, browser network tab, and backend log together.",
    "3. Fix the smallest confirmed issue first, then retest the full flow.",
    "",
    "Useful tools:",
    "- Browser DevTools",
    "- Postman or Thunder Client",
    "- Server logs and MongoDB query checks",
    "",
    `If you paste the exact error or code for "${message.trim()}", I can help debug it step by step.`,
  ].join("\n");
}

function buildGeneralReply(topic) {
  return [
    `Here is a more useful answer for ${getTopicDescription(topic)}:`,
    "1. Define the exact outcome you want.",
    "2. Choose one method or workflow that directly supports that outcome.",
    "3. Apply it in a small repeatable way before expanding it.",
    "",
    "If you want a more specific answer, send your topic, audience, and goal. I can turn that into a blog, outline, titles, or an action plan.",
  ].join("\n");
}

function pickCoverImage(category) {
  return CATEGORY_COVER_IMAGES[category] || CATEGORY_COVER_IMAGES.Editorial;
}

function buildLocalChatReply({ message, context, history }) {
  const lowerMessage = message.toLowerCase();
  const topic = extractTopicFromMessage(message, history, context);
  const repeatedPrompt = hasRepeatedPrompt(message, history);
  const lastUserPrompt = getLastMeaningfulUserPrompt(history);
  const combinedBrief = [lastUserPrompt, message].filter(Boolean).join("\n\n");

  if (shouldAutoCreateBlog(message, history, context)) {
    if (!isUsefulTopic(topic) && !isUsefulTopic(lastUserPrompt || "")) {
      return [
        "I can prepare a ready blog, but I need the topic first.",
        "",
        "Send it like this:",
        "Topic: ...",
        "Audience: ...",
        "Tone: ...",
        "Goal: ...",
        "",
        'Example: "Write a ready blog about AI tools for small business productivity for founders in a clear professional tone."',
      ].join("\n");
    }

    return formatDraftAsChatReply(
      buildLocalDraft({
        mode: "ready",
        brief: combinedBrief || message,
        title: "",
        category: inferCategory(combinedBrief || message, "Editorial"),
        content: "",
      })
    );
  }

  if (/(create|write|draft|blog|article|post)/.test(lowerMessage)) {
    if (!isUsefulTopic(topic) && !isUsefulTopic(lastUserPrompt || "")) {
      return [
        "I can create that, but I need the actual topic first.",
        "",
        "Send it in this format:",
        "Topic: ...",
        "Audience: ...",
        "Tone: ...",
        "Goal: ...",
        "",
        'Example: "Write a blog about AI tools for small business productivity, for founders, in a clear professional tone."',
      ].join("\n");
    }

    return buildBlogDirectionReply(topic, message, repeatedPrompt);
  }

  if (/(title|headline|name)/.test(lowerMessage)) {
    return buildTitleReply(topic);
  }

  if (/(outline|structure|framework)/.test(lowerMessage)) {
    return buildOutlineReply(topic);
  }

  if (/(intro|opening|lead)/.test(lowerMessage)) {
    return buildIntroReply(topic);
  }

  if (/(summary|excerpt|meta)/.test(lowerMessage)) {
    return buildSummaryReply(topic);
  }

  if (isTechnicalRequest(lowerMessage)) {
    return buildTechnicalReply(message);
  }

  return buildGeneralReply(topic);
}

function createParagraphs(topic, mode, brief, content) {
  const topicDescription = getTopicDescription(topic);
  const existingAngle = content.trim()
    ? `The current draft already points toward ${topicDescription}, but it needs stronger sequencing and clearer editorial weight.`
    : `Most teams talk about ${topicDescription} in abstract language, which makes the article harder to trust and harder to remember.`;

  const secondParagraph =
    mode === "improve"
      ? "A better version starts by naming the operating problem directly: where work slows down, where quality drops, and which decision loop needs tightening. Once that problem is visible, the rest of the article can move with more confidence."
      : "A stronger article starts with one grounded problem, one audience, and one outcome. That framing turns the draft from a general opinion piece into something that reads like a system teams can actually use.";

  const thirdParagraph = brief.trim()
    ? `That is where your angle matters. ${brief.trim()} should shape the examples, the tone, and the level of depth so the story feels intentional instead of generic.`
    : "The middle section should do the heavy lifting: explain the pattern, name the tradeoff, and give readers a simple workflow they can lift into their own team.";

  const readyParagraphs =
    mode === "ready"
      ? [
          `Why this matters\n\nThe strongest publications and brand teams do not chase output for its own sake. They design a repeatable way to create useful work, and ${topicDescription} becomes more valuable when it supports that system instead of distracting from it.`,
          `How to apply it\n\nStart with one practical operating move: tighten the brief, define the audience, and decide what action the article should unlock. Once that foundation is clear, the rest of the piece can become sharper and more persuasive without feeling inflated.`,
        ]
      : [];

  const fourthParagraph = `To make ${topicDescription} feel credible, include one concrete operating move: a sharper brief template, a cleaner review rhythm, or a more disciplined publishing checklist. Specificity is what makes a professional post feel useful.`;
  const finalParagraph = `Close by pointing readers to the next move. The best conclusion is not a recap of everything above. It is a direct recommendation that helps a team act on ${topicDescription} this week.`;

  return [
    existingAngle,
    secondParagraph,
    thirdParagraph,
    ...readyParagraphs,
    fourthParagraph,
    finalParagraph,
  ];
}

function buildLocalDraft({ mode, brief, title, category, content }) {
  const topic = extractTopicFromMessage(
    [title, brief, content].filter(Boolean).join(". "),
    [],
    { topic: category }
  );
  const normalizedCategory = inferCategory(
    [brief, title, content, category].filter(Boolean).join(" "),
    category || "Editorial"
  );
  const finalTitle =
    title.trim() ||
    (mode === "ready"
      ? `${topic}: A Professional Guide for Teams Ready to Publish Better Work`
      : `${topic}: A Practical Editorial Playbook for Modern Teams`);
  const summary = `${topic} becomes more useful when teams turn it into a clear publishing system with stronger structure, sharper decisions, and repeatable execution.`;
  const draftContent = createParagraphs(topic, mode, brief, content).join("\n\n");

  return {
    title: finalTitle,
    category: normalizedCategory,
    image: pickCoverImage(normalizedCategory),
    summary,
    content: draftContent,
  };
}

router.post("/chat", async (req, res) => {
  const message = req.body.message?.trim() || "";
  const history = Array.isArray(req.body.history) ? req.body.history : [];
  const context = req.body.context || {};

  if (!message) {
    return res.status(400).json({ message: "Message is required" });
  }

  const conversation = history
    .slice(-6)
    .map((entry) => {
      const role = entry.role === "assistant" ? "Assistant" : "User";
      const content = typeof entry.content === "string" ? entry.content.trim() : "";
      return content ? `${role}: ${content}` : "";
    })
    .filter(Boolean)
    .join("\n\n");

  const serializedContext =
    typeof context === "string"
      ? context
      : JSON.stringify(
          {
            page: context.page || "/",
            user: context.user || "Guest",
            product: "Atlas Journal blogging platform",
          },
          null,
          2
        );

  try {
    if (shouldAutoCreateBlog(message, history, context)) {
      const response = await requestAssistant({
        instructions: `${SYSTEM_PROMPT}

You are Atlas Journal's ready-blog assistant. Return valid JSON only.

The JSON object must include:
- "title": string
- "category": string
- "summary": string
- "content": string

Rules:
- Choose "category" from this list only: ${CATEGORY_OPTIONS.join(", ")}
- "title" must be publication-ready
- "summary" should be one concise sentence
- "content" should be a complete, publish-ready blog with a strong opening, clear sectioning, and a practical conclusion
- Return plain text only inside JSON string values
- Do not use markdown
- Do not use asterisks, bullet symbols, or # headings
- Keep the writing easy to scan with short paragraphs and line-by-line readability
- Make the result polished, specific, and useful for a real reader
- Do not ask follow-up questions if you can reasonably infer the missing details
- When audience or tone is not explicit, choose sensible professional defaults`,
        input: `Platform context:\n${serializedContext}\n\nRecent conversation:\n${
          conversation || "No previous messages."
        }\n\nUser request:\n${message}`,
        maxOutputTokens: DEFAULT_READY_BLOG_MAX_OUTPUT_TOKENS,
        textFormat: {
          type: "json_schema",
          name: "atlas_journal_ready_blog_chat",
          strict: true,
          schema: DRAFT_SCHEMA,
        },
      });

      const draft = JSON.parse(stripCodeFences(response.text));
      const normalizedCategory = CATEGORY_OPTIONS.includes(draft.category)
        ? draft.category
        : inferCategory(message, "Editorial");

      return res.json({
        reply: formatDraftAsChatReply({
          title: typeof draft.title === "string" ? draft.title.trim() : "",
          category: normalizedCategory,
          summary: typeof draft.summary === "string" ? draft.summary.trim() : "",
          content: typeof draft.content === "string" ? draft.content.trim() : "",
        }),
        ...getAssistantRuntime(response.provider),
      });
    }

    const response = await requestAssistant({
      instructions: `${SYSTEM_PROMPT}

You are currently helping inside Atlas Journal, a professional blogging platform.

Rules for this workspace:
- Be especially strong at blog ideas, titles, summaries, structure, drafts, UX copy, and practical solutions related to content workflows.
- Do not give generic checklists when the user is clearly asking for content.
- If the user gives a topic or rough idea, convert it into a concrete answer instead of asking for more details unless absolutely necessary.
- Return plain text only
- Do not use markdown
- Do not use asterisks for emphasis or bullets
- Keep the answer easy to scan with short lines and short paragraphs
- Prefer useful deliverables over vague advice.`,
      input: `Platform context:\n${serializedContext}\n\nRecent conversation:\n${
        conversation || "No previous messages."
      }\n\nUser request:\n${message}`,
      maxOutputTokens: DEFAULT_CHAT_MAX_OUTPUT_TOKENS,
    });

    return res.json({
      reply: response.text,
      ...getAssistantRuntime(response.provider),
    });
  } catch (error) {
    console.warn("Assistant chat fallback:", error.message);
    return res.json({
      reply: buildLocalChatReply({ message, context, history }),
      ...getAssistantRuntime(
        "local",
        `${LOCAL_NOTICE} Last provider error: ${error.message}`
      ),
    });
  }
});

router.get("/status", (req, res) => {
  const preferredProvider = getPreferredProvider();
  const hasGroqKey = Boolean(getGroqApiKey());
  const hasGeminiKey = Boolean(getGeminiApiKey());
  const hasOpenAiKey = Boolean(process.env.OPENAI_API_KEY?.trim());

  res.json({
    providerPreference: preferredProvider,
    configuredProviders: {
      groq: hasGroqKey,
      google: hasGeminiKey,
      openai: hasOpenAiKey,
    },
    activeFallback: !hasGroqKey && !hasGeminiKey && !hasOpenAiKey,
  });
});

router.post("/draft", async (req, res) => {
  const mode =
    req.body.mode === "ready"
      ? "ready"
      : req.body.mode === "improve"
        ? "improve"
        : "draft";
  const brief = req.body.brief?.trim() || "";
  const title = req.body.title?.trim() || "";
  const category = req.body.category?.trim() || "Editorial";
  const content = req.body.content?.trim() || "";

  if (!brief && !content && !title) {
    return res
      .status(400)
      .json({ message: "Add a brief, title, or draft content first" });
  }

  try {
    const response = await requestAssistant({
      instructions: `${SYSTEM_PROMPT}

You are Atlas Journal's draft assistant. Return valid JSON only.

The JSON object must include:
- "title": string
- "category": string
- "summary": string
- "content": string

Rules:
- Choose "category" from this list only: ${CATEGORY_OPTIONS.join(", ")}
- "title" must be specific and publication-ready
- "summary" should be one concise sentence
- "content" should be a polished blog draft with a strong intro, clear body sections, and a practical conclusion
- If mode is "ready", make the article feel publish-ready with stronger sectioning, clearer authority, and enough depth for a professional blog post
- Keep the draft readable and professional
- Return plain text only inside JSON string values
- Do not use markdown
- Do not use asterisks, bullet symbols, or # headings
- Keep the writing easy to scan with short paragraphs and line-by-line readability
- If mode is "improve", preserve the user's main idea but make it sharper`,
      input: `Mode: ${mode}

Brief:
${brief || "No additional brief provided."}

Current title:
${title || "Untitled"}

Current category:
${category}

Existing content:
${content.slice(0, 6000) || "No existing content provided."}`,
      maxOutputTokens: DEFAULT_READY_BLOG_MAX_OUTPUT_TOKENS,
      textFormat: {
        type: "json_schema",
        name: "atlas_journal_draft",
        strict: true,
        schema: DRAFT_SCHEMA,
      },
    });

    const draft = JSON.parse(stripCodeFences(response.text));
    const normalizedCategory = CATEGORY_OPTIONS.includes(draft.category)
      ? draft.category
      : category;

    return res.json({
      title: typeof draft.title === "string" ? draft.title.trim() : "",
      category: normalizedCategory,
      image: pickCoverImage(normalizedCategory),
      summary: typeof draft.summary === "string" ? draft.summary.trim() : "",
      content: typeof draft.content === "string" ? draft.content.trim() : "",
      ...getAssistantRuntime(response.provider),
    });
  } catch (error) {
    console.warn("Assistant draft fallback:", error.message);
    return res.json({
      ...buildLocalDraft({
        mode,
        brief,
        title,
        category,
        content,
      }),
      ...getAssistantRuntime(
        "local",
        `${LOCAL_NOTICE} Last provider error: ${error.message}`
      ),
    });
  }
});

export default router;
