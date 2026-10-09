/**
 * MailCraft AI - Google Gemini API Client
 * Provides optional live LLM streaming/generation with structured JSON output formatting.
 */

import { generateEmail } from './emailGenerator.js';

const GEMINI_MODELS = [
  'gemini-1.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-pro'
];

/**
 * Validate a Gemini API key directly against Google's API
 */
export async function validateGeminiApiKey(apiKey) {
  const trimmedKey = (apiKey || '').trim();
  if (!trimmedKey) {
    return { valid: false, message: 'Please enter an API key.' };
  }

  // Detect accidental Gmail App Password (16 letters, e.g. "abcd efgh ijkl mnop")
  const stripped = trimmedKey.replace(/\s+/g, '');
  if (/^[a-z]{16}$/i.test(stripped)) {
    return {
      valid: false,
      message: '⚠️ This looks like a Gmail App Password (16 letters), not a Gemini API Key! Paste this into "Gmail SMTP Configuration" below instead.'
    };
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(trimmedKey)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'ping' }] }]
      })
    });

    if (res.ok) {
      return { valid: true, message: '✅ Gemini API key is valid and active! (Google Gemini 1.5 Flash)' };
    }

    const data = await res.json().catch(() => ({}));
    const errMsg = data.error?.message || `HTTP ${res.status}`;
    return {
      valid: false,
      message: `❌ Google API error: ${errMsg}. Get a free key at https://aistudio.google.com/apikey`
    };
  } catch (err) {
    return { valid: false, message: `❌ Network connection failed: ${err.message}` };
  }
}

/**
 * Generate email using Gemini LLM if API key is provided,
 * otherwise fall back to the built-in heuristic AI engine.
 */
export async function generateWithAI(inputs, apiKey = '', options = {}) {
  const trimmedKey = (apiKey || '').trim();

  // If no API key provided, use built-in engine
  if (!trimmedKey) {
    return {
      source: 'built-in',
      result: generateEmail(inputs)
    };
  }

  // System instruction and structured prompt with Deliverability & Anti-Spam standards
  const systemInstruction = `You are an expert executive copywriter, communications consultant, and professional email copywriter.
Your task is to generate a polished, natural-sounding, high-converting email draft based on the parameters provided.

CRITICAL DELIVERABILITY RULES (ANTI-SPAM):
To ensure this email easily passes through spam filters and does not trigger fraud detection:
1. Avoid classic spam trigger words (e.g., "100% free", "Act Now!", "Guarantee", "Urgent action required", "No risk", "Special promotion", "Click here now").
2. Do not use ALL CAPS for emphasis (use strong verbs and professional phrasing instead).
3. Avoid excessive or dramatic punctuation (e.g., "!!!", "???").
4. Ensure the transition between the introductory pleasantries and the "key points" is seamless and conversational. Never use robotic transitions like "Here are the key points to highlight:". Weave the points naturally into the body paragraphs (or clean contextual bullets only if explicitly requested).
5. Subject lines must be clear, relevant, professional, and non-clickbaity.

You MUST output ONLY valid JSON matching this exact structure:
{
  "subject": "Clear, professional, and non-clickbaity primary subject line",
  "subjectOptions": [
    "Primary subject",
    "Alternative direct subject",
    "Alternative action-oriented or collaborative subject"
  ],
  "salutation": "Formality-matched greeting (e.g. Dear Dr. Smith, or Hi Alex,)",
  "opening": "Contextual opening paragraph with natural rapport matching tone and objective",
  "bodyParagraphs": [
    "First body paragraph seamlessly integrating the key points into professional prose",
    "Second body paragraph detailing value, context, or execution details"
  ],
  "callToAction": "Clear, specific, and polite next steps or call to action",
  "signOff": "Formality-appropriate closing phrase (e.g. Warm regards, or Sincerely,)"
}`;

  const promptText = `Generate a professional email with these exact parameters:
- Recipient Name & Title: ${inputs.recipient || 'Not specified'}, ${inputs.recipientRole || 'Not specified'}
- Sender Name & Title: ${inputs.sender || 'Sender'}, ${inputs.senderRole || 'Professional'}
- Email Objective / Topic: ${inputs.topic || inputs.customPurpose || inputs.purpose || 'General Update'}
- Tone Calibration: ${inputs.tone} (e.g., formal, polite, concise, urgent, persuasive, casual)
- Urgency: ${inputs.urgency || 'medium'}
- Detail Level: ${inputs.detailLevel || 'standard'}
- Desired Action / CTA: ${inputs.cta} (${inputs.customCta || 'Standard next steps'})
- Target Timeframe: ${inputs.timeframe || 'as convenient'}
- Format Style: ${inputs.includeBullets ? 'Include clean, contextual bullet points for complex details' : 'Continuous flowing prose (no raw list markers)'}
- Key Points to Address:
${(inputs.keyPoints || []).length > 0 ? (inputs.keyPoints || []).map((pt, i) => `  ${i + 1}. ${pt}`).join('\n') : '  - Address the objective with natural context'}

Ensure strict compliance with the anti-spam rules: no trigger words, no all-caps, no exaggerated punctuation, and seamless transitions.
Output ONLY valid raw JSON with no markdown backticks or commentary.`;

  let lastError = null;

  for (const model of GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
        trimmedKey
      )}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: promptText }]
            }
          ],
          systemInstruction: {
            parts: [{ text: systemInstruction }]
          },
          generationConfig: {
            temperature: inputs.tone === 'formal' || inputs.tone === 'concise' ? 0.3 : 0.7,
            responseMimeType: 'application/json'
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API error (${response.status})`);
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        throw new Error('Empty response received from Gemini API');
      }

      // Parse JSON from text (stripping markdown fences if any)
      const cleanJson = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
      const parsed = JSON.parse(cleanJson);

      const senderName = (inputs.sender || 'Professional Sender').trim();
      const signature = inputs.senderRole ? `${senderName}\n${inputs.senderRole.trim()}` : senderName;

      // Support structured schema as well as primary_subject / alternative_subjects aliases
      const subject = parsed.subject || parsed.primary_subject || 'Important Update';
      const subjectOptions = parsed.subjectOptions || parsed.alternative_subjects || [subject];

      let salutation = parsed.salutation || '';
      let opening = parsed.opening || '';
      let bodyParagraphs = [];
      let callToAction = parsed.callToAction || '';
      let signOff = parsed.signOff || 'Best regards,';
      let fullText = '';

      if (parsed.email_body && (!parsed.opening || !parsed.bodyParagraphs)) {
        fullText = parsed.email_body;
        const paragraphs = parsed.email_body.split('\n\n').map(p => p.trim()).filter(Boolean);
        salutation = paragraphs[0] || `Dear ${inputs.recipient || 'Colleague'},`;
        opening = paragraphs[1] || '';
        bodyParagraphs = paragraphs.slice(2, Math.max(2, paragraphs.length - 2));
        callToAction = paragraphs[paragraphs.length - 2] || '';
        signOff = paragraphs[paragraphs.length - 1] || 'Best regards,';
      } else {
        salutation = parsed.salutation || `Dear ${inputs.recipient || 'Colleague'},`;
        opening = parsed.opening || '';
        bodyParagraphs = Array.isArray(parsed.bodyParagraphs)
          ? parsed.bodyParagraphs
          : [parsed.bodyParagraphs || ''];
        callToAction = parsed.callToAction || '';
        signOff = parsed.signOff || 'Best regards,';

        fullText = `${salutation}\n\n${[
          opening,
          ...bodyParagraphs,
          callToAction
        ].filter(Boolean).join('\n\n')}\n\n${signOff}\n${signature}`;
      }

      const words = fullText.trim().split(/\s+/).filter(Boolean).length;

      return {
        source: `gemini (${model})`,
        result: {
          subject,
          subjectOptions,
          salutation,
          opening,
          bodyParagraphs,
          callToAction,
          signOff,
          signature,
          fullText,
          metrics: {
            words,
            readingTimeSeconds: Math.max(10, Math.round((words / 200) * 60)),
            formalityScore: inputs.tone === 'formal' ? 95 : 80,
            toneLabel: inputs.tone.toUpperCase()
          }
        }
      };
    } catch (err) {
      console.warn(`Gemini attempt with ${model} failed:`, err);
      lastError = err;
    }
  }

  // If Gemini failed, fall back with error notice
  const fallback = generateEmail(inputs);
  return {
    source: 'fallback-built-in',
    errorNotice: `Gemini API call failed (${lastError?.message || 'Network issue'}). Switched to Built-in Engine.`,
    result: fallback
  };
}
