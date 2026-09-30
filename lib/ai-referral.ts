/**
 * AI search / chat — human referrers + crawler split:
 * - Reference crawlers → CrawlerSeoPage + Allow:/
 * - Training crawlers → Disallow:/ (not on CrawlerSeoPage allowlist)
 * - Content-Signal preference: search=yes, ai-train=no, use=reference
 */

/** robots.txt / HTTP preference (not a hard lock; pair with Disallow for training UAs). */
export const CONTENT_SIGNAL =
  "search=yes, ai-train=no, use=reference" as const

/** IETF standard-track preference header (unknown params are ignored by spec). */
export const CONTENT_USAGE = "bots=y, search=y, train-ai=n" as const

/** Training / model-ingest crawlers — block site-wide in robots.txt. */
export const AI_TRAINING_CRAWLER_AGENTS = [
  "Google-Extended",
  "Applebot-Extended",
  "GPTBot",
  "anthropic-ai",
  "ClaudeBot",
  "Bytespider",
  "cohere-ai",
  "Diffbot",
  "omgili",
  "Amazonbot",
  "CCBot",
  "commoncrawl",
  "cohere-training-data-crawler",
  "Coherebot",
  "meta-externalagent",
] as const

export const AI_TRAINING_CRAWLER_UA =
  /google-extended|applebot-extended|gptbot|anthropic-ai|claudebot|bytespider|cohere-ai|diffbot|omgili|amazonbot|ccbot|commoncrawl|cohere-training-data-crawler|coherebot|meta-externalagent/i

/**
 * User-triggered / citation crawlers — CrawlerSeoPage + Allow:/
 * (not model-training tokens).
 *
 * OAI-SearchBot and Perplexity-User added in Step 5: both are official
 * search/user-fetch tokens observed in OpenAI and Perplexity docs
 * (platform.openai.com/docs/bots, docs.perplexity.ai/guides/bots) and they
 * belong to this same reference bucket as ChatGPT-User / PerplexityBot.
 */
export const AI_REFERENCE_CRAWLER_AGENTS = [
  "ChatGPT-User",
  "Claude-Web",
  "PerplexityBot",
  "Perplexity-User",
  "OAI-SearchBot",
  "DuckAssistBot",
  "YouBot",
  "Claude-SearchBot",
  "Claude-User",
  "meta-webindexer",
  "Amzn-SearchBot",
  "Amzn-User",
] as const

export const AI_REFERENCE_CRAWLER_UA =
  /chatgpt-user|claude-web|perplexitybot|perplexity-user|oai-searchbot|duckassistbot|youbot|claude-searchbot|claude-user|meta-webindexer|amzn-searchbot|amzn-user/i

/** @deprecated Use AI_REFERENCE_CRAWLER_AGENTS — kept for older call sites during migrate. */
export const AI_REFERRAL_CRAWLER_AGENTS = AI_REFERENCE_CRAWLER_AGENTS

/** @deprecated Use AI_REFERENCE_CRAWLER_UA */
export const AI_REFERRAL_CRAWLER_UA = AI_REFERENCE_CRAWLER_UA

/** document.referrer hosts for human traffic from AI chat / search UIs. */
export const AI_REFERRAL_HOSTS = [
  "chatgpt.com",
  "chat.openai.com",
  "openai.com",
  "perplexity.ai",
  "claude.ai",
  "anthropic.com",
  "copilot.microsoft.com",
  "copilot.com",
  "gemini.google.com",
  "you.com",
  "poe.com",
  "phind.com",
  "meta.ai",
  "x.ai",
  "grok.com",
] as const
