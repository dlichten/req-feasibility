"use client";

import { useState, useRef, useEffect } from "react";
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

// === Location & Work Setup Types ===

interface LocationOption {
  id: string;
  label: string;
  isCountryWide: boolean;
}

const LOCATIONS: Record<string, LocationOption[]> = {
  Philippines: [
    { id: "ph-all", label: "All Philippines (remote)", isCountryWide: true },
    { id: "ph-angeles", label: "Angeles", isCountryWide: false },
    { id: "ph-ortigas", label: "Ortigas", isCountryWide: false },
    { id: "ph-cebu", label: "Cebu", isCountryWide: false },
    { id: "ph-davao", label: "Davao", isCountryWide: false },
  ],
  Colombia: [
    { id: "co-all", label: "All Colombia (remote)", isCountryWide: true },
    { id: "co-bogota", label: "Bogot\u00e1", isCountryWide: false },
  ],
  India: [
    { id: "in-remote", label: "India (remote)", isCountryWide: true },
  ],
};

type WorkSetup = "Work From Home" | "Hybrid" | "Fully On-Site";

const WORK_SETUPS: WorkSetup[] = ["Work From Home", "Hybrid", "Fully On-Site"];

const SHIFT_TYPES = [
  "Morning (Weekends Off)",
  "Morning (Weekdays Off)",
  "Morning (1 Weekday & 1 Weekend Off)",
  "Midshift (Weekends Off)",
  "Midshift (Weekdays Off)",
  "Midshift (1 Weekday & 1 Weekend Off)",
  "Nightshift (Weekends Off)",
  "Nightshift (Weekdays Off)",
  "Nightshift (1 Weekday & 1 Weekend Off)",
  "Rotational",
] as const;

type ShiftType = (typeof SHIFT_TYPES)[number];

const CURRENCY_BY_COUNTRY: Record<string, { code: string; symbol: string }> = {
  Philippines: { code: "PHP", symbol: "₱" },
  Colombia: { code: "COP", symbol: "$" },
  India: { code: "INR", symbol: "₹" },
};

function getLocationById(id: string): LocationOption | undefined {
  for (const sites of Object.values(LOCATIONS)) {
    const found = sites.find(s => s.id === id);
    if (found) return found;
  }
  return undefined;
}

function getCountryForId(id: string): string | undefined {
  for (const [country, sites] of Object.entries(LOCATIONS)) {
    if (sites.some(s => s.id === id)) return country;
  }
  return undefined;
}

// === Analysis Types ===

interface RiskFlag {
  requirement: string;
  riskLevel: "high" | "medium" | "low";
  category: string;
  source?: "screening_criteria" | "qualifications";
  explanation: string;
  suggestion: string;
}

interface AlignmentNote {
  requirement: string;
  category: string;
  explanation: string;
  suggestion: string;
}

interface TrainableSkill {
  skill: string;
  estimatedRampTime: string;
}

interface CompensationAssessment {
  rating: "highly_competitive" | "competitive" | "below_market" | "significantly_below_market";
  explanation: string;
  marketRange: string;
  siteVariance?: string;
}

interface LocationResult {
  location: string;
  workSetup: string;
  feasibilityScore: number;
  verdict: string;
  estimatedTimeToFill: string;
  baselineTimeToFill: string;
  narrative: string;
  locationSpecificFlags: RiskFlag[];
  compensationAssessment?: CompensationAssessment;
}

interface SharedAnalysis {
  flags: RiskFlag[];
  alignmentNotes: AlignmentNote[];
  wellCalibratedRequirements: string[];
  revisedScreeningCriteria: {
    mustHave: string[];
    niceToHave: string[];
    trainable: TrainableSkill[];
  };
  recommendations: string[];
}

interface AnalysisResponse {
  locationResults: LocationResult[];
  sharedAnalysis: SharedAnalysis;
}

// === Constants ===

const CHANGELOG = [
  {
    version: "v2.11.5",
    date: "Feb 26, 2026",
    changes: [
      "Removed redundant market range from comp assessment bullets — metadata line already shows it",
      "Flattened comp section styling: subtle divider instead of inner card",
      "Reordered comp metadata (market range, site variance) above explanation bullets",
    ],
  },
  {
    version: "v2.11.4",
    date: "Feb 26, 2026",
    changes: [
      "All analysis text now uses bullet points instead of dense paragraphs for easier scanning across all sections",
    ],
  },
  {
    version: "v2.11.3",
    date: "Feb 26, 2026",
    changes: [
      "Input form collapses to a compact summary bar during and after analysis, bringing results above the fold",
      "Expand/edit button restores full input form for re-runs",
    ],
  },
  {
    version: "v2.11.2",
    date: "Feb 26, 2026",
    changes: [
      "Button now shows \"Analyzing...\" while running and changes to \"Re-analyze\" on completion",
      "Added \"Analysis complete \u2193\" indicator near the button that scrolls to results on click",
    ],
  },
  {
    version: "v2.11.1",
    date: "Feb 26, 2026",
    changes: [
      "Fixed compensation assessment consistency — now uses explicit threshold rules instead of interpretive assessment",
      "Set API temperature to 0 to reduce variance across runs",
      "Comp assessment now shows market range comparison explicitly",
    ],
  },
  {
    version: "v2.11",
    date: "Feb 26, 2026",
    changes: [
      "Updated color palette to Connext brand colors (navy, warm orange, gold)",
      "Added Connext logo to header",
      "Updated browser favicon to Connext icon",
      "Replaced generic purple/indigo with brand identity colors throughout",
    ],
  },
  {
    version: "v2.10",
    date: "Feb 25, 2026",
    changes: [
      "Added optional compensation input with auto-detected currency by country",
      "Analysis now assesses whether offered salary is competitive for the role type and market",
      "Comp assessment notes site-level variance (e.g., competitive in Davao but below market in Ortigas)",
      "Added \"Compensation Constraint\" as a new flag category",
    ],
  },
  {
    version: "v2.9.1",
    date: "Feb 25, 2026",
    changes: [
      "Added Shift Type selector matching ATS shift options",
      "Analysis now factors in shift desirability and its compounding effect on candidate pool",
      "Added \"Shift Type Constraint\" as a new flag category",
    ],
  },
  {
    version: "v2.9",
    date: "Feb 25, 2026",
    changes: [
      "Thumbs up/down on overall assessment now saves feedback to Notion for calibration tracking",
      "Per-flag agree/disagree thumbs on flagged requirements for fine-grained calibration data",
      "Gentle nudge prompts after 15 seconds or scrolling to recommendations",
      "Optional text input for notes when providing feedback",
    ],
  },
  {
    version: "v2.8.2",
    date: "Feb 25, 2026",
    changes: [
      "Added skeleton loading states with contextual messages for each section during analysis",
    ],
  },
  {
    version: "v2.8.1",
    date: "Feb 25, 2026",
    changes: [
      "Fixed score/verdict label mismatch \u2014 verdict text now always matches the score bucket label exactly",
    ],
  },
  {
    version: "v2.8",
    date: "Feb 25, 2026",
    changes: [
      "Removed hardcoded 56-day benchmark \u2014 tool now estimates role-specific baseline fill times",
      "Assessment now shows both estimated TTF and baseline TTF so users can see the gap caused by overly specific requirements",
    ],
  },
  {
    version: "v2.7.3",
    date: "Feb 25, 2026",
    changes: [
      "Moved location-specific notes into a \"View details\" panel accessible from each location in the comparison table",
      "Removed location-specific notes as a standalone page section \u2014 shorter, more scannable results",
      "Fixed rendering order issue where location notes painted before flagged requirements",
    ],
  },
  {
    version: "v2.7.2",
    date: "Feb 25, 2026",
    changes: [
      "Restored progressive streaming: results now paint section-by-section as the analysis arrives",
      "Fixed layout stability: sections fade in top-to-bottom without pushing visible content around",
      "Reordered response schema so scores/comparison render before flags and recommendations",
    ],
  },
  {
    version: "v2.7.1",
    date: "Feb 25, 2026",
    changes: [
      "Location-specific notes now appear below alignment notes instead of at the bottom of the page",
      "Fixed streaming display issue where results would jump during rendering",
      "Fixed location selector: can now freely toggle between \u201cAll Philippines\u201d and specific PH sites without workaround",
    ],
  },
  {
    version: "v2.7",
    date: "Feb 25, 2026",
    changes: [
      "Multi-location results now show shared analysis once (flagged requirements, alignment notes, revised criteria, recommendations) instead of repeating per location",
      "Each location gets a compact narrative explaining its specific score and any location-only flags",
      "Significantly shorter and more scannable results for multi-location comparisons",
    ],
  },
  {
    version: "v2.6",
    date: "Feb 25, 2026",
    changes: [
      "Added site-level location selection (Angeles, Ortigas, Cebu, Davao, Bogot\u00e1) with multi-select for side-by-side comparison",
      "Added Work Setup selector (Work From Home, Hybrid, Fully On-Site) \u2014 analysis now factors in how work setup affects the talent pool",
      "Multi-location results show side-by-side score cards (2-3 locations) or summary table (4+)",
      "Auto-detects work setup and site mentions when pasting a requisition",
    ],
  },
  {
    version: "v2.5",
    date: "Feb 25, 2026",
    changes: [
      "Simplified analysis language for global recruiting teams \u2014 removed analytical jargon while keeping domain terminology and actionable specificity",
    ],
  },
  {
    version: "v2.4",
    date: "Feb 25, 2026",
    changes: [
      "Inverted scoring: now a Feasibility Score (higher = more fillable) instead of a Risk Score (higher = worse)",
      "Updated score thresholds and labels to match",
      "Donut chart color now green (high feasibility) to red (low feasibility)",
    ],
  },
  {
    version: "v2.3",
    date: "Feb 25, 2026",
    changes: [
      "Fixed scoring logic: a single near-disqualifying requirement now floors the score at 85+ instead of being averaged down by reasonable requirements",
      "Revised scoring bands: added 85-100 \"Critical / Near-impossible\" tier",
      "Model now explicitly identifies bottleneck criteria in the summary",
    ],
  },
  {
    version: "v2.2",
    date: "Feb 25, 2026",
    changes: [
      "Analysis now scores only Qualifications and Screening Criteria for feasibility (job description tasks are no longer treated as hiring constraints)",
      '"Alignment Notes" section flagging mismatches between JD and screening criteria',
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
      '"Well-Calibrated Requirements" section showing what\'s appropriately scoped',
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

const RISK_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

function sortFlags<T extends { riskLevel: string }>(flags: T[]): T[] {
  return [...flags].sort((a, b) => (RISK_ORDER[a.riskLevel] ?? 3) - (RISK_ORDER[b.riskLevel] ?? 3));
}

function BulletText({ text, className }: { text: string; className?: string }) {
  if (!text) return null;
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const bullets = lines.filter(l => l.startsWith("•"));
  if (bullets.length >= 2) {
    return (
      <ul className={`space-y-1 ${className || ""}`}>
        {lines.map((line, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="text-gray-400 flex-shrink-0 mt-px">•</span>
            <span>{line.replace(/^•\s*/, "")}</span>
          </li>
        ))}
      </ul>
    );
  }
  return <p className={className}>{text}</p>;
}

const riskColors = {
  high: { bg: "bg-red-50", border: "border-red-200", badge: "bg-red-100 text-red-800", icon: "text-red-500" },
  medium: { bg: "bg-amber-50", border: "border-amber-200", badge: "bg-amber-100 text-amber-800", icon: "text-amber-500" },
  low: { bg: "bg-blue-50", border: "border-blue-200", badge: "bg-blue-100 text-blue-800", icon: "text-blue-500" },
};

function getScoreBand(score: number) {
  if (score >= 80) return { label: "High Feasibility", color: "text-green-600", bg: "bg-green-500", track: "text-green-100" };
  if (score >= 55) return { label: "Moderate Feasibility", color: "text-amber-500", bg: "bg-amber-500", track: "text-amber-100" };
  if (score >= 25) return { label: "Low Feasibility", color: "text-orange-500", bg: "bg-orange-500", track: "text-orange-100" };
  if (score >= 16) return { label: "Very Low Feasibility", color: "text-red-500", bg: "bg-red-500", track: "text-red-100" };
  return { label: "Near-Impossible", color: "text-red-700", bg: "bg-red-600", track: "text-red-100" };
}

const compRatingStyles: Record<string, { label: string; color: string; bg: string }> = {
  highly_competitive: { label: "Highly Competitive", color: "text-green-700", bg: "bg-green-50 border-green-200" },
  competitive: { label: "Competitive", color: "text-green-600", bg: "bg-green-50 border-green-200" },
  below_market: { label: "Below Market", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  significantly_below_market: { label: "Significantly Below Market", color: "text-red-700", bg: "bg-red-50 border-red-200" },
};

// === Components ===

function ScoreGauge({ score, compact }: { score: number; compact?: boolean }) {
  const band = getScoreBand(score);
  const size = compact ? "w-28 h-28" : "w-36 h-36";
  const radius = compact ? 40 : 54;
  const viewBox = compact ? "0 0 90 90" : "0 0 120 120";
  const center = compact ? 45 : 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`relative ${size}`}>
        <svg className={`${size} -rotate-90`} viewBox={viewBox}>
          <circle cx={center} cy={center} r={radius} fill="none" stroke="currentColor" strokeWidth={compact ? 6 : 8} className={band.track} />
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={compact ? 6 : 8}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={`${band.color} transition-all duration-1000 ease-out`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`${compact ? "text-2xl" : "text-3xl"} font-bold ${band.color}`}>{score}</span>
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

function FlagCard({ flag, flagFeedback, onFlagFeedback }: {
  flag: RiskFlag;
  flagFeedback?: "agree" | "disagree" | null;
  onFlagFeedback?: (requirement: string, value: "agree" | "disagree" | null) => void;
}) {
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
            {onFlagFeedback && (
              <div className="flex items-center gap-0.5 ml-auto">
                <button
                  onClick={() => onFlagFeedback(flag.requirement, flagFeedback === "agree" ? null : "agree")}
                  className={`p-0.5 rounded transition-colors ${
                    flagFeedback === "agree"
                      ? "text-green-600 bg-green-50"
                      : "text-gray-300 hover:text-gray-500 hover:bg-gray-50"
                  }`}
                  title="Agree with this flag"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75 2.25 2.25 0 012.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904m10.598-9.75H14.25M5.904 18.5c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 01-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 9.953 4.167 9.5 5 9.5h1.053c.472 0 .745.556.5.96a8.958 8.958 0 00-1.302 4.665c0 1.194.232 2.333.654 3.375z" />
                  </svg>
                </button>
                <button
                  onClick={() => onFlagFeedback(flag.requirement, flagFeedback === "disagree" ? null : "disagree")}
                  className={`p-0.5 rounded transition-colors ${
                    flagFeedback === "disagree"
                      ? "text-red-500 bg-red-50"
                      : "text-gray-300 hover:text-gray-500 hover:bg-gray-50"
                  }`}
                  title="Disagree with this flag"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.498 15.25H4.372c-1.026 0-1.945-.694-2.054-1.715a12.137 12.137 0 01-.068-1.285c0-2.848.992-5.464 2.649-7.521C5.287 4.247 5.886 4 6.504 4h4.016a4.5 4.5 0 011.423.23l3.114 1.04a4.5 4.5 0 001.423.23h1.294M7.498 15.25c.618 0 .991.724.725 1.282A7.471 7.471 0 007.5 19.75 2.25 2.25 0 009.75 22a.75.75 0 00.75-.75v-.633c0-.573.11-1.14.322-1.672.304-.76.93-1.33 1.653-1.715a9.04 9.04 0 002.86-2.4c.498-.634 1.226-1.08 2.032-1.08h.384m-10.253 1.5H9.7m8.075-9.75c.01.05.027.1.05.148.593 1.2.925 2.55.925 3.977 0 1.31-.269 2.56-.754 3.695" />
                  </svg>
                </button>
              </div>
            )}
          </div>
          <p className="text-sm font-semibold text-gray-900 mb-1">{flag.requirement}</p>
          {flag.explanation && <BulletText text={flag.explanation} className="text-sm text-gray-700 mb-2" />}
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

function AlignmentCard({ note, noteFeedback, onNoteFeedback }: {
  note: AlignmentNote;
  noteFeedback?: "agree" | "disagree" | null;
  onNoteFeedback?: (requirement: string, value: "agree" | "disagree" | null) => void;
}) {
  if (!note.requirement) return null;
  return (
    <div className="rounded-lg border border-sky-200 bg-sky-50/50 p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 text-sky-500">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {note.category && <span className="text-xs text-sky-600 font-medium">{note.category}</span>}
            {onNoteFeedback && (
              <div className="flex items-center gap-0.5 ml-auto">
                <button
                  onClick={() => onNoteFeedback(note.requirement, noteFeedback === "agree" ? null : "agree")}
                  className={`p-0.5 rounded transition-colors ${
                    noteFeedback === "agree"
                      ? "text-green-600 bg-green-50"
                      : "text-gray-300 hover:text-gray-500 hover:bg-gray-50"
                  }`}
                  title="Agree with this note"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75 2.25 2.25 0 012.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904m10.598-9.75H14.25M5.904 18.5c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 01-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 9.953 4.167 9.5 5 9.5h1.053c.472 0 .745.556.5.96a8.958 8.958 0 00-1.302 4.665c0 1.194.232 2.333.654 3.375z" />
                  </svg>
                </button>
                <button
                  onClick={() => onNoteFeedback(note.requirement, noteFeedback === "disagree" ? null : "disagree")}
                  className={`p-0.5 rounded transition-colors ${
                    noteFeedback === "disagree"
                      ? "text-red-500 bg-red-50"
                      : "text-gray-300 hover:text-gray-500 hover:bg-gray-50"
                  }`}
                  title="Disagree with this note"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.498 15.25H4.372c-1.026 0-1.945-.694-2.054-1.715a12.137 12.137 0 01-.068-1.285c0-2.848.992-5.464 2.649-7.521C5.287 4.247 5.886 4 6.504 4h4.016a4.5 4.5 0 011.423.23l3.114 1.04a4.5 4.5 0 001.423.23h1.294M7.498 15.25c.618 0 .991.724.725 1.282A7.471 7.471 0 007.5 19.75 2.25 2.25 0 009.75 22a.75.75 0 00.75-.75v-.633c0-.573.11-1.14.322-1.672.304-.76.93-1.33 1.653-1.715a9.04 9.04 0 002.86-2.4c.498-.634 1.226-1.08 2.032-1.08h.384m-10.253 1.5H9.7m8.075-9.75c.01.05.027.1.05.148.593 1.2.925 2.55.925 3.977 0 1.31-.269 2.56-.754 3.695" />
                  </svg>
                </button>
              </div>
            )}
          </div>
          <p className="text-sm font-semibold text-gray-900 mb-1">{note.requirement}</p>
          {note.explanation && <BulletText text={note.explanation} className="text-sm text-gray-600 mb-2" />}
          {note.suggestion && (
            <div className="bg-white/60 rounded px-3 py-2 border border-sky-100">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Suggestion: </span>
              <span className="text-sm text-gray-600">{note.suggestion}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionSkeleton({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-6">
      <h2 className="text-lg font-bold text-gray-300">{title}</h2>
      <div className="flex items-center gap-2 mt-3">
        <div className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-pulse" />
        <p className="text-xs text-gray-400">{message}</p>
      </div>
    </div>
  );
}

function OverallFeedback({
  overallFeedback,
  onThumb,
  feedbackNotes,
  onNotesChange,
  onSubmit,
  feedbackSent,
  feedbackNudge,
  showInput,
}: {
  overallFeedback: FeedbackValue;
  onThumb: (value: FeedbackValue) => void;
  feedbackNotes: string;
  onNotesChange: (v: string) => void;
  onSubmit: () => void;
  feedbackSent: boolean;
  feedbackNudge: boolean;
  showInput: boolean;
}) {
  return (
    <div className="ml-auto flex flex-col items-end">
      <div className="flex items-center gap-1.5">
        {feedbackSent && <span className="text-xs text-gray-400 mr-1">Feedback saved</span>}
        {!feedbackSent && feedbackNudge && !overallFeedback && (
          <span className="text-xs text-gray-400 mr-1">Was this accurate?</span>
        )}
        <button
          onClick={() => onThumb(overallFeedback === "up" ? null : "up")}
          disabled={feedbackSent}
          className={`p-1 rounded transition-colors ${
            overallFeedback === "up"
              ? "text-green-600 bg-green-50"
              : feedbackNudge && !overallFeedback
                ? "text-gray-400 hover:text-gray-500 hover:bg-gray-50 animate-pulse"
                : "text-gray-300 hover:text-gray-500 hover:bg-gray-50"
          } ${feedbackSent ? "opacity-60 cursor-default" : ""}`}
          title="Accurate"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75 2.25 2.25 0 012.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904m10.598-9.75H14.25M5.904 18.5c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 01-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 9.953 4.167 9.5 5 9.5h1.053c.472 0 .745.556.5.96a8.958 8.958 0 00-1.302 4.665c0 1.194.232 2.333.654 3.375z" />
          </svg>
        </button>
        <button
          onClick={() => onThumb(overallFeedback === "down" ? null : "down")}
          disabled={feedbackSent}
          className={`p-1 rounded transition-colors ${
            overallFeedback === "down"
              ? "text-red-500 bg-red-50"
              : feedbackNudge && !overallFeedback
                ? "text-gray-400 hover:text-gray-500 hover:bg-gray-50 animate-pulse"
                : "text-gray-300 hover:text-gray-500 hover:bg-gray-50"
          } ${feedbackSent ? "opacity-60 cursor-default" : ""}`}
          title="Not accurate"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.498 15.25H4.372c-1.026 0-1.945-.694-2.054-1.715a12.137 12.137 0 01-.068-1.285c0-2.848.992-5.464 2.649-7.521C5.287 4.247 5.886 4 6.504 4h4.016a4.5 4.5 0 011.423.23l3.114 1.04a4.5 4.5 0 001.423.23h1.294M7.498 15.25c.618 0 .991.724.725 1.282A7.471 7.471 0 007.5 19.75 2.25 2.25 0 009.75 22a.75.75 0 00.75-.75v-.633c0-.573.11-1.14.322-1.672.304-.76.93-1.33 1.653-1.715a9.04 9.04 0 002.86-2.4c.498-.634 1.226-1.08 2.032-1.08h.384m-10.253 1.5H9.7m8.075-9.75c.01.05.027.1.05.148.593 1.2.925 2.55.925 3.977 0 1.31-.269 2.56-.754 3.695" />
          </svg>
        </button>
      </div>
      {showInput && !feedbackSent && (
        <div className="mt-3 w-full max-w-sm flex gap-2">
          <input
            type="text"
            value={feedbackNotes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Optional: what was off?"
            className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:border-[#071776] focus:ring-1 focus:ring-[#071776]/20 focus:outline-none"
          />
          <button
            onClick={onSubmit}
            className="text-sm font-medium text-white bg-[#071776] hover:bg-[#050f55] px-3 py-1.5 rounded-lg transition-colors"
          >
            Submit
          </button>
        </div>
      )}
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const band = getScoreBand(score);
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-bold ${band.color}`}>
      {score}
    </span>
  );
}

// === Main Component ===

export default function Home() {
  const [reqText, setReqText] = useState("");
  const [selectedLocations, setSelectedLocations] = useState<string[]>(["ph-all"]);
  const [workSetup, setWorkSetup] = useState<WorkSetup>("Work From Home");
  const [shiftType, setShiftType] = useState<ShiftType>("Morning (Weekends Off)");
  const [compensation, setCompensation] = useState<Record<string, { min: string; max: string }>>({});
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, FeedbackValue>>({});
  const [streamProgress, setStreamProgress] = useState(0);
  const [showChangelog, setShowChangelog] = useState(false);
  const [detailLocation, setDetailLocation] = useState<LocationResult | null>(null);
  const [showCompleteIndicator, setShowCompleteIndicator] = useState(false);
  const [inputCollapsed, setInputCollapsed] = useState(false);
  const prevTextLenRef = useRef(0);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Feedback loop state
  const [overallFeedback, setOverallFeedback] = useState<FeedbackValue>(null);
  const [flagFeedbackState, setFlagFeedbackState] = useState<Record<string, "agree" | "disagree" | null>>({});
  const [feedbackNotes, setFeedbackNotes] = useState("");
  const [showFeedbackInput, setShowFeedbackInput] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [feedbackNudge, setFeedbackNudge] = useState(false);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recommendationsRef = useRef<HTMLDivElement>(null);

  // Auto-detect work setup and locations from pasted text
  useEffect(() => {
    const jump = reqText.length - prevTextLenRef.current;
    prevTextLenRef.current = reqText.length;
    if (jump < 50) return;

    const lower = reqText.toLowerCase();

    if (lower.includes("work setup: work from home") || lower.includes("work setup: wfh")) {
      setWorkSetup("Work From Home");
    } else if (lower.includes("work setup: hybrid")) {
      setWorkSetup("Hybrid");
    } else if (lower.includes("work setup: on-site") || lower.includes("work setup: fully on-site") || lower.includes("work setup: onsite")) {
      setWorkSetup("Fully On-Site");
    }

    const siteMap: Record<string, string> = {
      davao: "ph-davao",
      ortigas: "ph-ortigas",
      angeles: "ph-angeles",
      cebu: "ph-cebu",
      "bogota": "co-bogota",
      "bogot\u00e1": "co-bogota",
    };

    const detected: string[] = [];
    for (const [keyword, id] of Object.entries(siteMap)) {
      if (lower.includes(keyword)) {
        detected.push(id);
      }
    }
    if (detected.length > 0) {
      setSelectedLocations(detected);
    }
  }, [reqText]);

  // Nudge timing: 15s timer or scroll to recommendations
  useEffect(() => {
    if (loading || !result) return;

    let nudgeTimer: ReturnType<typeof setTimeout> | null = null;
    let observer: IntersectionObserver | null = null;
    let nudged = false;

    const triggerNudge = () => {
      if (nudged) return;
      nudged = true;
      setFeedbackNudge(true);
      if (nudgeTimer) clearTimeout(nudgeTimer);
      if (observer) observer.disconnect();
    };

    nudgeTimer = setTimeout(triggerNudge, 15000);

    if (recommendationsRef.current) {
      observer = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) triggerNudge(); },
        { threshold: 0.5 }
      );
      observer.observe(recommendationsRef.current);
    }

    return () => {
      if (nudgeTimer) clearTimeout(nudgeTimer);
      if (observer) observer.disconnect();
    };
  }, [loading, result]);

  // Auto-dismiss completion indicator after 10s or on scroll
  useEffect(() => {
    if (!showCompleteIndicator) return;

    const timer = setTimeout(() => setShowCompleteIndicator(false), 10000);
    const onScroll = () => setShowCompleteIndicator(false);
    window.addEventListener("scroll", onScroll, { once: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    };
  }, [showCompleteIndicator]);

  function toggleLocation(id: string) {
    const location = getLocationById(id);
    if (!location) return;

    setSelectedLocations(prev => {
      const isSelected = prev.includes(id);

      if (isSelected) {
        return prev.filter(x => x !== id);
      }

      const country = getCountryForId(id);
      if (!country) return [...prev, id];

      const countrySites = LOCATIONS[country];
      const countryWide = countrySites.find(s => s.isCountryWide);

      if (location.isCountryWide) {
        const countryIds = countrySites.map(s => s.id);
        return [...prev.filter(x => !countryIds.includes(x)), id];
      } else {
        const filtered = countryWide ? prev.filter(x => x !== countryWide.id) : prev;
        return [...filtered, id];
      }
    });

    if (result) setResult(null);
  }

  const showIndiaWarning = selectedLocations.includes("in-remote") && workSetup !== "Work From Home";

  const selectedCountries = Array.from(new Set(selectedLocations.map(id => getCountryForId(id)).filter((c): c is string => !!c)));

  async function analyze() {
    if (!reqText.trim() || selectedLocations.length === 0) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setStreamProgress(0);
    setFeedback({});
    setDetailLocation(null);
    setShowCompleteIndicator(false);
    setInputCollapsed(true);
    setOverallFeedback(null);
    setFlagFeedbackState({});
    setFeedbackNotes("");
    setShowFeedbackInput(false);
    setFeedbackSent(false);
    setShowToast(false);
    setFeedbackNudge(false);
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = null;
    }

    const locationLabels = selectedLocations
      .map(id => getLocationById(id)?.label)
      .filter(Boolean) as string[];

    const compEntries: Record<string, { min: number; max: number }> = {};
    for (const [country, val] of Object.entries(compensation)) {
      const min = parseInt(val.min, 10);
      const max = parseInt(val.max, 10);
      if (min > 0 || max > 0) {
        const cur = CURRENCY_BY_COUNTRY[country];
        if (cur) compEntries[cur.code] = { min: min || 0, max: max || 0 };
      }
    }

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requisition: reqText,
          locations: locationLabels,
          workSetup,
          shiftType,
          compensation: Object.keys(compEntries).length > 0 ? compEntries : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Analysis failed");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let text = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setStreamProgress(text.length);

        const jsonStart = text.indexOf("{");
        if (jsonStart < 0) continue;

        try {
          const partial = parsePartialJSON(text.slice(jsonStart));
          if (partial && typeof partial === "object" && partial.locationResults?.[0]?.feasibilityScore !== undefined) {
            flushSync(() => {
              setResult(partial as AnalysisResponse);
            });
          }
        } catch {
          // partial-json can't parse yet
        }
      }

      try {
        const jsonStart = text.indexOf("{");
        const final = JSON.parse(jsonStart >= 0 ? text.slice(jsonStart) : text);
        setResult(final);
        setShowCompleteIndicator(true);
      } catch {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          setResult(JSON.parse(jsonMatch[0]));
          setShowCompleteIndicator(true);
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
    setSelectedLocations(["ph-all"]);
    setWorkSetup("Work From Home");
    setShiftType("Nightshift (Weekends Off)");
    setCompensation({ Philippines: { min: "38000", max: "45000" } });
    setResult(null);
  }

  function extractReqMeta(text: string) {
    const lines = text.trim().split("\n");
    const title = lines[0]?.trim() || "Untitled";
    const numMatch = text.match(/#(\d+)/);
    const reqNumber = numMatch ? `#${numMatch[1]}` : "";
    return { title, reqNumber };
  }

  function handleOverallFeedback(value: FeedbackValue) {
    if (feedbackSent) return;
    setOverallFeedback(value);
    setShowFeedbackInput(value !== null);
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    if (value !== null) {
      feedbackTimerRef.current = setTimeout(() => {
        submitFeedback(value);
      }, 3000);
    }
  }

  function handleFlagFeedback(requirement: string, value: "agree" | "disagree" | null) {
    setFlagFeedbackState(prev => ({ ...prev, [requirement]: value }));
  }

  async function submitFeedback(thumbOverride?: FeedbackValue) {
    const thumb = thumbOverride ?? overallFeedback;
    if (!thumb || feedbackSent || !result) return;
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = null;
    }
    setFeedbackSent(true);

    const { title, reqNumber } = extractReqMeta(reqText);
    const locationLabels = selectedLocations
      .map(id => getLocationById(id)?.label)
      .filter(Boolean) as string[];
    const firstLoc = result.locationResults?.[0];

    const filteredFlagFeedback: Record<string, "agree" | "disagree"> = {};
    for (const [k, v] of Object.entries(flagFeedbackState)) {
      if (v) filteredFlagFeedback[k] = v;
    }

    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reqTitle: title,
          reqNumber,
          locations: locationLabels,
          workSetup,
          feasibilityScore: firstLoc?.feasibilityScore ?? null,
          baselineTTF: firstLoc?.baselineTimeToFill ?? "",
          estimatedTTF: firstLoc?.estimatedTimeToFill ?? "",
          overallFeedback: thumb,
          flagFeedback: filteredFlagFeedback,
          userNotes: feedbackNotes,
          reqText,
          analysisJSON: JSON.stringify(result),
        }),
      });
    } catch {
      // fail silently
    }

    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  }

  const resultCount = result?.locationResults?.length || 0;
  const shared = result?.sharedAnalysis;
  const hasScoreData = result?.locationResults?.[0]?.feasibilityScore !== undefined;
  const singleLoc = resultCount === 1 ? result!.locationResults[0] : null;
  const singleAllFlags = singleLoc
    ? sortFlags([...(shared?.flags || []), ...(singleLoc.locationSpecificFlags || [])])
    : [];
  const singleAlignmentNotes = resultCount === 1 ? (shared?.alignmentNotes || []) : [];

  return (
    <main className="min-h-screen">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="max-w-5xl mx-auto px-6 py-5">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Connext" className="w-9 h-9" />
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">Req Feasibility Analyzer</h1>
              <p className="text-sm text-gray-500">Pre-submission requisition review</p>
            </div>
            <button
              onClick={() => setShowChangelog(true)}
              className="text-xs text-gray-400 hover:text-gray-600 font-mono px-2 py-1 rounded hover:bg-gray-50 transition-colors"
            >
              v2.11.5
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
                      <li key={i} className="text-sm text-gray-600 leading-relaxed flex items-baseline gap-2">
                        <span className="text-gray-300 flex-shrink-0">&bull;</span>
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

      {/* Location Detail Modal */}
      {detailLocation && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setDetailLocation(null)}>
          <div className="absolute inset-0 bg-black/20" />
          <div
            className="relative w-full max-w-md bg-white shadow-xl h-full overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 bg-white border-b px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{detailLocation.location}</h2>
                <p className="text-xs text-gray-400">{detailLocation.workSetup}</p>
              </div>
              <button
                onClick={() => setDetailLocation(null)}
                className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-5 space-y-5">
              <div className="flex justify-center">
                <ScoreGauge score={detailLocation.feasibilityScore} compact />
              </div>
              {detailLocation.verdict && (
                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Assessment</span>
                  <p className="text-sm text-gray-800 mt-1">{detailLocation.verdict}</p>
                </div>
              )}
              {detailLocation.estimatedTimeToFill && (
                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Estimated Time-to-Fill</span>
                  <p className="text-sm text-gray-800 mt-1 font-medium">{detailLocation.estimatedTimeToFill}</p>
                </div>
              )}
              {detailLocation.baselineTimeToFill && (
                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Baseline for This Role</span>
                  <p className="text-sm text-gray-800 mt-1 font-medium">{detailLocation.baselineTimeToFill}</p>
                </div>
              )}
              {detailLocation.compensationAssessment && (() => {
                const ca = detailLocation.compensationAssessment;
                const style = compRatingStyles[ca.rating] || compRatingStyles.competitive;
                return (
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Compensation</span>
                      <span className={`text-xs font-bold ${style.color}`}>{style.label}</span>
                    </div>
                    {ca.marketRange && (
                      <p className="text-xs text-gray-500 mt-1">Market range: {ca.marketRange}</p>
                    )}
                    {ca.siteVariance && (
                      <p className="text-xs text-gray-500 mt-0.5">{ca.siteVariance}</p>
                    )}
                    <div className="mt-2">
                      <BulletText text={ca.explanation} className="text-sm text-gray-700" />
                    </div>
                  </div>
                );
              })()}
              {detailLocation.narrative && (
                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Market Context</span>
                  <BulletText text={detailLocation.narrative} className="text-sm text-gray-700 mt-1 leading-relaxed" />
                </div>
              )}
              {(detailLocation.locationSpecificFlags?.length ?? 0) > 0 && (
                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Location-Specific Flags</span>
                  <div className="mt-2 space-y-3">
                    {detailLocation.locationSpecificFlags.map((flag, i) => (
                      <FlagCard key={i} flag={flag} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Input Section */}
        <div className="bg-white rounded-xl border shadow-sm">
          {inputCollapsed ? (
            <div className="px-6 py-4 flex items-center gap-3 animate-fade-in">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 truncate">
                  {[
                    ...selectedLocations.map(id => getLocationById(id)?.label).filter(Boolean),
                    workSetup === "Work From Home" ? "WFH" : workSetup === "Fully On-Site" ? "On-Site" : workSetup,
                    shiftType,
                    ...selectedCountries.map(country => {
                      const cur = CURRENCY_BY_COUNTRY[country];
                      const val = compensation[country];
                      if (!cur || !val || (!val.min && !val.max)) return null;
                      return `${cur.code} ${val.min ? Number(val.min).toLocaleString() : "?"}\u2013${val.max ? Number(val.max).toLocaleString() : "?"}`;
                    }).filter(Boolean),
                    extractReqMeta(reqText).title !== "Untitled" ? extractReqMeta(reqText).title : null,
                  ].filter(Boolean).join(" \u00b7 ")}
                </p>
              </div>
              {loading && (
                <div className="flex items-center gap-2 text-sm text-gray-400 flex-shrink-0">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {streamProgress > 0 ? "Receiving..." : "Analyzing..."}
                </div>
              )}
              <button
                onClick={() => setInputCollapsed(false)}
                className="flex items-center gap-1.5 text-sm text-[#071776] hover:text-[#050f55] font-medium flex-shrink-0"
              >
                Edit
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
            </div>
          ) : (
          <div className="p-6">
            {/* Location Selector */}
            <div className="mb-4">
              <span className="text-sm font-semibold text-gray-700 block mb-2">Locations</span>
              <div className="space-y-2">
                {Object.entries(LOCATIONS).map(([country, sites]) => (
                  <div key={country} className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium text-gray-400 w-20 flex-shrink-0">{country}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {sites.map(site => {
                        const isSelected = selectedLocations.includes(site.id);
                        return (
                          <button
                            key={site.id}
                            onClick={() => toggleLocation(site.id)}
                            className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                              isSelected
                                ? "bg-[#071776] text-white border-[#071776]"
                                : "bg-white text-gray-600 border-gray-200 hover:border-[#071776]/30 hover:text-[#071776]"
                            }`}
                          >
                            {site.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Work Setup + Shift Type */}
            <div className="mb-4 flex flex-wrap items-end gap-4">
              <div>
                <span className="text-sm font-semibold text-gray-700 block mb-2">Work Setup</span>
                <div className="flex gap-1.5">
                  {WORK_SETUPS.map(ws => (
                    <button
                      key={ws}
                      onClick={() => { setWorkSetup(ws); if (result) setResult(null); }}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
                        workSetup === ws
                          ? "bg-[#071776] text-white border-[#071776]"
                          : "bg-white text-gray-600 border-gray-200 hover:border-[#071776]/30 hover:text-[#071776]"
                      }`}
                    >
                      {ws}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-sm font-semibold text-gray-700 block mb-2">Shift</span>
                <select
                  value={shiftType}
                  onChange={(e) => { setShiftType(e.target.value as ShiftType); if (result) setResult(null); }}
                  className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-600 focus:border-[#071776] focus:ring-1 focus:ring-[#071776]/20 focus:outline-none cursor-pointer"
                >
                  {SHIFT_TYPES.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Monthly Compensation */}
            {selectedCountries.length > 0 && (
              <div className="mb-4">
                <span className="text-sm font-semibold text-gray-700 block mb-1">Monthly Compensation</span>
                <p className="text-xs text-gray-400 mb-2">Gross monthly salary range offered for this role</p>
                <div className="space-y-2">
                  {selectedCountries.map(country => {
                    const cur = CURRENCY_BY_COUNTRY[country];
                    if (!cur) return null;
                    const val = compensation[country] || { min: "", max: "" };
                    return (
                      <div key={country} className="flex items-center gap-2">
                        {selectedCountries.length > 1 && (
                          <span className="text-xs font-medium text-gray-400 w-[100px] flex-shrink-0">{country}</span>
                        )}
                        <span className="text-sm text-gray-400 font-medium w-10 flex-shrink-0">{cur.code}</span>
                        <input
                          type="number"
                          min="0"
                          value={val.min}
                          onChange={(e) => {
                            setCompensation(prev => ({ ...prev, [country]: { ...prev[country] || { min: "", max: "" }, min: e.target.value } }));
                            if (result) setResult(null);
                          }}
                          placeholder="Min"
                          className="w-28 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:border-[#071776] focus:ring-1 focus:ring-[#071776]/20 focus:outline-none"
                        />
                        <span className="text-sm text-gray-300">—</span>
                        <input
                          type="number"
                          min="0"
                          value={val.max}
                          onChange={(e) => {
                            setCompensation(prev => ({ ...prev, [country]: { ...prev[country] || { min: "", max: "" }, max: e.target.value } }));
                            if (result) setResult(null);
                          }}
                          placeholder="Max"
                          className="w-28 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:border-[#071776] focus:ring-1 focus:ring-[#071776]/20 focus:outline-none"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* India + non-WFH warning */}
            {showIndiaWarning && (
              <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
                <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                <span className="text-xs text-amber-700">India roles are remote only. Analysis will evaluate as Work From Home.</span>
              </div>
            )}

            <div className="flex items-center justify-between mb-4">
              <label htmlFor="req" className="text-sm font-semibold text-gray-700">
                Paste Job Requisition
              </label>
              <button
                onClick={loadSample}
                className="text-sm text-[#071776] hover:text-[#050f55] font-medium"
              >
                Try sample req
              </button>
            </div>
            <textarea
              id="req"
              rows={12}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-[#071776] focus:ring-2 focus:ring-[#071776]/20 focus:outline-none resize-y"
              placeholder="Paste the full job requisition here — title, description, qualifications, screening criteria, etc."
              value={reqText}
              onChange={(e) => setReqText(e.target.value)}
            />
            <div className="mt-4 flex items-center gap-4">
              <button
                onClick={analyze}
                disabled={loading || !reqText.trim() || selectedLocations.length === 0}
                className="px-5 py-2.5 bg-[#071776] text-white text-sm font-semibold rounded-lg hover:bg-[#050f55] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {streamProgress > 0 ? "Receiving analysis..." : "Analyzing..."}
                  </>
                ) : result ? (
                  "Re-analyze"
                ) : (
                  "Analyze Feasibility"
                )}
              </button>
              {showCompleteIndicator && (
                <button
                  onClick={() => {
                    setShowCompleteIndicator(false);
                    resultsRef.current?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="text-sm text-[#071776] font-medium animate-fade-in hover:underline"
                >
                  Analysis complete ↓
                </button>
              )}
              {selectedLocations.length === 0 && (
                <span className="text-sm text-amber-600">Select at least one location</span>
              )}
              {reqText && !loading && (
                <button
                  onClick={() => { setReqText(""); setResult(null); setError(null); setInputCollapsed(false); }}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
          )}
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
        {(loading || (result && (result.locationResults?.length > 0 || (shared?.flags?.length ?? 0) > 0))) && (
          <div ref={resultsRef} className="space-y-6">

            {/* === Score / Comparison === */}
            {loading && !hasScoreData && (
              <SectionSkeleton
                title={selectedLocations.length === 1 ? "Feasibility Analysis" : "Feasibility Comparison"}
                message="Scoring locations..."
              />
            )}

            {/* Single Location: Score + Header */}
            {singleLoc?.feasibilityScore !== undefined && (
              <div className="bg-white rounded-xl border shadow-sm p-6 animate-fade-in">
                <div className="flex items-center mb-2">
                  <h2 className="text-lg font-bold text-gray-900">Feasibility Analysis</h2>
                  {!loading && (
                    <OverallFeedback
                      overallFeedback={overallFeedback}
                      onThumb={handleOverallFeedback}
                      feedbackNotes={feedbackNotes}
                      onNotesChange={setFeedbackNotes}
                      onSubmit={() => submitFeedback()}
                      feedbackSent={feedbackSent}
                      feedbackNudge={feedbackNudge}
                      showInput={showFeedbackInput}
                    />
                  )}
                </div>
                <p className="text-xs text-gray-400 mb-6">
                  This is a directional assessment to support your review — not a final determination. Use your market knowledge and client context to validate.
                </p>
                <div className="grid md:grid-cols-[auto_1fr] gap-8 items-start">
                  <ScoreGauge score={singleLoc.feasibilityScore} />
                  <div className="space-y-3">
                    {singleLoc.verdict && (
                      <div>
                        <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Assessment</span>
                        <p className="text-base text-gray-800 mt-1">{singleLoc.verdict}</p>
                      </div>
                    )}
                    {singleLoc.estimatedTimeToFill && (
                      <div>
                        <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Estimated Time-to-Fill</span>
                        <p className="text-base text-gray-800 mt-1 font-medium">{singleLoc.estimatedTimeToFill}</p>
                      </div>
                    )}
                    {singleLoc.baselineTimeToFill && (
                      <div>
                        <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Baseline for This Role</span>
                        <p className="text-base text-gray-800 mt-1 font-medium">{singleLoc.baselineTimeToFill}</p>
                      </div>
                    )}
                    {singleLoc.narrative && (
                      <div>
                        <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Summary</span>
                        <BulletText text={singleLoc.narrative} className="text-sm text-gray-700 mt-1 leading-relaxed" />
                      </div>
                    )}
                    {singleLoc.compensationAssessment && (() => {
                      const ca = singleLoc.compensationAssessment;
                      const style = compRatingStyles[ca.rating] || compRatingStyles.competitive;
                      return (
                        <div className="border-t border-gray-200 pt-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Compensation</span>
                            <span className={`text-xs font-bold ${style.color}`}>{style.label}</span>
                          </div>
                          {ca.marketRange && (
                            <p className="text-xs text-gray-500 mt-1">Market range: {ca.marketRange}</p>
                          )}
                          {ca.siteVariance && (
                            <p className="text-xs text-gray-500 mt-0.5">{ca.siteVariance}</p>
                          )}
                          <div className="mt-2">
                            <BulletText text={ca.explanation} className="text-sm text-gray-700" />
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}

            {/* Multi-location: 2-3 Side-by-Side Cards */}
            {resultCount >= 2 && resultCount <= 3 && (
              <div className="bg-white rounded-xl border shadow-sm p-6 animate-fade-in">
                <div className="flex items-center mb-2">
                  <h2 className="text-lg font-bold text-gray-900">Feasibility Comparison</h2>
                </div>
                <p className="text-xs text-gray-400 mb-6">
                  This is a directional assessment to support your review — not a final determination. Use your market knowledge and client context to validate.
                </p>
                <div className={`grid gap-4 ${resultCount === 2 ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
                  {result!.locationResults.map((loc, i) => (
                    loc.feasibilityScore !== undefined && (
                      <div key={i} className="rounded-xl border border-gray-200 p-5">
                        <h3 className="text-sm font-bold text-gray-900 mb-1">{loc.location}</h3>
                        <p className="text-xs text-gray-400 mb-4">{loc.workSetup}</p>
                        <div className="flex justify-center mb-4">
                          <ScoreGauge score={loc.feasibilityScore} compact />
                        </div>
                        {loc.verdict && (
                          <p className="text-sm text-gray-700 mb-2">{loc.verdict}</p>
                        )}
                        {loc.estimatedTimeToFill && (
                          <p className="text-xs text-gray-500">
                            <span className="font-semibold">TTF:</span> {loc.estimatedTimeToFill}
                          </p>
                        )}
                        {loc.baselineTimeToFill && (
                          <p className="text-xs text-gray-400">
                            <span className="font-semibold">Baseline:</span> {loc.baselineTimeToFill}
                          </p>
                        )}
                        {loc.compensationAssessment && (
                          <p className={`text-xs font-medium mt-1 ${(compRatingStyles[loc.compensationAssessment.rating] || compRatingStyles.competitive).color}`}>
                            Comp: {(compRatingStyles[loc.compensationAssessment.rating] || compRatingStyles.competitive).label}
                          </p>
                        )}
                        {(loc.narrative || (loc.locationSpecificFlags?.length ?? 0) > 0) && (
                          <button
                            onClick={() => setDetailLocation(loc)}
                            className="mt-3 text-xs text-[#071776] hover:text-[#050f55] font-medium flex items-center gap-1"
                          >
                            View details
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                          </button>
                        )}
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}

            {/* Multi-location: 4+ Summary Table */}
            {resultCount >= 4 && (
              <div className="bg-white rounded-xl border shadow-sm p-6 animate-fade-in">
                <div className="flex items-center mb-2">
                  <h2 className="text-lg font-bold text-gray-900">Feasibility Comparison</h2>
                </div>
                <p className="text-xs text-gray-400 mb-6">
                  This is a directional assessment to support your review — not a final determination.
                </p>
                <div className="overflow-x-auto">
                  {(() => {
                    const hasComp = result!.locationResults.some(l => l.compensationAssessment);
                    return (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-2 pr-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">Location</th>
                            <th className="text-center py-2 px-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">Score</th>
                            <th className="text-left py-2 px-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">Verdict</th>
                            <th className="text-left py-2 px-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">TTF</th>
                            <th className="text-left py-2 px-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">Baseline</th>
                            {hasComp && <th className="text-left py-2 px-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">Comp</th>}
                            <th className="py-2 pl-4"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {result!.locationResults.map((loc, i) => (
                            <tr key={i} className="border-b border-gray-100 last:border-0">
                              <td className="py-3 pr-4 font-medium text-gray-900">{loc.location}</td>
                              <td className="py-3 px-4 text-center"><ScoreBadge score={loc.feasibilityScore} /></td>
                              <td className="py-3 px-4 text-gray-700">{loc.verdict}</td>
                              <td className="py-3 px-4 text-gray-600">{loc.estimatedTimeToFill}</td>
                              <td className="py-3 px-4 text-gray-400">{loc.baselineTimeToFill}</td>
                              {hasComp && (
                                <td className={`py-3 px-4 text-xs font-medium ${loc.compensationAssessment ? (compRatingStyles[loc.compensationAssessment.rating] || compRatingStyles.competitive).color : "text-gray-300"}`}>
                                  {loc.compensationAssessment ? (compRatingStyles[loc.compensationAssessment.rating] || compRatingStyles.competitive).label : "—"}
                                </td>
                              )}
                              <td className="py-3 pl-4">
                                {(loc.narrative || (loc.locationSpecificFlags?.length ?? 0) > 0) && (
                                  <button
                                    onClick={() => setDetailLocation(loc)}
                                    className="text-xs text-[#071776] hover:text-[#050f55] font-medium whitespace-nowrap"
                                  >
                                    Details
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* === Flagged Requirements === */}
            {loading && singleAllFlags.length === 0 && (shared?.flags?.length ?? 0) === 0 && (
              <SectionSkeleton title="Flagged Requirements" message="Scanning screening criteria..." />
            )}

            {/* Single location: combined shared + location-specific flags */}
            {resultCount === 1 && singleAllFlags.length > 0 && (
              <div className="bg-white rounded-xl border shadow-sm p-6 animate-fade-in">
                <div className="flex items-center mb-1">
                  <h2 className="text-lg font-bold text-gray-900">
                    Flagged Requirements
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      ({singleAllFlags.length}{loading ? "+" : ""} found)
                    </span>
                  </h2>
                </div>
                <p className="text-sm text-gray-500 mb-5">
                  Requirements that may narrow your candidate pool and extend time-to-fill.
                </p>
                <div className="space-y-4">
                  {singleAllFlags.map((flag) => (
                    <div key={flag.requirement} className="animate-fade-in transition-all duration-300 ease-out">
                      <FlagCard flag={flag} flagFeedback={flagFeedbackState[flag.requirement]} onFlagFeedback={handleFlagFeedback} />
                    </div>
                  ))}
                </div>
                <p className="mt-4 pt-3 border-t border-gray-100 text-[11px] font-mono text-gray-400">
                  Pool reduction estimates are directional, based on AI analysis of offshore staffing market patterns. Validate against internal pipeline data for specific roles.
                </p>
              </div>
            )}

            {/* Multi-location: shared flags */}
            {resultCount >= 2 && (shared?.flags?.length ?? 0) > 0 && (() => {
              const sortedSharedFlags = sortFlags(shared!.flags);
              return (
              <div className="bg-white rounded-xl border shadow-sm p-6 animate-fade-in">
                <div className="flex items-center mb-1">
                  <h2 className="text-lg font-bold text-gray-900">
                    Flagged Requirements
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      ({sortedSharedFlags.length} found)
                    </span>
                  </h2>
                </div>
                <p className="text-sm text-gray-500 mb-5">
                  Requirements that may narrow your candidate pool and extend time-to-fill. These apply across all locations.
                </p>
                <div className="space-y-4">
                  {sortedSharedFlags.map((flag) => (
                    <div key={flag.requirement} className="animate-fade-in transition-all duration-300 ease-out">
                      <FlagCard flag={flag} flagFeedback={flagFeedbackState[flag.requirement]} onFlagFeedback={handleFlagFeedback} />
                    </div>
                  ))}
                </div>
                <p className="mt-4 pt-3 border-t border-gray-100 text-[11px] font-mono text-gray-400">
                  Pool reduction estimates are directional, based on AI analysis of offshore staffing market patterns. Validate against internal pipeline data for specific roles.
                </p>
              </div>
              );
            })()}

            {/* === Alignment Notes === */}
            {loading && singleAlignmentNotes.length === 0 && (shared?.alignmentNotes?.length ?? 0) === 0 && (
              <SectionSkeleton title="Alignment Notes" message="Checking JD alignment..." />
            )}

            {/* Single location alignment */}
            {resultCount === 1 && singleAlignmentNotes.length > 0 && (
              <div className="bg-white rounded-xl border shadow-sm p-6 animate-fade-in">
                <div className="flex items-center mb-1">
                  <h2 className="text-lg font-bold text-gray-900">Alignment Notes</h2>
                </div>
                <p className="text-sm text-gray-500 mb-5">
                  Potential mismatches between job description and screening criteria.
                </p>
                <div className="space-y-4">
                  {singleAlignmentNotes.map((note, i) => (
                    <AlignmentCard key={i} note={note} noteFeedback={flagFeedbackState[note.requirement]} onNoteFeedback={handleFlagFeedback} />
                  ))}
                </div>
              </div>
            )}

            {/* Multi-location alignment */}
            {resultCount >= 2 && (shared?.alignmentNotes?.length ?? 0) > 0 && (
              <div className="bg-white rounded-xl border shadow-sm p-6 animate-fade-in">
                <div className="flex items-center mb-1">
                  <h2 className="text-lg font-bold text-gray-900">Alignment Notes</h2>
                </div>
                <p className="text-sm text-gray-500 mb-5">
                  Potential mismatches between job description and screening criteria.
                </p>
                <div className="space-y-4">
                  {shared!.alignmentNotes.map((note, i) => (
                    <AlignmentCard key={i} note={note} noteFeedback={flagFeedbackState[note.requirement]} onNoteFeedback={handleFlagFeedback} />
                  ))}
                </div>
              </div>
            )}

            {/* === Well-Calibrated Requirements === */}
            {loading && (shared?.wellCalibratedRequirements?.length ?? 0) === 0 && (
              <SectionSkeleton title="Well-Calibrated Requirements" message="Identifying strong requirements..." />
            )}

            {(shared?.wellCalibratedRequirements?.length ?? 0) > 0 && (
              <div className="bg-white rounded-xl border shadow-sm p-6 animate-fade-in">
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                  </svg>
                  <h2 className="text-lg font-bold text-gray-900">Well-Calibrated Requirements</h2>
                  {!loading && <SectionFeedback section="calibrated" feedback={feedback.calibrated} onFeedback={handleFeedback} />}
                </div>
                <ul className="space-y-2">
                  {shared!.wellCalibratedRequirements.map((req, i) => (
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

            {/* === Revised Screening Criteria === */}
            {loading && !shared?.revisedScreeningCriteria && (
              <SectionSkeleton title="Recommended Screening Criteria" message="Building recommended criteria..." />
            )}

            {shared?.revisedScreeningCriteria && (
              <div className="bg-white rounded-xl border shadow-sm p-6 animate-fade-in">
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
                      {(shared!.revisedScreeningCriteria.mustHave || []).map((item, i) => (
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
                      {(shared!.revisedScreeningCriteria.niceToHave || []).map((item, i) => (
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
                      {(shared!.revisedScreeningCriteria.trainable || []).map((item, i) => (
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

            {/* === Recommendations === */}
            {loading && (shared?.recommendations?.length ?? 0) === 0 && (
              <SectionSkeleton title="Recommendations" message="Generating recommendations..." />
            )}

            {(shared?.recommendations?.length ?? 0) > 0 && (
              <div ref={recommendationsRef} className="bg-white rounded-xl border shadow-sm p-6 animate-fade-in">
                <div className="flex items-center mb-4">
                  <h2 className="text-lg font-bold text-gray-900">Recommendations</h2>
                  {!loading && <SectionFeedback section="recommendations" feedback={feedback.recommendations} onFeedback={handleFeedback} />}
                </div>
                <ul className="space-y-3">
                  {shared!.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-[#071776]/10 text-[#071776] flex items-center justify-center text-xs font-bold">
                        {i + 1}
                      </span>
                      <p className="text-sm text-gray-700 leading-relaxed">{rec.replace(/^\d+\.\s*/, "")}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

          </div>
        )}
      </div>

      {showToast && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow-lg animate-fade-in z-50">
          Feedback saved
        </div>
      )}
    </main>
  );
}
