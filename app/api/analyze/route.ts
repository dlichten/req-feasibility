import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are a recruiting operations analyst specializing in requisition feasibility. Your job is to review job requisitions and identify requirements that will make the role difficult to fill — particularly overly specific, niche, or stacking requirements that shrink the candidate pool and extend time-to-fill.

You should evaluate requisitions from the perspective of a recruiting ops leader who wants to keep time-to-fill under 56 days. The CEO has specifically called out that "if there's a specific niche or specific software requirement, that should raise a flag."

Analyze the requisition and return a JSON object with this exact structure:
{
  "overallScore": <number 0-100, where 100 = extremely high risk of extended time-to-fill>,
  "overallVerdict": "<one sentence verdict>",
  "estimatedImpact": "<describe likely impact on time-to-fill>",
  "summary": "<2-3 sentence summary of key feasibility concerns>",
  "flags": [
    {
      "requirement": "<the specific requirement being flagged>",
      "riskLevel": "high" | "medium" | "low",
      "category": "<one of: Niche Software, Niche Skill, Stacked Specificity, Experience Threshold, Geographic/Market, Credential, Other>",
      "explanation": "<why this is a risk for hiring feasibility>",
      "suggestion": "<actionable suggestion to broaden or mitigate>"
    }
  ],
  "recommendations": [
    "<actionable recommendation to improve feasibility>"
  ]
}

Guidelines for flagging:
- NICHE SOFTWARE: Specific software platforms (especially proprietary or industry-specific) dramatically shrink candidate pools. Flag these as high risk.
- NICHE SKILL: Skills that are very specialized within an already specialized domain. For example, requiring DME billing experience is specialized; requiring DME billing specifically for orthopedic bracing AND wound care AND CGM is stacked specificity.
- STACKED SPECIFICITY: When multiple niche requirements are combined (e.g., must know X software AND have Y years in Z sub-specialty), the compounding effect on candidate pool is multiplicative, not additive. Flag these prominently.
- EXPERIENCE THRESHOLDS: Overly specific year requirements (e.g., "3 years in X" when 2 years would suffice) can eliminate otherwise qualified candidates.
- GEOGRAPHIC/MARKET: Consider whether the work setup (remote/onsite) and likely hiring market affect feasibility.
- Look at screening criteria especially carefully — these are hard filters that eliminate candidates before they even get reviewed.
- Consider the overall market for this type of role and the likely candidate pool.
- Be direct and specific — don't hedge. If something is a problem, say so clearly.
- Provide practical, actionable suggestions (e.g., "Accept Brightree OR equivalent DME billing software" instead of just "broaden requirements").
- Include 3-5 overall recommendations at the end.

Return ONLY the JSON object, no markdown formatting or code blocks.`;

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY environment variable is not set" },
      { status: 500 }
    );
  }

  let body: { requisition?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { requisition } = body;
  if (!requisition || typeof requisition !== "string" || !requisition.trim()) {
    return NextResponse.json(
      { error: "Please provide a requisition to analyze" },
      { status: 400 }
    );
  }

  const client = new Anthropic({ apiKey });

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: `Analyze the following job requisition for hiring feasibility risks:\n\n${requisition}`,
        },
      ],
      system: SYSTEM_PROMPT,
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";

    let analysis;
    try {
      analysis = JSON.parse(text);
    } catch {
      // Try to extract JSON from the response if wrapped in markdown
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Failed to parse analysis response");
      }
    }

    return NextResponse.json(analysis);
  } catch (err: unknown) {
    console.error("Analysis error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to analyze requisition";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
