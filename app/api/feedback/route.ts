import { NextResponse } from "next/server";

export const runtime = "edge";

interface FeedbackPayload {
  reqTitle: string;
  reqNumber: string;
  locations: string[];
  workSetup: string;
  feasibilityScore: number | null;
  baselineTTF: string;
  estimatedTTF: string;
  overallFeedback: "up" | "down";
  flagFeedback: Record<string, "agree" | "disagree">;
  userNotes: string;
  reqText: string;
  analysisJSON: string;
}

function chunkText(text: string, limit = 2000): { type: "text"; text: string }[] {
  const chunks: { type: "text"; text: string }[] = [];
  for (let i = 0; i < text.length; i += limit) {
    chunks.push({ type: "text", text: text.slice(i, i + limit) });
  }
  return chunks.length > 0 ? chunks : [{ type: "text", text: "" }];
}

export async function POST(request: Request) {
  const apiKey = process.env.NOTION_API_KEY;
  const dbId = process.env.NOTION_FEEDBACK_DB_ID;

  if (!apiKey || !dbId) {
    console.warn("Notion feedback: NOTION_API_KEY or NOTION_FEEDBACK_DB_ID not set");
    return NextResponse.json({ ok: false });
  }

  let payload: FeedbackPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false });
  }

  const flagFeedbackStr = JSON.stringify(payload.flagFeedback || {});

  try {
    const res = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        parent: { database_id: dbId },
        properties: {
          "Req Title": {
            title: chunkText(payload.reqTitle || "Untitled"),
          },
          "Req Number": {
            rich_text: chunkText(payload.reqNumber || ""),
          },
          "Locations": {
            multi_select: (payload.locations || []).map((l) => ({ name: l })),
          },
          "Work Setup": {
            select: payload.workSetup ? { name: payload.workSetup } : null,
          },
          "Feasibility Score": {
            number: payload.feasibilityScore,
          },
          "Baseline TTF": {
            rich_text: chunkText(payload.baselineTTF || ""),
          },
          "Estimated TTF": {
            rich_text: chunkText(payload.estimatedTTF || ""),
          },
          "Overall Feedback": {
            select: { name: payload.overallFeedback },
          },
          "Flag Feedback": {
            rich_text: chunkText(flagFeedbackStr),
          },
          "User Notes": {
            rich_text: chunkText(payload.userNotes || ""),
          },
          "Req Text": {
            rich_text: chunkText(payload.reqText || ""),
          },
          "Analysis JSON": {
            rich_text: chunkText(payload.analysisJSON || ""),
          },
          Date: {
            date: { start: new Date().toISOString().slice(0, 10) },
          },
        },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Notion API error:", res.status, err);
    }
  } catch (err) {
    console.error("Notion feedback submission failed:", err);
  }

  return NextResponse.json({ ok: true });
}
