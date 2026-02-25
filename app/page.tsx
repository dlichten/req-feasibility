"use client";

import { useState } from "react";
import { flushSync } from "react-dom";
import { parse as parsePartialJSON } from "partial-json";

const SAMPLE_REQ = `Senior Medical Billing Specialist
Open
#1837
Business Unit: Healthcare Services
Work Setup: Work From Home
Category: Healthcare
Number of Openings: 2

Job Summary:
The Senior Medical Billing Specialist is responsible in supporting U.S. based Durable Medical Equipment (DME) billing operations by ensuring accurate claim preparation, documentation review, and payer compliance prior to submission. The role works closely with Intake, Confirmations, and Senior Billing teams to reduce billing errors and delays.

Job Description:
\u2022 Reviews prescriptions, CMNs, chart notes, and signatures for completeness and accuracy.
\u2022 Validates documentation against Medicare, Medicaid, Medicare Advantage, and commercial payer requirements.
\u2022 Identifies and resolves documentation gaps prior to claim submission.
\u2022 Reviews insurance eligibility, coverage, authorizations, and benefit requirements.
\u2022 Confirms frequency limits, payer-specific rules, and authorization needs.
\u2022 Identifies and escalates payer coordination issues.
\u2022 Reviews HCPCS codes and modifier usage for DME product lines including Orthopedic Bracing, Wound Care, and CGM.
\u2022 Ensures billing accuracy aligned with payer policies and internal workflows.
\u2022 Escalates complex billing or coding issues appropriately.
\u2022 Maintains accurate order records and billing data in Brightree.
\u2022 Supports order tracking, billing preparation, and claim workflows.
\u2022 Ensures data consistency and integrity across systems.
\u2022 Communicates with payers to clarify documentation requirements or claim status.
\u2022 Supports claim follow-ups and documentation requests.
\u2022 Assists with appeals, denials, and resubmissions under senior billing guidance.
\u2022 Maintains internal tracking tools including error logs and on-hold reports.
\u2022 Ensures timely follow-up to minimize billing delays.

Qualifications:
\u2022 Has working knowledge of U.S. insurance billing processes.
\u2022 Experience supporting U.S. insurance billing (Medicare, Medicaid, Medicare Advantage, Commercial).
\u2022 Experience supporting multiple DME product lines (Orthopedic Bracing, Wound Care, CGM).
\u2022 Applies expertise in HCPCS coding, modifiers, CMNs, and medical necessity documentation.
\u2022 Experience collaborating with Intake, Confirmation, and Senior Billing teams.
\u2022 Exposure to appeals and denial management workflows.
\u2022 Maintains high accuracy, attention to detail, and documentation quality.
\u2022 Manages multiple tasks while meeting billing timelines.
\u2022 Reliable internet connection and secure remote workspace.
\u2022 Work independently in a remote setup.
\u2022 Works effectively with limited supervision.
\u2022 Clear and coherent both written and verbal communication skills in English.

Screening Criteria:
\u2022 Minimum of three (3) years of healthcare billing experience.
\u2022 Minimum of one (1) year of DME insurance billing with focus on orthopedic bracing and wound care experience.
\u2022 Experience using Brightree cloud-based software.
\u2022 Must have a stable employment history.`;

const MARKETS = ["Philippines", "Colombia", "India"] as const;
type Market = (typeof MARKETS)[number];

interface RiskFlag {
  requirement: string;
  riskLevel: "high" | "medium" | "low";
  category: string;
  source?: "screening_criteria" | "qualifications" | "alignment";
  explanation: string;
  suggestion: string;
}

interface TrainableSkill {
  skill: string;
  estimatedRampTime: string;
}

interface AnalysisResult {
  overallScore: number;
  overallVerdict: string;
  estimatedTimeToFill: string;
  summary: string;
  flags: RiskFlag[];
  wellCalibratedRequirements: string[];
  revisedScreeningCriteria: {
    mustHave: string[];
    niceToHave: string[];
    trainable: TrainableSkill[];
  };
  recommendations: string[];
}

const CHANGELOG = [
  {
    version: "v2.2",
    date: "Feb 25, 2026",
    changes: [
      "Analysis now scores only Qualifications and Screening Criteria for feasibility (job description tasks are no longer treated as hiring constraints)",
      'Added "Alignment Notes" section flagging mismatches between JD and screening criteria',
      "Added Hiring Market selector (Philippines, Colombia, India) \u2014 analysis now adjusts for regional talent pool dynamics",
      "Refined language on pool reduction estimates for defensibility",
      "Repositioned tool as pre-submission review checkpoint",
      "Added this changelog",
    ],
  },
  {
    version: "v2.1",
    date: "Feb 25, 2026",
    changes: [
      'Pool reduction estimates now use directional language ("roughly half," "approximately 50-65%") instead of precise figures',
      "Added footnote on Flagged Requirements section explaining estimate methodology",
    ],
  },
  {
    version: "v2.0",
    date: "Feb 25, 2026",
    changes: [
      'Added "Well-Calibrated Requirements" section showing what\'s appropriately scoped',
      "Added Revised Screening Criteria with Must Have / Nice to Have / Trainable tiers",
      "Trainable skills now include estimated ramp times",
      "Added Title/JD Mismatch and Vague/Subjective Criteria as flag categories",
      "Updated scoring with defined risk thresholds (0-30 Low, 31-55 Moderate, 56-75 High, 76-100 Critical)",
      "Philippines offshore market context built into analysis",
      "Streaming response with progressive UI rendering",
    ],
  },
  {
    version: "v1.0",
    date: "Feb 24, 2026",
    changes: [
      "Initial release: paste a req, get feasibility risk score and flagged requirements",
      "Basic recommendations output",
    ],
  },
];

const riskColors = {
  high: { bg: "bg-red-50", border: "border-red-200", badge: "bg-red-100 text-red-800", icon: "text-red-500" },
  medium: { bg: "bg-amber-50", border: "border-amber-200", badge: "bg-amber-100 text-amber-800", icon: "text-amber-500" },
  low: { bg: "bg-blue-50", border: "border-blue-200", badge: "bg-blue-100 text-blue-800", icon: "text-blue-500" },
};

function getScoreBand(score: number) {
  if (score >= 76) return { label: "Critical Risk", color: "text-red-600", bg: "bg-red-500", track: "text-red-100" };
  if (score >= 56) return { label: "High Risk", color: "text-orange-500", bg: "bg-orange-500", track: "text-orange-100" };
  if (score >= 31) return { label: "Moderate Risk", color: "text-amber-500", bg: "bg-amber-500", track: "text-amber-100" };
  return { label: "Low Risk", color: "text-green-500", bg: "bg-green-500", track: "text-green-100" };
}

function ScoreGauge({ score }: { score: number }) {
  const band = getScoreBand(score);
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-36 h-36">
        <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="8" className={band.track} />
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={`${band.color} transition-all duration-1000 ease-out`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-bold ${band.color}`}>{score}</span>
          <span className="text-xs text-gray-500">/100</span>
        </div>
      </div>
      <span className={`text-sm font-semibold ${band.color}`}>{band.label}</span>
    </div>
  );
}

type FeedbackValue = "up" | "down" | null;

function SectionFeedback({ section, feedback, onFeedback }: {
  section: string;
  feedback: FeedbackValue;
  onFeedback: (section: string, value: FeedbackValue) => void;
}) {
  return (
    <div className="flex items-center gap-1 ml-auto">
      <button
        onClick={() => onFeedback(section, feedback === "up" ? null : "up")}
        className={`p-1 rounded transition-colors ${
          feedback === "up"
            ? "text-green-600 bg-green-50"
            : "text-gray-300 hover:text-gray-500 hover:bg-gray-50"
        }`}
        title="Helpful"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75 2.25 2.25 0 012.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904m10.598-9.75H14.25M5.904 18.5c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 01-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 9.953 4.167 9.5 5 9.5h1.053c.472 0 .745.556.5.96a8.958 8.958 0 00-1.302 4.665c0 1.194.232 2.333.654 3.375z" />
        </svg>
      </button>
      <button
        onClick={() => onFeedback(section, feedback === "down" ? null : "down")}
        className={`p-1 rounded transition-colors ${
          feedback === "down"
            ? "text-red-500 bg-red-50"
            : "text-gray-300 hover:text-gray-500 hover:bg-gray-50"
        }`}
        title="Not helpful"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.498 15.25H4.372c-1.026 0-1.945-.694-2.054-1.715a12.137 12.137 0 01-.068-1.285c0-2.848.992-5.464 2.649-7.521C5.287 4.247 5.886 4 6.504 4h4.016a4.5 4.5 0 011.423.23l3.114 1.04a4.5 4.5 0 001.423.23h1.294M7.498 15.25c.618 0 .991.724.725 1.282A7.471 7.471 0 007.5 19.75 2.25 2.25 0 009.75 22a.75.75 0 00.75-.75v-.633c0-.573.11-1.14.322-1.672.304-.76.93-1.33 1.653-1.715a9.04 9.04 0 002.86-2.4c.498-.634 1.226-1.08 2.032-1.08h.384m-10.253 1.5H9.7m8.075-9.75c.01.05.027.1.05.148.593 1.2.925 2.55.925 3.977 0 1.31-.269 2.56-.754 3.695" />
        </svg>
      </button>
    </div>
  );
}

function FlagCard({ flag }: { flag: RiskFlag }) {
  if (!flag.riskLevel || !flag.requirement) return null;
  const c = riskColors[flag.riskLevel] || riskColors.medium;
  return (
    <div className={`rounded-lg border ${c.border} ${c.bg} p-4`}>
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 ${c.icon}`}>
          {flag.riskLevel === "high" ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${c.badge}`}>
              {flag.riskLevel.toUpperCase()}
            </span>
            {flag.category && <span className="text-xs text-gray-500 font-medium">{flag.category}</span>}
          </div>
          <p className="text-sm font-semibold text-gray-900 mb-1">{flag.requirement}</p>
          {flag.explanation && <p className="text-sm text-gray-700 mb-2">{flag.explanation}</p>}
          {flag.suggestion && (
            <div className="bg-white/60 rounded px-3 py-2 border border-gray-200/50">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Suggestion: </span>
              <span className="text-sm text-gray-700">{flag.suggestion}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AlignmentCard({ flag }: { flag: RiskFlag }) {
  if (!flag.requirement) return null;
  return (
    <div className="rounded-lg border border-sky-200 bg-sky-50/50 p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 text-sky-500">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          {flag.category && <span className="text-xs text-sky-600 font-medium">{flag.category}</span>}
          <p className="text-sm font-semibold text-gray-900 mb-1">{flag.requirement}</p>
          {flag.explanation && <p className="text-sm text-gray-600 mb-2">{flag.explanation}</p>}
          {flag.suggestion && (
            <div className="bg-white/60 rounded px-3 py-2 border border-sky-100">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Suggestion: </span>
              <span className="text-sm text-gray-600">{flag.suggestion}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [reqText, setReqText] = useState("");
  const [market, setMarket] = useState<Market>("Philippines");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, FeedbackValue>>({});
  const [streamProgress, setStreamProgress] = useState(0);
  const [showChangelog, setShowChangelog] = useState(false);

  async function analyze() {
    if (!reqText.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setStreamProgress(0);
    setFeedback({});

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requisition: reqText, market }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Analysis failed");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let text = "";
      let chunkCount = 0;
      const streamStart = Date.now();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunkCount++;
        const chunk = decoder.decode(value, { stream: true });
        text += chunk;
        console.log(`[stream] chunk #${chunkCount}: +${chunk.length} chars (total: ${text.length}) @ ${Date.now() - streamStart}ms`);

        try {
          const partial = parsePartialJSON(text);
          if (partial && typeof partial === "object" && partial.overallScore !== undefined) {
            flushSync(() => {
              setStreamProgress(text.length);
              setResult(partial as AnalysisResult);
            });
          }
        } catch {
          // Not enough tokens to parse yet
        }
      }

      console.log(`[stream] done: ${chunkCount} chunks, ${text.length} chars, ${Date.now() - streamStart}ms`);

      try {
        const final = JSON.parse(text);
        setResult(final);
      } catch {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          setResult(JSON.parse(jsonMatch[0]));
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleFeedback(section: string, value: FeedbackValue) {
    setFeedback(prev => ({ ...prev, [section]: value }));
  }

  function loadSample() {
    setReqText(SAMPLE_REQ);
    setResult(null);
  }

  const riskFlags = result?.flags?.filter(f => f.source !== "alignment") || [];
  const alignmentFlags = result?.flags?.filter(f => f.source === "alignment") || [];

  return (
    <main className="min-h-screen">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="max-w-5xl mx-auto px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
              </svg>
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">Req Feasibility Analyzer</h1>
              <p className="text-sm text-gray-500">Pre-submission requisition review</p>
            </div>
            <button
              onClick={() => setShowChangelog(true)}
              className="text-xs text-gray-400 hover:text-gray-600 font-mono px-2 py-1 rounded hover:bg-gray-50 transition-colors"
            >
              v2.2
            </button>
          </div>
        </div>
      </div>

      {/* Changelog Modal */}
      {showChangelog && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setShowChangelog(false)}>
          <div className="absolute inset-0 bg-black/20" />
          <div
            className="relative w-full max-w-md bg-white shadow-xl h-full overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Changelog</h2>
              <button
                onClick={() => setShowChangelog(false)}
                className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-4 space-y-6">
              {CHANGELOG.map((entry) => (
                <div key={entry.version}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-bold text-gray-900">{entry.version}</span>
                    <span className="text-xs text-gray-400">{entry.date}</span>
                  </div>
                  <ul className="space-y-1.5">
                    {entry.changes.map((change, i) => (
                      <li key={i} className="text-sm text-gray-600 leading-relaxed flex gap-2">
                        <span className="text-gray-300 mt-1.5 flex-shrink-0">&bull;</span>
                        <span>{change}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Input Section */}
        <div className="bg-white rounded-xl border shadow-sm">
          <div className="p-6">
            {!reqText && !result && (
              <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                Paste a job requisition to get an instant feasibility risk assessment. The analyzer flags niche software requirements, stacked specializations, and other factors that extend time-to-fill.
              </p>
            )}
            {/* Market Selector */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm font-semibold text-gray-700">Hiring Market</span>
              <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                {MARKETS.map((m) => (
                  <button
                    key={m}
                    onClick={() => { setMarket(m); if (result) setResult(null); }}
                    className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                      market === m
                        ? "bg-indigo-600 text-white"
                        : "bg-white text-gray-600 hover:bg-gray-50"
                    } ${m !== MARKETS[0] ? "border-l border-gray-200" : ""}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between mb-4">
              <label htmlFor="req" className="text-sm font-semibold text-gray-700">
                Paste Job Requisition
              </label>
              <button
                onClick={loadSample}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Try sample req
              </button>
            </div>
            <textarea
              id="req"
              rows={12}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none resize-y"
              placeholder="Paste the full job requisition here — title, description, qualifications, screening criteria, etc."
              value={reqText}
              onChange={(e) => setReqText(e.target.value)}
            />
            <div className="mt-4 flex items-center gap-4">
              <button
                onClick={analyze}
                disabled={loading || !reqText.trim()}
                className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {streamProgress > 0 ? "Receiving analysis..." : "Analyzing..."}
                  </>
                ) : (
                  "Analyze Feasibility"
                )}
              </button>
              {reqText && !loading && (
                <button
                  onClick={() => { setReqText(""); setResult(null); setError(null); }}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="animate-fade-in bg-red-50 border border-red-200 rounded-xl p-5">
            <p className="text-sm text-red-800 font-medium">{error}</p>
            <p className="text-xs text-red-600 mt-1">
              Make sure the ANTHROPIC_API_KEY environment variable is set.
            </p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-6 animate-fade-in">
            {/* a. Score + Header */}
            {result.overallScore !== undefined && (
              <div className="bg-white rounded-xl border shadow-sm p-6">
                <div className="flex items-center mb-2">
                  <h2 className="text-lg font-bold text-gray-900">Feasibility Analysis</h2>
                  {!loading && <SectionFeedback section="score" feedback={feedback.score} onFeedback={handleFeedback} />}
                </div>
                <p className="text-xs text-gray-400 mb-6">
                  This is a directional assessment to support your review — not a final determination. Use your market knowledge and client context to validate.
                </p>
                <div className="grid md:grid-cols-[auto_1fr] gap-8 items-start">
                  <ScoreGauge score={result.overallScore} />
                  <div className="space-y-3">
                    {result.overallVerdict && (
                      <div>
                        <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Assessment</span>
                        <p className="text-base text-gray-800 mt-1">{result.overallVerdict}</p>
                      </div>
                    )}
                    {result.estimatedTimeToFill && (
                      <div>
                        <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Estimated Time-to-Fill</span>
                        <p className="text-base text-gray-800 mt-1 font-medium">{result.estimatedTimeToFill}</p>
                      </div>
                    )}
                    {result.summary && (
                      <div>
                        <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Summary</span>
                        <p className="text-sm text-gray-700 mt-1 leading-relaxed">{result.summary}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* b. Flagged Requirements (risk flags only) */}
            {riskFlags.length > 0 && (
              <div className="bg-white rounded-xl border shadow-sm p-6">
                <div className="flex items-center mb-1">
                  <h2 className="text-lg font-bold text-gray-900">
                    Flagged Requirements
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      ({riskFlags.length}{loading ? "+" : ""} found)
                    </span>
                  </h2>
                  {!loading && <SectionFeedback section="flags" feedback={feedback.flags} onFeedback={handleFeedback} />}
                </div>
                <p className="text-sm text-gray-500 mb-5">
                  Requirements that may narrow your candidate pool and extend time-to-fill.
                </p>
                <div className="space-y-4">
                  {riskFlags.map((flag, i) => (
                    <FlagCard key={i} flag={flag} />
                  ))}
                </div>
                <p className="mt-4 pt-3 border-t border-gray-100 text-[11px] font-mono text-gray-400">
                  Pool reduction estimates are directional, based on AI analysis of offshore staffing market patterns. Validate against internal pipeline data for specific roles.
                </p>
              </div>
            )}

            {/* Alignment Notes */}
            {alignmentFlags.length > 0 && !loading && (
              <div className="bg-white rounded-xl border shadow-sm p-6">
                <div className="flex items-center mb-1">
                  <h2 className="text-lg font-bold text-gray-900">Alignment Notes</h2>
                  <SectionFeedback section="alignment" feedback={feedback.alignment} onFeedback={handleFeedback} />
                </div>
                <p className="text-sm text-gray-500 mb-5">
                  Potential mismatches between job description and screening criteria.
                </p>
                <div className="space-y-4">
                  {alignmentFlags.map((flag, i) => (
                    <AlignmentCard key={i} flag={flag} />
                  ))}
                </div>
              </div>
            )}

            {/* c. Well-Calibrated Requirements */}
            {result.wellCalibratedRequirements?.length > 0 && (
              <div className="bg-white rounded-xl border shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                  </svg>
                  <h2 className="text-lg font-bold text-gray-900">Well-Calibrated Requirements</h2>
                  {!loading && <SectionFeedback section="calibrated" feedback={feedback.calibrated} onFeedback={handleFeedback} />}
                </div>
                <ul className="space-y-2">
                  {result.wellCalibratedRequirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                      </svg>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* d. Revised Screening Criteria */}
            {result.revisedScreeningCriteria && (
              <div className="bg-white rounded-xl border shadow-sm p-6">
                <div className="flex items-center mb-1">
                  <h2 className="text-lg font-bold text-gray-900">Recommended Screening Criteria</h2>
                  {!loading && <SectionFeedback section="screening" feedback={feedback.screening} onFeedback={handleFeedback} />}
                </div>
                <p className="text-sm text-gray-500 mb-5">
                  A restructured rubric you can share directly with the hiring manager.
                </p>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg border border-red-200 bg-red-50/50 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <h3 className="text-sm font-bold text-red-900 uppercase tracking-wide">Must Have</h3>
                    </div>
                    <ul className="space-y-2">
                      {(result.revisedScreeningCriteria.mustHave || []).map((item, i) => (
                        <li key={i} className="text-sm text-red-900/80 leading-relaxed">{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                      <h3 className="text-sm font-bold text-amber-900 uppercase tracking-wide">Nice to Have</h3>
                    </div>
                    <ul className="space-y-2">
                      {(result.revisedScreeningCriteria.niceToHave || []).map((item, i) => (
                        <li key={i} className="text-sm text-amber-900/80 leading-relaxed">{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-lg border border-teal-200 bg-teal-50/50 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-teal-500" />
                      <h3 className="text-sm font-bold text-teal-900 uppercase tracking-wide">Trainable</h3>
                    </div>
                    <ul className="space-y-3">
                      {(result.revisedScreeningCriteria.trainable || []).map((item, i) => (
                        <li key={i} className="text-sm text-teal-900/80">
                          <span className="leading-relaxed">{item.skill}</span>
                          {item.estimatedRampTime && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-700">
                              {item.estimatedRampTime}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* e. Recommendations */}
            {result.recommendations?.length > 0 && (
              <div className="bg-white rounded-xl border shadow-sm p-6">
                <div className="flex items-center mb-4">
                  <h2 className="text-lg font-bold text-gray-900">Recommendations</h2>
                  {!loading && <SectionFeedback section="recommendations" feedback={feedback.recommendations} onFeedback={handleFeedback} />}
                </div>
                <ul className="space-y-3">
                  {result.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                        {i + 1}
                      </span>
                      <p className="text-sm text-gray-700 leading-relaxed">{rec}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
