export const runtime = "edge";

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const chunks = [
        '{"overallScore": 72',
        ', "overallVerdict": "High risk due to',
        ' niche software requirement"',
        ', "summary": "Testing streaming..."',
        ', "flags": []',
        ', "wellCalibratedRequirements": []',
        ', "revisedScreeningCriteria": {"mustHave": [], "niceToHave": [], "trainable": []}',
        ', "recommendations": ["Test recommendation"]}',
      ];

      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "X-Accel-Buffering": "no",
    },
  });
}
