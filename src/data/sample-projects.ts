import type { StrategyStore } from "../types/store";
import { defaultOpenRouterPresets, defaultProjectStatuses, defaultProjectTypes, defaultSourceTypes } from "../lib/config";

const now = "2026-05-04T09:00:00.000Z";

export const sampleStore: StrategyStore = {
  config: {
    projectTypes: defaultProjectTypes,
    projectStatuses: defaultProjectStatuses,
    sourceTypes: defaultSourceTypes,
    openRouterPresets: defaultOpenRouterPresets,
    aiSettings: {
      selectedModel: defaultOpenRouterPresets[0].id,
      customModelId: "",
      siteUrl: "http://127.0.0.1:5173",
      appTitle: "Stratis - Strategy & Insight Engine"
    },
    modelMetadata: [],
    modelMetadataRetrievedAt: undefined,
    themeMode: "light"
  },
  projects: [
    {
      id: "proj-asean-wealth",
      title: "ASEAN Digital Wealth Market Entry",
      type: "Market Entry",
      decisionQuestion:
        "Which ASEAN entry route should a digital wealth platform prioritize over the next 18 months?",
      timeHorizon: "18 months",
      owner: "Strategy Lead",
      status: "Recommended",
      createdAt: now,
      updatedAt: now
    },
    {
      id: "proj-healthcare-ai",
      title: "Healthcare Workflow AI Command Centre",
      type: "Product Strategy",
      decisionQuestion:
        "Should the product team build a human-in-loop workflow command centre for hospital operations?",
      timeHorizon: "12 months",
      owner: "Product Strategy",
      status: "In Review",
      createdAt: now,
      updatedAt: now
    },
    {
      id: "proj-semiconductor-macro",
      title: "Semiconductor Macro Brief",
      type: "Macro Briefing",
      decisionQuestion:
        "Which demand scenario should guide capacity and inventory planning for the next two quarters?",
      timeHorizon: "2 quarters",
      owner: "Macro Desk",
      status: "Draft",
      createdAt: now,
      updatedAt: now
    }
  ],
  evidence: [
    {
      id: "ev-asean-1",
      projectId: "proj-asean-wealth",
      sourceTitle: "Synthetic regulator readiness scan",
      sourceType: "Regulator",
      sourceDate: "2026-04-10",
      claim: "Digital advisory permissions vary materially across target ASEAN markets.",
      implication:
        "A partnership-led route reduces licensing delay while preserving optionality.",
      confidence: "Medium",
      relevance: 5,
      notes: "Synthetic public-domain-style sample."
    },
    {
      id: "ev-asean-2",
      projectId: "proj-asean-wealth",
      sourceTitle: "Mock channel economics benchmark",
      sourceType: "Analyst",
      sourceDate: "2026-03-18",
      claim: "Bank-affinity channels show lower CAC but slower product iteration cycles.",
      implication: "Distribution leverage must be weighed against control of roadmap velocity.",
      confidence: "Medium",
      relevance: 4
    },
    {
      id: "ev-health-1",
      projectId: "proj-healthcare-ai",
      sourceTitle: "Synthetic hospital operations interview notes",
      sourceType: "UserProvided",
      sourceDate: "2026-04-22",
      claim: "Operations leaders spend recurring time reconciling bed, staffing, and discharge bottlenecks.",
      implication: "A command-centre workflow could create measurable cycle-time value.",
      confidence: "High",
      relevance: 5
    },
    {
      id: "ev-semi-1",
      projectId: "proj-semiconductor-macro",
      sourceTitle: "Mock inventory cycle indicator",
      sourceType: "Analyst",
      sourceDate: "2026-04-01",
      claim: "Inventory digestion remains uneven across consumer and AI-exposed semiconductor segments.",
      implication: "Planning should separate cyclical recovery from structurally constrained AI demand.",
      confidence: "Medium",
      relevance: 5
    }
  ],
  assumptions: [
    {
      id: "as-asean-1",
      projectId: "proj-asean-wealth",
      statement: "A regional bank partner can support compliant onboarding within two quarters.",
      impact: "High",
      confidence: "Medium",
      validationTest: "Obtain partner compliance and integration commitment before pilot funding.",
      invalidationTrigger: "Partner legal review requires market-by-market custom licensing.",
      linkedEvidenceIds: ["ev-asean-1", "ev-asean-2"]
    },
    {
      id: "as-health-1",
      projectId: "proj-healthcare-ai",
      statement: "Clinical staff will trust AI recommendations if approvals remain human-controlled.",
      impact: "High",
      confidence: "Low",
      validationTest: "Run a supervised workflow pilot with explicit override tracking.",
      invalidationTrigger: "Override rates exceed 50% after workflow training.",
      linkedEvidenceIds: ["ev-health-1"]
    },
    {
      id: "as-semi-1",
      projectId: "proj-semiconductor-macro",
      statement: "AI accelerator demand remains supply-constrained through the planning horizon.",
      impact: "High",
      confidence: "Medium",
      validationTest: "Track backlog commentary and leading-edge capacity allocation.",
      invalidationTrigger: "Major customers defer committed orders for two consecutive months.",
      linkedEvidenceIds: ["ev-semi-1"]
    }
  ],
  options: [
    {
      id: "op-asean-partner",
      projectId: "proj-asean-wealth",
      name: "Partner-led entry",
      description: "Launch through bank or broker distribution with staged product control."
    },
    {
      id: "op-asean-direct",
      projectId: "proj-asean-wealth",
      name: "Direct license entry",
      description: "Pursue own licensing and build direct acquisition channels."
    },
    {
      id: "op-asean-wait",
      projectId: "proj-asean-wealth",
      name: "Wait and monitor",
      description: "Delay entry until regulatory and customer acquisition economics improve."
    },
    {
      id: "op-health-build",
      projectId: "proj-healthcare-ai",
      name: "Build command centre",
      description: "Invest in workflow orchestration and human approval loops."
    },
    {
      id: "op-health-integrate",
      projectId: "proj-healthcare-ai",
      name: "Integrate with incumbent",
      description: "Partner with an existing hospital operations platform."
    },
    {
      id: "op-semi-base",
      projectId: "proj-semiconductor-macro",
      name: "Base recovery case",
      description: "Plan for gradual broad-based demand recovery."
    },
    {
      id: "op-semi-ai",
      projectId: "proj-semiconductor-macro",
      name: "AI-led upside case",
      description: "Prioritize constrained AI supply and selective capacity buffers."
    }
  ],
  criteria: [
    { id: "cr-asean-market", projectId: "proj-asean-wealth", name: "Market attractiveness", weight: 35 },
    { id: "cr-asean-speed", projectId: "proj-asean-wealth", name: "Speed to learn", weight: 25 },
    { id: "cr-asean-risk", projectId: "proj-asean-wealth", name: "Execution risk", weight: 20 },
    { id: "cr-asean-control", projectId: "proj-asean-wealth", name: "Strategic control", weight: 20 },
    { id: "cr-health-value", projectId: "proj-healthcare-ai", name: "Operational value", weight: 40 },
    { id: "cr-health-risk", projectId: "proj-healthcare-ai", name: "Adoption risk", weight: 30 },
    { id: "cr-health-speed", projectId: "proj-healthcare-ai", name: "Speed to pilot", weight: 30 },
    { id: "cr-semi-demand", projectId: "proj-semiconductor-macro", name: "Demand signal strength", weight: 45 },
    { id: "cr-semi-risk", projectId: "proj-semiconductor-macro", name: "Downside protection", weight: 30 },
    { id: "cr-semi-flex", projectId: "proj-semiconductor-macro", name: "Planning flexibility", weight: 25 }
  ],
  scores: [
    { id: "sc-1", optionId: "op-asean-partner", criterionId: "cr-asean-market", score: 4, rationale: "Good segment access via partner base." },
    { id: "sc-2", optionId: "op-asean-partner", criterionId: "cr-asean-speed", score: 5, rationale: "Fastest route to real customer learning." },
    { id: "sc-3", optionId: "op-asean-partner", criterionId: "cr-asean-risk", score: 4, rationale: "Compliance and acquisition risks shared." },
    { id: "sc-4", optionId: "op-asean-partner", criterionId: "cr-asean-control", score: 3, rationale: "Roadmap control diluted." },
    { id: "sc-5", optionId: "op-asean-direct", criterionId: "cr-asean-market", score: 4, rationale: "Large upside if licensing clears." },
    { id: "sc-6", optionId: "op-asean-direct", criterionId: "cr-asean-speed", score: 2, rationale: "Licensing path slows proof points." },
    { id: "sc-7", optionId: "op-asean-direct", criterionId: "cr-asean-risk", score: 2, rationale: "Higher regulatory and CAC risk." },
    { id: "sc-8", optionId: "op-asean-direct", criterionId: "cr-asean-control", score: 5, rationale: "Highest product and data control." },
    { id: "sc-9", optionId: "op-asean-wait", criterionId: "cr-asean-market", score: 2, rationale: "No near-term capture." },
    { id: "sc-10", optionId: "op-asean-wait", criterionId: "cr-asean-speed", score: 1, rationale: "Learning delayed." },
    { id: "sc-11", optionId: "op-asean-wait", criterionId: "cr-asean-risk", score: 5, rationale: "Avoids immediate execution risk." },
    { id: "sc-12", optionId: "op-asean-wait", criterionId: "cr-asean-control", score: 3, rationale: "Preserves capital but loses option value." },
    { id: "sc-13", optionId: "op-health-build", criterionId: "cr-health-value", score: 5, rationale: "Highest workflow differentiation." },
    { id: "sc-14", optionId: "op-health-build", criterionId: "cr-health-risk", score: 3, rationale: "Requires careful trust and change management." },
    { id: "sc-15", optionId: "op-health-build", criterionId: "cr-health-speed", score: 3, rationale: "Pilot possible but integration burden exists." },
    { id: "sc-16", optionId: "op-health-integrate", criterionId: "cr-health-value", score: 3, rationale: "Value limited by partner workflow depth." },
    { id: "sc-17", optionId: "op-health-integrate", criterionId: "cr-health-risk", score: 4, rationale: "Lower adoption friction." },
    { id: "sc-18", optionId: "op-health-integrate", criterionId: "cr-health-speed", score: 4, rationale: "Faster procurement path." },
    { id: "sc-19", optionId: "op-semi-base", criterionId: "cr-semi-demand", score: 3, rationale: "Supported by recovery but uneven by segment." },
    { id: "sc-20", optionId: "op-semi-base", criterionId: "cr-semi-risk", score: 4, rationale: "Conservative inventory posture." },
    { id: "sc-21", optionId: "op-semi-base", criterionId: "cr-semi-flex", score: 4, rationale: "Keeps planning optionality." },
    { id: "sc-22", optionId: "op-semi-ai", criterionId: "cr-semi-demand", score: 5, rationale: "Strongest upside signal." },
    { id: "sc-23", optionId: "op-semi-ai", criterionId: "cr-semi-risk", score: 2, rationale: "Higher downside if orders slip." },
    { id: "sc-24", optionId: "op-semi-ai", criterionId: "cr-semi-flex", score: 3, rationale: "More capacity tied to one demand pool." }
  ],
  premortems: [
    {
      id: "pm-asean-1",
      projectId: "proj-asean-wealth",
      failureCause: "Partner integration slows launch past target window.",
      likelihood: 3,
      severity: 4,
      mitigation: "Set integration exit criteria and parallel diligence on backup partners.",
      earlyWarning: "API and compliance milestones slip by more than four weeks.",
      owner: "Partnerships"
    },
    {
      id: "pm-health-1",
      projectId: "proj-healthcare-ai",
      failureCause: "Clinical users reject recommendations due to unclear accountability.",
      likelihood: 4,
      severity: 5,
      mitigation: "Keep human approvals explicit and audit every override.",
      earlyWarning: "Low usage after training or high override rates.",
      owner: "Clinical Product"
    },
    {
      id: "pm-semi-1",
      projectId: "proj-semiconductor-macro",
      failureCause: "AI-led demand signal masks broader inventory weakness.",
      likelihood: 3,
      severity: 4,
      mitigation: "Separate AI and non-AI demand dashboards in planning review.",
      earlyWarning: "Distributor inventory days rise while AI backlog remains strong.",
      owner: "Planning"
    }
  ],
  decisionLog: [
    {
      id: "dl-asean-1",
      projectId: "proj-asean-wealth",
      timestamp: now,
      decisionChange: "Moved recommendation from direct entry to partner-led entry.",
      reason: "Sensitivity showed speed to learn and execution risk outweighed strategic control.",
      evidenceAdded: "ev-asean-2",
      assumptionChanged: "as-asean-1",
      recommendationBefore: "Direct license entry",
      recommendationAfter: "Partner-led entry"
    }
  ],
  chartInsights: [],
  extractedDocuments: [],
  documentChunks: [],
  aiCandidates: []
};
