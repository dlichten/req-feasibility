"use client";

import { useState } from "react";

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

interface RiskFlag {
  requirement: string;
  riskLevel: "high" | "medium" | "low";
  category: string;
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

  const showEmptyState = !reqText && !result && !loading && !error;

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
        {/* Empty State */}
        {showEmptyState && (
          <div className="bg-white rounded-xl border shadow-sm p-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-indigo-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zm3.75 11.625a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Analyze a Job Requisition</h2>
            <p className="text-sm text-gray-500 max-w-lg mx-auto mb-6 leading-relaxed">
              Paste a job requisition to get an instant feasibility risk assessment. The analyzer flags niche software requirements, stacked specializations, and other factors that extend time-to-fill beyond 56 days.
            </p>
            <button
              onClick={loadSample}
              className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Try Sample Requisition
            </button>
          </div>
        )}

        {/* Input Section */}
        {(reqText || result || loading || error) && (
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
        )}

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
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Feasibility Analysis</h2>
              <div className="grid md:grid-cols-[auto_1fr] gap-8 items-start">
                <ScoreGauge score={result.overallScore} />
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Assessment</span>
                    <p className="text-base text-gray-800 mt-1">{result.overallVerdict}</p>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Estimated Time-to-Fill</span>
                    <p className="text-base text-gray-800 mt-1 font-medium">{result.estimatedTimeToFill}</p>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Summary</span>
                    <p className="text-sm text-gray-700 mt-1 leading-relaxed">{result.summary}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* b. Flagged Requirements */}
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

            {/* c. Well-Calibrated Requirements */}
            {result.wellCalibratedRequirements && result.wellCalibratedRequirements.length > 0 && (
              <div className="bg-white rounded-xl border shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                  </svg>
                  <h2 className="text-lg font-bold text-gray-900">Well-Calibrated Requirements</h2>
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
                <h2 className="text-lg font-bold text-gray-900 mb-1">Recommended Screening Criteria</h2>
                <p className="text-sm text-gray-500 mb-5">
                  A restructured rubric you can share directly with the hiring manager.
                </p>
                <div className="grid gap-4 md:grid-cols-3">
                  {/* Must Have */}
                  <div className="rounded-lg border border-red-200 bg-red-50/50 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <h3 className="text-sm font-bold text-red-900 uppercase tracking-wide">Must Have</h3>
                    </div>
                    <ul className="space-y-2">
                      {result.revisedScreeningCriteria.mustHave.map((item, i) => (
                        <li key={i} className="text-sm text-red-900/80 leading-relaxed">{item}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Nice to Have */}
                  <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                      <h3 className="text-sm font-bold text-amber-900 uppercase tracking-wide">Nice to Have</h3>
                    </div>
                    <ul className="space-y-2">
                      {result.revisedScreeningCriteria.niceToHave.map((item, i) => (
                        <li key={i} className="text-sm text-amber-900/80 leading-relaxed">{item}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Trainable */}
                  <div className="rounded-lg border border-teal-200 bg-teal-50/50 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-teal-500" />
                      <h3 className="text-sm font-bold text-teal-900 uppercase tracking-wide">Trainable</h3>
                    </div>
                    <ul className="space-y-3">
                      {result.revisedScreeningCriteria.trainable.map((item, i) => (
                        <li key={i} className="text-sm text-teal-900/80">
                          <span className="leading-relaxed">{item.skill}</span>
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-700">
                            {item.estimatedRampTime}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* e. Recommendations */}
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
