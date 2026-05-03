import type { APIRoute } from 'astro';

// Whitelist of valid page paths on this site
const VALID_URLS: Record<string, string> = {
  '/': '/',
  '/#hero': '/#hero',
  '/#transformations': '/#transformations',
  '/#packages': '/#packages',
  '/#struggles': '/#struggles',
  '/common-challenges': '/common-challenges',
  '/resources': '/resources',
  '/contact-us': '/contact-us',
};

function sanitizeButtons(buttons: Array<{ label?: string; url?: string }> | undefined): Array<{ label: string; url: string }> {
  if (!Array.isArray(buttons)) return [];
  return buttons
    .filter(b => b && typeof b.label === 'string' && typeof b.url === 'string')
    .map(b => ({
      label: String(b.label).slice(0, 40),
      // If the AI hallucinated a URL not in our whitelist, drop it gracefully
      url: VALID_URLS[b.url!] ?? '/',
    }))
    .filter(b => b.label.length > 0)
    .slice(0, 3); // max 3 buttons
}

const SYSTEM_PROMPT = `You are a helpful, friendly virtual assistant for Coach Salakawy's fitness and nutrition coaching platform. You are NOT the coach himself — you are his digital assistant.

CRITICAL: YOU MUST ALWAYS RESPOND WITH ONLY VALID JSON. No markdown, no prose outside the JSON object. Start your response with { and end with }.

Response format (strictly follow this):
{
  "text": "Your friendly response here in plain English with no asterisks, no bullet points, no markdown.",
  "buttons": [
    { "label": "Short Button Label", "url": "/exact-path" }
  ]
}

ALLOWED URL PATHS (use ONLY these exact strings, nothing else):
- "/" — Home page
- "/#transformations" — Transformation results & before/after
- "/#packages" — Pricing packages
- "/common-challenges" — Common challenges & obstacles
- "/resources" — Free resources & tools
- "/contact-us" — Contact & payment info

RULES FOR BUTTONS:
- Include 1–3 buttons only when they genuinely help the user navigate.
- Use [] for buttons when no navigation is needed.
- NEVER invent or guess URLs. Only use the exact paths from the list above.

ABOUT COACH SALAKAWY:
Coach Salakawy is a certified fitness and nutrition coach based in Egypt. He helps people lose weight, build muscle, and transform their lives through personalized diets and workouts. He coaches via WhatsApp.
His personal story: He was once miserable about his body, fell in love with working out, and now dedicates his life to transforming others.
Real results: Mahmoud lost 41kg; Sara beat insulin resistance and lost 30kg.

COACHING PHILOSOPHY:
- Flexible diets: No forbidden foods. Restaurants, sweets, and fast food are allowed within the tailored macros.
- Consistency over perfection.
- Salakawy is the client's external engine until internal discipline kicks in.
- No spot reduction: Only overall fat loss is possible.

OFFICIAL PACKAGES & EXACT PRICING (Tell users these exact prices if they ask, and add a button to /#packages):
1. Support Team Package: Weekly follow-up by the Assistant Team. Plan designed by Salakawy.
   - 1 Month: 1200 EGP (or $45)
   - 3 Months: 3200 EGP (or $85)

2. Silver Package (Best Seller): Weekly responses directly with Salakawy. WhatsApp Q&A anytime.
   - 1 Month: 3700 EGP (or $80)
   - 3 Months: 7900 EGP (or $170)

3. Gold Package: Daily responses, VIP attention, and you get Salakawy's direct phone number to call anytime.
   - 1 Month: 4900 EGP (or $110)
   - 3 Months: 12900 EGP (or $270)

4. Platinum Package: The Ultimate VIP. Salakawy proactively reaches out to YOU every day for weight & mindset checks.
   - 1 Month: 12700 EGP (or $230)
   - 3 Months: 29700 EGP (or $590)

PAYMENT: Vodafone Cash or InstaPay. Details are on the /contact-us page. Users transfer the money and send a WhatsApp screenshot to confirm.

COMMON CHALLENGES TACKLED (on /common-challenges):
Low Motivation, Emotional Eating, Sugar Cravings, Belly Fat, Arm Fat, Slow Metabolism, Weight Plateau, Stress, Poor Sleep, Night Eating, Hormonal Imbalance, Water Retention, Bloating, Hidden Eating, High Calories, Inconsistency, Injuries, Laziness, Comparisons, Aging.

RESPONSE GUIDELINES:
- Warm, motivating, and supportive. Like a gym buddy.
- Keep answers to 2–4 short sentences. Be direct.
- You CAN give exact prices now because they are listed above.
- Always respond ONLY with the JSON object.`;

export const POST: APIRoute = async ({ request }) => {
  const apiKey = import.meta.env.GEMINI_API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({
      text: "I'm temporarily unavailable. Please reach out to Coach Salakawy on WhatsApp!",
      buttons: [{ label: 'Contact Us', url: '/contact-us' }]
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const body = await request.json();
    const { message, history = [] } = body;

    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ text: "I didn't catch that — could you try again?", buttons: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Build conversation turns for Gemini
    // Instead of using systemInstruction (which can cause 503 routing issues on lite models),
    // we prefix the system prompt to the first message
    const contents = [
      {
        role: 'user',
        parts: [{ text: SYSTEM_PROMPT }]
      },
      {
        role: 'model',
        parts: [{ text: 'Understood. I will follow these instructions perfectly and only respond in JSON format.' }]
      },
      ...history
        .filter((m: { role: string; text: string }) => m.role && m.text)
        .map((msg: { role: string; text: string }) => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }],
        })),
      {
        role: 'user',
        parts: [{ text: message }],
      },
    ];

    const fetchOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.6,
          maxOutputTokens: 600
        },
      }),
    };

    let geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemma-3-27b-it:generateContent?key=${apiKey}`,
      fetchOptions
    );

    // If 503 High Demand, retry once after a short delay
    if (geminiRes.status === 503) {
      console.warn('503 High Demand received. Retrying in 1s...');
      await new Promise(r => setTimeout(r, 1000));
      geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemma-3-27b-it:generateContent?key=${apiKey}`,
        fetchOptions
      );
    }

    if (!geminiRes.ok) {
      const err = await geminiRes.text();
      console.error('Gemini API error:', err);
      return new Response(JSON.stringify({
        text: "I'm having a little trouble right now. Please try again shortly or reach out via WhatsApp!",
        buttons: [{ label: 'Contact Us', url: '/contact-us' }]
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    const geminiData = await geminiRes.json();
    const rawText: string = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!rawText) {
      return new Response(JSON.stringify({
        text: "I didn't get a proper response. Please try rephrasing your question!",
        buttons: []
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // Parse JSON aggressively by finding the first '{' and last '}'
    try {
      let cleaned = rawText.trim();
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          cleaned = cleaned.substring(firstBrace, lastBrace + 1);
      } else {
          throw new Error("No JSON object found");
      }

      const parsed = JSON.parse(cleaned);

      return new Response(JSON.stringify({
        text: String(parsed.text || '').trim() || rawText,
        buttons: sanitizeButtons(parsed.buttons),
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch {
      // Model returned plain text instead of JSON — wrap it
      return new Response(JSON.stringify({ text: rawText.trim(), buttons: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (e) {
    console.error('Chat endpoint error:', e);
    return new Response(JSON.stringify({
      text: "Something went wrong on my end. Please try again!",
      buttons: []
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
};
