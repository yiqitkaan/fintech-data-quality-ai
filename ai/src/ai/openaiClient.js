// ai/src/ai/openaiClient.js
// Minimal OpenAI HTTP client (no SDK) using the Responses API.
// Reads OPENAI_API_KEY / OPENAI_MODEL from environment at call-time (so dotenv can be loaded in the entry file).

function requireEnv(name) {
  const v = process.env[name];
  if (!v || String(v).trim().length === 0) {
    throw new Error(`${name} is missing. Add it to ai/.env and reload the process.`);
  }
  return v;
}

/**
 * Calls OpenAI Responses API and returns a single combined text output.
 * @param {Object} params
 * @param {string=} params.model - Optional; falls back to process.env.OPENAI_MODEL.
 * @param {string} params.prompt - User prompt.
 * @returns {Promise<string>}
 */
async function callOpenAI({ model, prompt }) {
  const OPENAI_API_KEY = requireEnv("OPENAI_API_KEY");
  const finalModel = model || process.env.OPENAI_MODEL || "gpt-4o-mini";

  if (!prompt || String(prompt).trim().length === 0) {
    throw new Error("prompt is required and cannot be empty");
  }

  // --- Safety: prevent hanging requests forever (e.g., network issues)
  const TIMEOUT_MS = Number(process.env.OPENAI_TIMEOUT_MS || 30000);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  // Helper: extract text from the Responses API payload in a robust way.
  function extractText(data) {
    if (data && typeof data.output_text === "string" && data.output_text.trim().length > 0) {
      return data.output_text;
    }

    const out = Array.isArray(data?.output) ? data.output : [];

    // Try message items first
    for (const item of out) {
      if (item?.type !== "message") continue;
      const content = Array.isArray(item?.content) ? item.content : [];
      const texts = content
        .filter((c) => c && (c.type === "output_text" || typeof c.text === "string"))
        .map((c) => (typeof c.text === "string" ? c.text : ""))
        .filter((t) => t.trim().length > 0);
      if (texts.length > 0) return texts.join("\n");
    }

    // Fallback: any output_text content anywhere
    const anyTexts = out
      .flatMap((item) => (Array.isArray(item?.content) ? item.content : []))
      .filter((c) => c && (c.type === "output_text" || typeof c.text === "string"))
      .map((c) => (typeof c.text === "string" ? c.text : ""))
      .filter((t) => t.trim().length > 0);

    return anyTexts.join("\n");
  }

  try {
    // Node 18+ has global fetch. If you ever run on older Node, you must install and import node-fetch.
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: finalModel,
        // `instructions` acts like the system message.
        instructions:
          "You are a senior FinTech data quality expert helping a CTO understand risks and actions.",
        // `input` is the user message.
        input: prompt,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      throw new Error(
        `OpenAI API error: ${response.status} ${response.statusText}` +
          (errText ? ` :: ${errText}` : "")
      );
    }

    const data = await response.json();
    const text = extractText(data);

    if (typeof text === "string" && text.trim().length > 0) return text;
    return "";
  } catch (err) {
    // Make timeout errors clearer
    if (err && (err.name === "AbortError" || String(err.message).includes("aborted"))) {
      throw new Error(`OpenAI request timed out after ${TIMEOUT_MS}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

module.exports = { callOpenAI };