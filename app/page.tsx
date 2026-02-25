"use client";

import { useState } from "react";

const SAMPLE_REQ = `Senior Medical Billing Specialist
Open #1837
Business Unit: Healthcare Services
Work Setup: Work From Home
Category: Healthcare
Number of Openings: 2
Client:
Supervisor: Darrel John Concepcion
Added: 2 months ago

Job Summary:
The Senior Medical Billing Specialist is responsible in supporting U.S. based Durable Medical Equipment (DME) billing operations by ensuring accurate claim preparation, documentation review, and payer compliance prior to submission. The role works closely with Intake, Confirmations, and Senior Billing teams to reduce billing errors and delays.

Job Description:
• Reviews prescriptions, CMNs, chart notes, and signatures for completeness and accuracy.
• Validates documentation against Medicare, Medicaid, Medicare Advantage, and commercial payer requirements.
• Identifies and resolves documentation gaps prior to claim submission.
• Reviews insurance eligibility, coverage, authorizations, and benefit requirements.
• Confirms frequency limits, payer-specific rules, and authorization needs.
• Identifies and escalates payer coordination issues.
• Reviews HCPCS codes and modifier usage for DME product lines including Orthopedic Bracing, Wound Care, and CGM.
• Ensures billing accuracy aligned with payer policies and internal workflows.
• Escalates complex billing or coding issues appropriately.
• Maintains accurate order records and billing data in Brightree.
• Supports order tracking, billing preparation, and claim workflows.
• Ensures data consistency and integrity across systems.
• Communicates with payers to clarify documentation requirements or claim status.
• Supports claim follow-ups and documentation requests.
• Assists with appeals, denials, and resubmissions under senior billing guidance.
• Maintains internal tracking tools including error logs and on-hold reports.
• Ensures timely follow-up to minimize billing delays.

Qualifications:
• Has working knowledge of U.S. insurance billing processes.
• Experience supporting U.S. insurance billing (Medicare, Medicaid, Medicare Advantage, Commercial).
• Experience supporting multiple DME product lines (Orthopedic Bracing, Wound Care, CGM).
• Applies expertise in HCPCS coding, modifiers, CMNs, and medical necessity documentation.
• Experience collaborating with Intake, Confirmation, and Senior Billing teams.
• Exposure to appeals and denial management workflows.
• Maintains high accuracy, attention to detail, and documentation quality.
• Manages multiple tasks while meeting billing timelines.
• Reliable internet connection and secure remote workspace.
• Work independently in a remote setup.
• Works effectively with limited supervision.
• Clear and coherent both written and verbal communication skills in English, to effectively collaborate with internal teams and payer representatives.

Screening Criteria:
• Minimum of three (3) years of healthcare billing experience.
• Minimum of one (1) year of DME insurance billing with focus on orthopedic bracing and wound care experience.
• Experience using Brightree cloud-based software.
• Must have a stable employment history.`;

interface RiskFlag {
  requirement: string;
  riskLevel: "high" | "medium" | "low";
  category: string;
  explanation: string;
  suggestion: string;
}

interface AnalysisResult {
  overallScore: number;
  overallVerdict: string;
  estimatedImpact: string;
  summary: string;
  flags: RiskFlag[];
  recommendations: string[];
}

const riskColors = {
  high: { bg: "bg-red-50", border: "border-red-200", badge: "bg-red-100 text-red-800", icon: "text-red-500" },
  medium: { bg: "bg-amber-50", border: "border-amber-200", badge: "bg-amber-100 text-amber-800", icon: "text-amber-500" },
  low: { bg: "bg-blue-50", border: "border-blue-200", badge: "bg-blue-100 text-blue-800", icon: "text-blue-500" },
};

function ScoreGauge({ score }: { score: number }) {
  const color =
    score >= 70 ? "text-red-500" : score >= 40 ? "text-amber-500" : "text-green-500";
  const label =
    score >= 70 ? "High Risk" : score >= 40 ? "Medium Risk" : "Low Risk";
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-36 h-36">
        <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" stroke="#e5e7eb" strokeWidth="8" />
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
            className={`${color} transition-all duration-1000 ease-out`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-bold ${color}`}>{score}</span>
          <span className="text-xs text-gray-500">/100</span>
        </div>
      </div>
      <span className={`text-sm font-semibold ${color}`}>{label}</span>
    </div>
  );
}

export default function Home() {
  const [reqText, setReqText] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function analyze() {
    if (!reqText.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requisition: reqText }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Analysis failed");
      }

      const data = await res.json();
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function loadSample() {
    setReqText(SAMPLE_REQ);
    setResult(null);
  }

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
            <div>
              <h1 className="text-xl font-bold text-gray-900">Req Feasibility Analyzer</h1>
              <p className="text-sm text-gray-500">Flag risky requirements before they delay your hiring</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Input Section */}
        <div className="bg-white rounded-xl border shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <label htmlFor="req" className="text-sm font-semibold text-gray-700">
                Paste Job Requisition
              </label>
              <button
                onClick={loadSample}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Load sample req
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
                    Analyzing...
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
            {/* Overview */}
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Feasibility Analysis</h2>
              <div className="grid md:grid-cols-[auto_1fr] gap-8 items-start">
                <ScoreGauge score={result.overallScore} />
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Verdict</span>
                    <p className="text-base text-gray-800 mt-1">{result.overallVerdict}</p>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Time-to-Fill Impact</span>
                    <p className="text-base text-gray-800 mt-1">{result.estimatedImpact}</p>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Summary</span>
                    <p className="text-sm text-gray-700 mt-1 leading-relaxed">{result.summary}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Flags */}
            {result.flags.length > 0 && (
              <div className="bg-white rounded-xl border shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-1">
                  Flagged Requirements
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({result.flags.length} found)
                  </span>
                </h2>
                <p className="text-sm text-gray-500 mb-5">
                  Requirements that may narrow your candidate pool and extend time-to-fill.
                </p>
                <div className="space-y-4">
                  {result.flags.map((flag, i) => {
                    const c = riskColors[flag.riskLevel];
                    return (
                      <div key={i} className={`rounded-lg border ${c.border} ${c.bg} p-4`}>
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
                              <span className="text-xs text-gray-500 font-medium">{flag.category}</span>
                            </div>
                            <p className="text-sm font-semibold text-gray-900 mb-1">{flag.requirement}</p>
                            <p className="text-sm text-gray-700 mb-2">{flag.explanation}</p>
                            <div className="bg-white/60 rounded px-3 py-2 border border-gray-200/50">
                              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Suggestion: </span>
                              <span className="text-sm text-gray-700">{flag.suggestion}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {result.recommendations.length > 0 && (
              <div className="bg-white rounded-xl border shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Recommendations</h2>
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
