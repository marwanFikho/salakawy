import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  const apiKey = import.meta.env.GEMINI_API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({
      package: "Silver Package",
      reason: "Based on your needs, the Silver package provides the perfect balance of direct contact and flexible structure to hit your goals."
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const { goal, struggle, support } = await request.json();

    const SYSTEM_PROMPT = `You are the Salakawy Plan Recommendation Engine. 
The user has answered 3 questions:
1. Goal: ${goal}
2. Biggest struggle: ${struggle}
3. Support needed: ${support}

Rules for recommendation:
- If they selected "I need daily pushes" or "VIP", recommend "Platinum Package" or "Gold Package".
- If they selected "Weekly responses", recommend "Silver Package" or "Support Team".
- If they just want a sheet, recommend "1-Month Diet Plan".

RETURN A STRICT JSON RESPONSE ONLY:
{
  "package": "Name of the package",
  "reason": "1 highly personalized, motivational sentence telling them WHY this package perfectly fixes their struggle and achieves their goal."
}`;

    const fetchOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: SYSTEM_PROMPT }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 200,
            responseMimeType: 'application/json'
          },
        }),
      };

    let geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
      fetchOptions
    );

    if (geminiRes.status === 503) {
      await new Promise(r => setTimeout(r, 1000));
      geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
        fetchOptions
      );
    }

    if (!geminiRes.ok) throw new Error("API Failure");

    const geminiData = await geminiRes.json();
    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Clean code formatting if it leaked through
    const cleaned = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
    const parsed = JSON.parse(cleaned);

    return new Response(JSON.stringify({
      package: parsed.package || "Silver Package",
      reason: parsed.reason || "This package will give you the perfect structure to smash your goals!"
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (err) {
    return new Response(JSON.stringify({
      package: "Silver Package",
      reason: "Our most popular choice! It gives you direct access to Salakawy to crush your goals."
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
};
