import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Archive,
  BarChart3,
  BookOpen,
  ClipboardList,
  Download,
  FileText,
  Gauge,
  GitBranch,
  Plus,
  RefreshCw,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  X
} from "lucide-react";
import Papa from "papaparse";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { ChartInsight, Criterion, DecisionOption, OptionScore, PremortemItem } from "../types/decision";
import type { Assumption, Confidence, EvidenceItem, Impact, SourceType } from "../types/evidence";
import type { Project } from "../types/project";
import type { StrategyStore } from "../types/store";
import type { AiCandidate, DocumentChunk, ExtractedDocument } from "../types/ai";
import { generateDetailedBrief, generateMarkdownBrief } from "../lib/briefGenerator";
import { getNumericFields, summarizeField } from "../lib/csv";
import { calculateOptionTotals, getWeightTotal, weightsAreValid } from "../lib/scoring";
import { rebalanceCriteriaWithAdjustments } from "../lib/sensitivity";
import {
  clearStore,
  exportStore,
  getOpenRouterApiKey,
  loadStore,
  loadStoreAsync,
  saveStore,
  setOpenRouterApiKey
} from "../lib/storage";
import { applyAiCandidate, extractCandidatesWithOpenRouter, fetchOpenRouterModels } from "../lib/openRouter";
import { canonicalizeSourceType, ensureStoreConfig, formatSourceType, isDuplicateOption, normalizeOption } from "../lib/config";

type WorkspaceTab =
  | "overview"
  | "evidence"
  | "assumptions"
  | "model"
  | "sensitivity"
  | "premortem"
  | "financials"
  | "brief"
  | "log"
  | "settings";

const confidenceLevels: Confidence[] = ["Low", "Medium", "High"];
const impactLevels: Impact[] = ["Low", "Medium", "High"];
const tabs: { id: WorkspaceTab; label: string; icon: typeof BookOpen }[] = [
  { id: "overview", label: "Overview", icon: BookOpen },
  { id: "evidence", label: "Evidence", icon: ShieldCheck },
  { id: "assumptions", label: "Assumptions", icon: AlertTriangle },
  { id: "model", label: "Decision Model", icon: Gauge },
  { id: "sensitivity", label: "Sensitivity", icon: GitBranch },
  { id: "premortem", label: "Pre-Mortem", icon: ClipboardList },
  { id: "financials", label: "Financials", icon: BarChart3 },
  { id: "brief", label: "Brief", icon: FileText },
  { id: "log", label: "Decision Log", icon: Archive },
  { id: "settings", label: "Settings", icon: ShieldCheck }
];

const makeId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const todayIso = () => new Date().toISOString();

function downloadText(filename: string, text: string, mime = "text/plain") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function markdownToPlainText(markdown: string): string {
  return markdown
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*]\s+/gm, "• ")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1 ($2)")
    .replace(/`([^`]+)`/g, "$1")
    .trim();
}

export function App() {
  const [store, setStore] = useState<StrategyStore>(() => loadStore());
  const [activeProjectId, setActiveProjectId] = useState(store.projects[0]?.id ?? "");
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("overview");
  const [openRouterKey, setOpenRouterKeyState] = useState(() => getOpenRouterApiKey());
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
  const [configModal, setConfigModal] = useState<"type" | "status" | "source" | null>(null);
  const [confirmation, setConfirmation] = useState<{
    title: string;
    body: string;
    confirmLabel: string;
    onConfirm: () => void | Promise<void>;
  } | null>(null);
  const [globalSettingsOpen, setGlobalSettingsOpen] = useState(false);
  const [settingsSection, setSettingsSection] = useState<"openrouter" | "types" | "statuses" | "sources">("openrouter");
  const [uploadStatus, setUploadStatus] = useState("");
  const [aiError, setAiError] = useState("");
  const [aiProgress, setAiProgress] = useState({
    isRunning: false,
    percent: 0,
    label: ""
  });
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [briefPreviewMode, setBriefPreviewMode] = useState<"executive" | "detailed">("executive");
  const [briefDisplayMode, setBriefDisplayMode] = useState<"text" | "markdown">("text");
  const [lastOutputRefresh, setLastOutputRefresh] = useState(() => new Date().toLocaleTimeString());
  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const [csvRows, setCsvRows] = useState<Record<string, string | number>[]>([]);
  const [xField, setXField] = useState("");
  const [yField, setYField] = useState("");
  const [chartType, setChartType] = useState<"line" | "bar">("line");

  useEffect(() => saveStore(store), [store]);
  useEffect(() => {
    loadStoreAsync().then((loaded) => {
      setStore(loaded);
      setActiveProjectId((current) => current || loaded.projects[0]?.id || "");
    });
  }, []);

  const project = store.projects.find((item) => item.id === activeProjectId) ?? store.projects[0];
  const projectId = project?.id ?? "";
  const evidence = store.evidence.filter((item) => item.projectId === projectId);
  const assumptions = store.assumptions.filter((item) => item.projectId === projectId);
  const options = store.options.filter((item) => item.projectId === projectId);
  const criteria = store.criteria.filter((item) => item.projectId === projectId);
  const scores = store.scores.filter((score) => options.some((option) => option.id === score.optionId));
  const premortems = store.premortems.filter((item) => item.projectId === projectId);
  const chartInsights = store.chartInsights.filter((item) => item.projectId === projectId);
  const extractedDocuments = store.extractedDocuments.filter((item) => item.projectId === projectId);
  const documentChunks = store.documentChunks.filter((item) => item.projectId === projectId);
  const aiCandidates = store.aiCandidates.filter((item) => item.projectId === projectId);
  const pendingCandidates = aiCandidates.filter((item) => item.status === "Pending");
  const totals = useMemo(() => calculateOptionTotals(options, criteria, scores), [options, criteria, scores]);
  const brief = useMemo(() => generateMarkdownBrief(store, projectId), [store, projectId]);
  const detailedBrief = useMemo(() => generateDetailedBrief(store, projectId), [store, projectId]);
  const activePreviewBrief = briefPreviewMode === "executive" ? brief : detailedBrief;
  const activePreviewText = markdownToPlainText(activePreviewBrief);
  const numericFields = getNumericFields(csvRows);
  const summary = yField ? summarizeField(csvRows, yField) : undefined;

  function updateStore(next: StrategyStore) {
    setStore(next);
    setLastOutputRefresh(new Date().toLocaleTimeString());
  }

  function updateOpenRouterKey(value: string) {
    setOpenRouterKeyState(value);
    setOpenRouterApiKey(value);
  }

  function openSettings() {
    setGlobalSettingsOpen(true);
  }

  function requestConfirmation(
    title: string,
    body: string,
    confirmLabel: string,
    onConfirm: () => void | Promise<void>
  ) {
    setConfirmation({ title, body, confirmLabel, onConfirm });
  }

  function patchProject(patch: Partial<Project>) {
    updateStore({
      ...store,
      projects: store.projects.map((item) =>
        item.id === projectId ? { ...item, ...patch, updatedAt: todayIso() } : item
      )
    });
  }

  function createProject() {
    const id = makeId("proj");
    const nextProject: Project = {
      id,
      title: "Untitled Strategy Project",
      type: "Market Entry",
      decisionQuestion: "What decision needs to be made?",
      timeHorizon: "Next 12 months",
      owner: "Owner",
      status: "Draft",
      createdAt: todayIso(),
      updatedAt: todayIso()
    };
    updateStore({ ...store, projects: [nextProject, ...store.projects] });
    setActiveProjectId(id);
    setActiveTab("overview");
  }

  function duplicateProject() {
    if (!project) return;
    const id = makeId("proj");
    const copyMap = new Map<string, string>();
    const cloneId = (oldId: string, prefix: string) => {
      const next = makeId(prefix);
      copyMap.set(oldId, next);
      return next;
    };
    const copiedOptions = options.map((item) => ({ ...item, id: cloneId(item.id, "op"), projectId: id }));
    const copiedCriteria = criteria.map((item) => ({ ...item, id: cloneId(item.id, "cr"), projectId: id }));
    const copiedEvidence = evidence.map((item) => ({ ...item, id: cloneId(item.id, "ev"), projectId: id }));
    updateStore({
      ...store,
      projects: [
        { ...project, id, title: `${project.title} copy`, status: "Draft", createdAt: todayIso(), updatedAt: todayIso() },
        ...store.projects
      ],
      evidence: [...copiedEvidence, ...store.evidence],
      assumptions: [
        ...assumptions.map((item) => ({
          ...item,
          id: makeId("as"),
          projectId: id,
          linkedEvidenceIds: item.linkedEvidenceIds.map((evId) => copyMap.get(evId) ?? evId)
        })),
        ...store.assumptions
      ],
      options: [...copiedOptions, ...store.options],
      criteria: [...copiedCriteria, ...store.criteria],
      scores: [
        ...scores.map((item) => ({
          ...item,
          id: makeId("sc"),
          optionId: copyMap.get(item.optionId) ?? item.optionId,
          criterionId: copyMap.get(item.criterionId) ?? item.criterionId
        })),
        ...store.scores
      ],
      premortems: [...premortems.map((item) => ({ ...item, id: makeId("pm"), projectId: id })), ...store.premortems],
      decisionLog: store.decisionLog,
      chartInsights: [...chartInsights.map((item) => ({ ...item, id: makeId("ci"), projectId: id })), ...store.chartInsights]
    });
    setActiveProjectId(id);
  }

  function deleteProject() {
    if (!project || store.projects.length <= 1) return;
    const nextProjects = store.projects.filter((item) => item.id !== projectId);
    updateStore({
      ...store,
      projects: nextProjects,
      evidence: store.evidence.filter((item) => item.projectId !== projectId),
      assumptions: store.assumptions.filter((item) => item.projectId !== projectId),
      options: store.options.filter((item) => item.projectId !== projectId),
      criteria: store.criteria.filter((item) => item.projectId !== projectId),
      premortems: store.premortems.filter((item) => item.projectId !== projectId),
      decisionLog: store.decisionLog.filter((item) => item.projectId !== projectId),
      chartInsights: store.chartInsights.filter((item) => item.projectId !== projectId)
    });
    setActiveProjectId(nextProjects[0].id);
  }

  function addEvidence() {
    setEvidenceModalOpen(true);
  }

  function commitEvidenceDraft(draft: Omit<EvidenceItem, "id" | "projectId">) {
    const item: EvidenceItem = {
      ...draft,
      id: makeId("ev"),
      projectId,
      provenance: "User"
    };
    updateStore({ ...store, evidence: [item, ...store.evidence] });
    setEvidenceModalOpen(false);
  }

  function updateEvidence(id: string, patch: Partial<EvidenceItem>) {
    updateStore({ ...store, evidence: store.evidence.map((item) => (item.id === id ? { ...item, ...patch } : item)) });
  }

  function addAssumption() {
    const item: Assumption = {
      id: makeId("as"),
      projectId,
      statement: "State the material assumption.",
      impact: "High",
      confidence: "Low",
      validationTest: "What would validate it?",
      invalidationTrigger: "What would invalidate it?",
      linkedEvidenceIds: [],
      provenance: "User"
    };
    updateStore({ ...store, assumptions: [item, ...store.assumptions] });
  }

  function updateAssumption(id: string, patch: Partial<Assumption>) {
    updateStore({
      ...store,
      assumptions: store.assumptions.map((item) => (item.id === id ? { ...item, ...patch } : item))
    });
  }

  function addOption() {
    const option: DecisionOption = {
      id: makeId("op"),
      projectId,
      name: "New option",
      description: "Describe this option.",
      provenance: "User"
    };
    updateStore({ ...store, options: [...store.options, option] });
  }

  function addCriterion() {
    const criterion: Criterion = { id: makeId("cr"), projectId, name: "New criterion", weight: 0, provenance: "User" };
    updateStore({ ...store, criteria: [...store.criteria, criterion] });
  }

  function deleteOption(optionId: string) {
    updateStore({
      ...store,
      options: store.options.filter((item) => item.id !== optionId),
      scores: store.scores.filter((item) => item.optionId !== optionId)
    });
  }

  function deleteCriterion(criterionId: string) {
    updateStore({
      ...store,
      criteria: store.criteria.filter((item) => item.id !== criterionId),
      scores: store.scores.filter((item) => item.criterionId !== criterionId)
    });
  }

  function updateScore(optionId: string, criterionId: string, value: number, rationale?: string) {
    const existing = store.scores.find((item) => item.optionId === optionId && item.criterionId === criterionId);
    if (existing) {
      updateStore({
        ...store,
        scores: store.scores.map((item) =>
          item.id === existing.id ? { ...item, score: value, rationale: rationale ?? item.rationale, provenance: item.provenance === "AI" ? "AIEdited" : item.provenance ?? "User" } : item
        )
      });
      return;
    }
    updateStore({
      ...store,
      scores: [
        ...store.scores,
        { id: makeId("sc"), optionId, criterionId, score: value, rationale: rationale ?? "", provenance: "User" }
      ]
    });
  }

  function addPremortem() {
    const item: PremortemItem = {
      id: makeId("pm"),
      projectId,
      failureCause: "Recommendation fails because...",
      likelihood: 3,
      severity: 3,
      mitigation: "Mitigation action",
      earlyWarning: "Early warning indicator",
      owner: "Owner",
      provenance: "User"
    };
    updateStore({ ...store, premortems: [item, ...store.premortems] });
  }

  function updatePremortem(id: string, patch: Partial<PremortemItem>) {
    updateStore({
      ...store,
      premortems: store.premortems.map((item) => (item.id === id ? { ...item, ...patch } : item))
    });
  }

  function importJson(file: File) {
    file.text().then((text) => {
      const parsed = JSON.parse(text) as StrategyStore;
      const normalized = ensureStoreConfig(parsed);
      setStore(normalized);
      setActiveProjectId(normalized.projects[0]?.id ?? "");
    });
  }

  function parseCsv(file: File) {
    Papa.parse<Record<string, string | number>>(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (result) => {
        const rows = result.data;
        setCsvRows(rows);
        const fields = Object.keys(rows[0] ?? {});
        setXField(fields[0] ?? "");
        setYField(getNumericFields(rows)[0] ?? "");
      }
    });
  }

  function saveChartInsight() {
    if (!project || !summary) return;
    const insight: ChartInsight = {
      id: makeId("ci"),
      projectId,
      title: `${yField} trend`,
      summary: `${yField} average is ${summary.average}, ranging from ${summary.min} to ${summary.max}.`,
      xField,
      yField,
      chartType,
      createdAt: todayIso()
    };
    const evidenceItem: EvidenceItem = {
      id: makeId("ev"),
      projectId,
      sourceTitle: `CSV insight: ${insight.title}`,
      sourceType: "UserProvided",
      sourceDate: new Date().toISOString().slice(0, 10),
      claim: insight.summary,
      implication: "Review whether this metric changes the recommendation or risk posture.",
      confidence: "Medium",
      relevance: 4,
      notes: "Generated from local CSV upload."
    };
    updateStore({
      ...store,
      chartInsights: [insight, ...store.chartInsights],
      evidence: [evidenceItem, ...store.evidence]
    });
  }

  async function uploadSourceDocuments(files: FileList | File[]) {
    if (!project) return;
    setAiError("");
    setUploadStatus("Extracting text from uploaded files...");
    const fileArray = Array.from(files);
    try {
      const { extractFileToChunks } = await import("../lib/documentIngestion");
      const results = await Promise.all(fileArray.map((file) => extractFileToChunks(projectId, file)));
      const documents = results.map((result) => result.document);
      const chunks = results.flatMap((result) => result.chunks);
      updateStore({
        ...store,
        extractedDocuments: [...documents, ...store.extractedDocuments],
        documentChunks: [...chunks, ...store.documentChunks]
      });
      setUploadStatus(`Extracted ${chunks.length} text chunks from ${documents.length} file(s). Review limitations below before AI analysis.`);
    } catch (error) {
      setAiError(error instanceof Error ? error.message : "Document extraction failed.");
      setUploadStatus("");
    }
  }

  async function runAiOnChunks(chunks: DocumentChunk[]) {
    if (!project) return;
    if (!openRouterKey.trim()) {
      setAiError("Add an OpenRouter API key in Settings before running AI extraction.");
      setAiProgress({ isRunning: false, percent: 0, label: "" });
      return;
    }
    if (!chunks.length) {
      setAiError("Upload or retain at least one text chunk before running AI extraction.");
      setAiProgress({ isRunning: false, percent: 0, label: "" });
      return;
    }
    setAiError("");
    setUploadStatus("Running OpenRouter extraction. Large documents may take a while...");
    setAiProgress({ isRunning: true, percent: 8, label: "Preparing retained text chunks..." });
    const selectedModel = store.config.aiSettings.customModelId.trim() || store.config.aiSettings.selectedModel;
    let progress = 8;
    const progressTimer = window.setInterval(() => {
      progress = Math.min(progress + 4, 88);
      setAiProgress({
        isRunning: true,
        percent: progress,
        label: progress < 35 ? "Preparing request..." : progress < 70 ? "Waiting for model analysis..." : "Parsing structured outputs..."
      });
    }, 1000);
    try {
      const candidates = await extractCandidatesWithOpenRouter({
        apiKey: openRouterKey,
        model: selectedModel,
        siteUrl: store.config.aiSettings.siteUrl,
        appTitle: store.config.aiSettings.appTitle,
        projectId,
        projectTitle: project.title,
        decisionQuestion: project.decisionQuestion,
        enableWebSearch: webSearchEnabled,
        chunks: chunks.slice(0, 6).map((chunk) => ({
          fileName: chunk.fileName,
          sourceReference: chunk.pageStart
            ? `pages ${chunk.pageStart}-${chunk.pageEnd ?? chunk.pageStart}`
            : `chunk ${chunk.chunkIndex}`,
          text: chunk.text
        }))
      });
      window.clearInterval(progressTimer);
      updateStore({ ...store, aiCandidates: [...candidates, ...store.aiCandidates] });
      setUploadStatus(`Generated ${candidates.length} AI review candidate(s). Review and accept before committing.`);
      setAiProgress({ isRunning: false, percent: 100, label: "Analysis complete." });
      window.setTimeout(() => setAiProgress({ isRunning: false, percent: 0, label: "" }), 2500);
    } catch (error) {
      window.clearInterval(progressTimer);
      setAiError(error instanceof Error ? error.message : "OpenRouter extraction failed.");
      setUploadStatus("");
      setAiProgress({ isRunning: false, percent: 0, label: "Analysis failed." });
    }
  }

  async function refreshOpenRouterModels() {
    setAiError("");
    setUploadStatus("Refreshing OpenRouter model metadata...");
    try {
      const metadata = (await fetchOpenRouterModels(openRouterKey || undefined)).sort((a, b) =>
        (a.name || a.id).localeCompare(b.name || b.id)
      );
      updateStore({ ...store, config: { ...store.config, modelMetadata: metadata } });
      setUploadStatus(`Loaded ${metadata.length} OpenRouter model records.`);
    } catch (error) {
      setAiError(error instanceof Error ? error.message : "Could not refresh OpenRouter models.");
      setUploadStatus("");
    }
  }

  function purgeExtractedText() {
    updateStore({
      ...store,
      extractedDocuments: store.extractedDocuments.map((item) =>
        item.projectId === projectId ? { ...item, textRetained: false } : item
      ),
      documentChunks: store.documentChunks.filter((item) => item.projectId !== projectId)
    });
  }

  function acceptCandidate(candidate: AiCandidate) {
    const next = applyAiCandidate(store, candidate);
    updateStore({
      ...next,
      decisionLog: [
        {
          id: makeId("dl"),
          projectId,
          timestamp: todayIso(),
          decisionChange: `Accepted AI ${formatCandidateKind(candidate.kind)} candidate`,
          reason: candidate.whyBetter || candidate.rationale,
          evidenceAdded: candidate.kind === "Evidence" ? candidate.id : undefined
        },
        ...next.decisionLog
      ]
    });
  }

  function updateCandidate(candidateId: string, patch: Partial<AiCandidate>) {
    const normalizeForComparison = (value: unknown) => JSON.stringify(value ?? null);
    updateStore({
      ...store,
      aiCandidates: store.aiCandidates.map((item) =>
        item.id === candidateId
          ? (() => {
              const originalPayload = item.originalPayload ?? item.payload;
              const originalRationale = item.originalRationale ?? item.rationale;
              const originalWhyBetter = item.originalWhyBetter ?? item.whyBetter;
              const next = { ...item, originalPayload, originalRationale, originalWhyBetter, ...patch };
              const modifiedByUser =
                normalizeForComparison(next.payload) !== normalizeForComparison(originalPayload) ||
                normalizeForComparison(next.rationale) !== normalizeForComparison(originalRationale) ||
                normalizeForComparison(next.whyBetter) !== normalizeForComparison(originalWhyBetter);
              return { ...next, modifiedByUser };
            })()
          : item
      )
    });
  }

  function rejectCandidate(candidateId: string) {
    updateStore({
      ...store,
      aiCandidates: store.aiCandidates.map((item) =>
        item.id === candidateId ? { ...item, status: "Rejected" } : item
      )
    });
  }

  if (!project) {
    return <div className="p-8">No project data available.</div>;
  }

  const chartData = csvRows.map((row) => ({ ...row, [yField]: Number(row[yField]) }));

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="no-print border-b border-ink bg-ink px-4 py-3 text-white shadow-sm">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal">Stratis</p>
            <h1 className="text-xl font-semibold">Strategy & Insight Engine</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="inline-flex items-center gap-2 rounded-md bg-teal px-3 py-2 text-sm font-medium text-white"
              onClick={() =>
                requestConfirmation(
                  "Create new project?",
                  "This will create a new draft project and switch your workspace to it. Your current project is already autosaved.",
                  "Create project",
                  createProject
                )
              }
            >
              <Plus size={16} /> Project
            </button>
            <button className="inline-flex items-center gap-2 rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm" onClick={openSettings}>
              <Settings size={16} /> Settings
            </button>
            <button className="inline-flex items-center gap-2 rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm" onClick={() => downloadText("strategy-store.json", exportStore(store), "application/json")}>
              <Download size={16} /> JSON
            </button>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm">
              <Upload size={16} /> Import
              <input
                className="hidden"
                type="file"
                accept="application/json"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  requestConfirmation(
                    "Import project JSON?",
                    "This replaces the current local workspace data with the imported JSON. Export the current workspace first if you need a backup.",
                    "Import JSON",
                    () => importJson(file)
                  );
                  event.target.value = "";
                }}
              />
            </label>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1500px] grid-cols-1 gap-4 p-4 lg:grid-cols-[280px_minmax(0,1fr)_360px]">
        <aside className="no-print rounded-lg border border-line bg-white p-3 shadow-panel lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:overflow-auto">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase text-moss">Projects</h2>
            <button
              aria-label="Duplicate project"
              className="rounded-md border border-line p-2"
              onClick={() =>
                requestConfirmation(
                  "Duplicate current project?",
                  "This creates a new draft copy of the current project and switches your workspace to the copy.",
                  "Duplicate",
                  duplicateProject
                )
              }
            >
              <RefreshCw size={16} />
            </button>
          </div>
          <div className="space-y-2">
            {store.projects.map((item) => (
              <button
                key={item.id}
                className={`w-full rounded-md border p-3 text-left ${item.id === projectId ? "border-ink bg-paper" : "border-line bg-white"}`}
                onClick={() => setActiveProjectId(item.id)}
              >
                <span className="block text-sm font-semibold">{item.title}</span>
                <span className="mt-1 block text-xs text-moss">{item.type} · {item.status}</span>
              </button>
            ))}
          </div>
        </aside>

        <section className="min-w-0">
          <BulkUploadPanel
            documents={extractedDocuments}
            chunks={documentChunks}
            pendingCount={pendingCandidates.length}
            uploadStatus={uploadStatus}
            aiError={aiError}
            aiProgress={aiProgress}
            webSearchEnabled={webSearchEnabled}
            onWebSearchEnabled={setWebSearchEnabled}
            onUpload={uploadSourceDocuments}
            onRunAi={() =>
              requestConfirmation(
                webSearchEnabled ? "Analyse With Web Search?" : "Analyse Retained Text Chunks?",
                webSearchEnabled
                  ? "This sends retained extracted text chunks to OpenRouter and may search current public sources for cross-reference. Online findings return as review candidates and may add token costs from your selected model."
                  : "This sends retained extracted text chunks to OpenRouter using your session API key. Review cost and confidentiality before continuing.",
                "Analyse",
                () => runAiOnChunks(documentChunks)
              )
            }
            onPurge={() =>
              requestConfirmation(
                "Purge extracted text?",
                "This removes retained extracted text chunks for the current project. Source filenames, extracted document records, and accepted structured outputs remain.",
                "Purge text",
                purgeExtractedText
              )
            }
          />

          <div className="rounded-lg border border-line bg-white p-4 shadow-panel">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <label className="grid gap-1 text-sm">
                <span className="font-medium">Project Title</span>
                <AutoGrowTextarea value={project.title} onChange={(value) => patchProject({ title: value })} ariaLabel="Project title" />
              </label>
              <label className="grid gap-1 text-sm sm:col-span-2">
                <span className="font-medium">Decision Question</span>
                <AutoGrowTextarea value={project.decisionQuestion} onChange={(value) => patchProject({ decisionQuestion: value })} ariaLabel="Decision question" />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="font-medium">Type</span>
                <select className="min-w-0 truncate rounded-md border border-line px-3 py-2" title={project.type} value={project.type} onChange={(event) => patchProject({ type: event.target.value })}>
                  {store.config.projectTypes.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <label className="grid gap-1 text-sm">
                <span className="font-medium">Horizon</span>
                <AutoGrowTextarea value={project.timeHorizon} onChange={(value) => patchProject({ timeHorizon: value })} ariaLabel="Time horizon" />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="font-medium">Owner</span>
                <AutoGrowTextarea value={project.owner} onChange={(value) => patchProject({ owner: value })} ariaLabel="Owner" />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="font-medium">Status</span>
                <select className="min-w-0 truncate rounded-md border border-line px-3 py-2" title={project.status} value={project.status} onChange={(event) => patchProject({ status: event.target.value })}>
                  {store.config.projectStatuses.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
            </div>
          </div>

          <nav className="no-print mt-4 flex gap-2 overflow-x-auto pb-2" aria-label="Workspace tabs">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                className={`inline-flex shrink-0 items-center gap-2 rounded-md border px-3 py-2 text-sm ${activeTab === id ? "border-ink bg-ink text-white" : "border-line bg-white"}`}
                onClick={() => setActiveTab(id)}
              >
                <Icon size={16} /> {label}
              </button>
            ))}
          </nav>

          <div ref={workspaceRef} className="mt-4 rounded-lg border border-line bg-white p-4 shadow-panel">
            {activeTab === "overview" && (
              <Overview evidence={evidence} assumptions={assumptions} totals={totals} premortems={premortems} />
            )}
            {activeTab === "evidence" && (
              <EvidenceWorkspace sourceTypes={store.config.sourceTypes} evidence={evidence} onAdd={addEvidence} onUpdate={updateEvidence} onDelete={(id) => updateStore({ ...store, evidence: store.evidence.filter((item) => item.id !== id) })} />
            )}
            {activeTab === "overview" && pendingCandidates.length > 0 && (
              <StructuredAiReviewQueue
                candidates={aiCandidates}
                sourceTypes={store.config.sourceTypes}
                onAddSourceType={(value) => {
                  const canonical = canonicalizeSourceType(value);
                  if (!canonical || isDuplicateOption(canonical, store.config.sourceTypes)) return false;
                  updateStore({ ...store, config: { ...store.config, sourceTypes: [...store.config.sourceTypes, canonical] } });
                  return true;
                }}
                onUpdate={updateCandidate}
                onAccept={acceptCandidate}
                onReject={rejectCandidate}
              />
            )}
            {activeTab === "assumptions" && (
              <AssumptionsWorkspace assumptions={assumptions} evidence={evidence} onAdd={addAssumption} onUpdate={updateAssumption} />
            )}
            {activeTab === "model" && (
              <DecisionModelWorkspace
                store={store}
                projectId={projectId}
                options={options}
                criteria={criteria}
                scores={scores}
                totals={totals}
                onUpdate={updateStore}
                onAddOption={() =>
                  requestConfirmation(
                    "Add decision option?",
                    "This adds a new blank strategic option to the scoring matrix for the current project.",
                    "Add option",
                    addOption
                  )
                }
                onAddCriterion={() =>
                  requestConfirmation(
                    "Add scoring criterion?",
                    "This adds a new blank criterion with 0% weight. Update weights so they sum to 100% before using the recommendation.",
                    "Add criterion",
                    addCriterion
                  )
                }
                onDeleteOption={(option) =>
                  requestConfirmation(
                    "Delete decision option?",
                    `This removes "${option.name}" and all scores attached to this option.`,
                    "Delete option",
                    () => deleteOption(option.id)
                  )
                }
                onDeleteCriterion={(criterion) =>
                  requestConfirmation(
                    "Delete scoring criterion?",
                    `This removes "${criterion.name}" and all scores attached to this criterion.`,
                    "Delete criterion",
                    () => deleteCriterion(criterion.id)
                  )
                }
                onUpdateScore={updateScore}
              />
            )}
            {activeTab === "sensitivity" && (
              <SensitivityWorkspace options={options} criteria={criteria} scores={scores} />
            )}
            {activeTab === "premortem" && (
              <PremortemWorkspace premortems={premortems} onAdd={addPremortem} onUpdate={updatePremortem} />
            )}
            {activeTab === "financials" && (
              <FinancialWorkspace
                csvRows={csvRows}
                xField={xField}
                yField={yField}
                chartType={chartType}
                numericFields={numericFields}
                summary={summary}
                chartData={chartData}
                chartInsights={chartInsights}
                onCsv={parseCsv}
                onX={setXField}
                onY={setYField}
                onChartType={setChartType}
                onSaveInsight={saveChartInsight}
              />
            )}
            {activeTab === "brief" && (
              <BriefWorkspace brief={brief} project={project} />
            )}
            {activeTab === "log" && (
              <DecisionLogWorkspace store={store} projectId={projectId} onUpdate={updateStore} />
            )}
            {activeTab === "settings" && (
              <ProjectSettingsWorkspace
                onClear={() =>
                  requestConfirmation(
                    "Clear all local data?",
                    "This removes local projects, extracted text, AI candidates, and settings from this browser. Export JSON first if you need a backup.",
                    "Clear local data",
                    () => {
                      clearStore();
                      window.location.reload();
                    }
                  )
                }
                onDeleteProject={() =>
                  requestConfirmation(
                    "Delete current project?",
                    "This removes the current project and all related evidence, assumptions, scores, risks, document chunks, and AI candidates from local storage.",
                    "Delete project",
                    deleteProject
                  )
                }
              />
            )}
          </div>
        </section>

        <aside className="rounded-lg border border-line bg-white p-4 shadow-panel lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:overflow-auto">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold uppercase text-moss">Brief Preview</h2>
              <select
                className="rounded-md border border-line px-2 py-1 text-xs"
                value={briefPreviewMode}
                onChange={(event) => setBriefPreviewMode(event.target.value as "executive" | "detailed")}
                aria-label="Brief preview mode"
              >
                <option value="executive">Executive</option>
                <option value="detailed">Detailed</option>
              </select>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className={briefDisplayMode === "text" ? "font-semibold" : "text-moss"}>Text</span>
              <ToggleSwitch enabled={briefDisplayMode === "markdown"} onChange={(enabled) => setBriefDisplayMode(enabled ? "markdown" : "text")} label="Toggle Markdown Display" />
              <span className={briefDisplayMode === "markdown" ? "font-semibold" : "text-moss"}>Markdown</span>
            </div>
          </div>
          <div className="mt-3 rounded-md border border-line bg-paper p-3 text-sm">
            <p className="font-semibold">{project.title}</p>
            <p className="mt-2 text-moss">{project.decisionQuestion}</p>
            <p className="mt-3">Recommendation: <strong>{totals[0]?.optionName ?? "Not scored"}</strong></p>
          </div>
          {briefDisplayMode === "markdown" ? (
            <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap rounded-md border border-line bg-white p-3 text-xs leading-5">
              {activePreviewBrief}
            </pre>
          ) : (
            <MarkdownTextView markdown={activePreviewBrief} plainText={activePreviewText} />
          )}
          <p className="mt-2 text-xs text-moss">Live preview recalculates from current project inputs. Last updated: {lastOutputRefresh}</p>
          <div className="mt-4 space-y-2 text-sm">
            <Metric label="Evidence" value={evidence.length.toString()} />
            <Metric label="High-impact assumptions" value={assumptions.filter((item) => item.impact === "High").length.toString()} />
            <Metric label="Weights" value={`${getWeightTotal(criteria)}%`} warning={!weightsAreValid(criteria)} />
            <Metric label="Top risks" value={premortems.length.toString()} />
          </div>
          <button className="mt-4 w-full rounded-md bg-ink px-3 py-2 text-sm font-medium text-white" onClick={() => downloadText(`${project.title.split(" ").join("-").toLowerCase()}-${briefPreviewMode}-brief.md`, activePreviewBrief)}>
            Export {briefPreviewMode === "executive" ? "Executive" : "Detailed"} Brief
          </button>
        </aside>
      </main>
      {evidenceModalOpen && (
        <EvidenceModal
          sourceTypes={store.config.sourceTypes}
          openRouterReady={Boolean(openRouterKey.trim())}
          onClose={() => setEvidenceModalOpen(false)}
          onSave={commitEvidenceDraft}
          onUpload={(files) => uploadSourceDocuments(files)}
          onRunAiFromText={async (draftText) => {
            const chunk: DocumentChunk = {
              id: makeId("chunk"),
              documentId: makeId("doc"),
              projectId,
              fileName: "Manual evidence modal",
              chunkIndex: 1,
              text: draftText,
              estimatedTokens: Math.ceil(draftText.length / 4)
            };
            await runAiOnChunks([chunk]);
            setEvidenceModalOpen(false);
            setActiveTab("overview");
          }}
        />
      )}
      {configModal && (
        <AddConfigOptionModal
          title={configModal === "type" ? "Add Project Type" : configModal === "status" ? "Add Project Status" : "Add Source Category"}
          helperText={configModal === "type" ? "Enter a new project type" : configModal === "status" ? "Enter a new project status" : "Enter a new evidence source category"}
          existingValues={configModal === "type" ? store.config.projectTypes : configModal === "status" ? store.config.projectStatuses : store.config.sourceTypes}
          onClose={() => setConfigModal(null)}
          onSave={(value) => {
            const normalized = configModal === "source" ? canonicalizeSourceType(value) : normalizeOption(value);
            if (configModal === "type") {
              updateStore({
                ...store,
                config: { ...store.config, projectTypes: [...store.config.projectTypes, normalized] }
              });
            } else if (configModal === "status") {
              updateStore({
                ...store,
                config: { ...store.config, projectStatuses: [...store.config.projectStatuses, normalized] }
              });
            } else {
              updateStore({
                ...store,
                config: { ...store.config, sourceTypes: [...store.config.sourceTypes, normalized] }
              });
            }
            setConfigModal(null);
          }}
        />
      )}
      {globalSettingsOpen && (
        <GlobalSettingsModal
          activeSection={settingsSection}
          onSection={setSettingsSection}
          onClose={() => setGlobalSettingsOpen(false)}
        >
          <SettingsWorkspace
            store={store}
            openRouterKey={openRouterKey}
            activeSection={settingsSection}
            onUpdate={updateStore}
            onOpenRouterKey={updateOpenRouterKey}
            onRefreshModels={refreshOpenRouterModels}
            onOpenConfigModal={setConfigModal}
          />
        </GlobalSettingsModal>
      )}
      {confirmation && (
        <ConfirmDialog
          title={confirmation.title}
          body={confirmation.body}
          confirmLabel={confirmation.confirmLabel}
          onCancel={() => setConfirmation(null)}
          onConfirm={async () => {
            const action = confirmation.onConfirm;
            setConfirmation(null);
            await action();
          }}
        />
      )}
    </div>
  );
}

function AutoGrowTextarea({
  value,
  onChange,
  ariaLabel
}: {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
}) {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${Math.max(element.scrollHeight, 42)}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      className="min-h-[42px] resize-none overflow-hidden rounded-md border border-line px-3 py-2 leading-5"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label={ariaLabel}
      rows={1}
    />
  );
}

function BulkUploadPanel({
  documents,
  chunks,
  pendingCount,
  uploadStatus,
  aiError,
  aiProgress,
  webSearchEnabled,
  onWebSearchEnabled,
  onUpload,
  onRunAi,
  onPurge
}: {
  documents: ExtractedDocument[];
  chunks: DocumentChunk[];
  pendingCount: number;
  uploadStatus: string;
  aiError: string;
  aiProgress: { isRunning: boolean; percent: number; label: string };
  webSearchEnabled: boolean;
  onWebSearchEnabled: (enabled: boolean) => void;
  onUpload: (files: FileList | File[]) => void;
  onRunAi: () => void;
  onPurge: () => void;
}) {
  return (
    <section className="mb-4 rounded-lg border border-line bg-white p-4 shadow-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Bulk Document Ingestion</h2>
          <p className="copy-block mt-1 text-sm text-moss">
            Upload text-extractable PDF, DOCX, CSV, TXT, MD, or JSON files. v1 does not support OCR,
            scanned PDFs, image-only annual reports, password-protected files, or reliable PDF table
            reconstruction. Original files are not retained; extracted text chunks can be purged after review.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-line px-3 py-2 text-sm">
            <Upload size={16} /> Upload docs
            <input
              className="hidden"
              type="file"
              multiple
              accept=".pdf,.docx,.csv,.txt,.md,.json,text/plain,text/markdown,text/csv,application/json,application/pdf"
              onChange={(event) => event.target.files && onUpload(event.target.files)}
            />
          </label>
          <button className="inline-flex items-center gap-2 rounded-md bg-ink px-3 py-2 text-sm font-medium text-white disabled:opacity-50" disabled={aiProgress.isRunning} onClick={onRunAi}>
            <Sparkles size={16} /> Analyse
          </button>
          <button className="rounded-md border border-line px-3 py-2 text-sm" onClick={onPurge}>
            Purge extracted text
          </button>
        </div>
      </div>
      <div className="mt-3 flex items-start gap-3 rounded-md border border-line bg-paper p-3 text-sm">
        <ToggleSwitch enabled={webSearchEnabled} onChange={onWebSearchEnabled} label="Allow Web Search During Analysis" />
        <div className="copy-block">
          <span className="block font-semibold">Allow Web Search During Analysis</span>
          <span className="mt-1 block text-moss">
            Enabling this toggle allows the selected model to analyse uploaded documents, find current public sources, and cross-reference uploaded text.
            Online findings are staged in the AI Review Queue and must be accepted before they affect evidence, assumptions, or briefs. This can add token costs from your selected model.
          </span>
        </div>
      </div>
      {(uploadStatus || aiError) && (
        <div className={`mt-3 rounded-md border p-3 text-sm ${aiError ? "border-rust bg-rust/5 text-rust" : "border-line bg-paper"}`}>
          {aiError || uploadStatus}
        </div>
      )}
      {(aiProgress.isRunning || aiProgress.label) && (
        <div className={`mt-3 rounded-md border p-3 text-sm ${aiProgress.label === "Analysis failed." ? "border-rust bg-rust/5 text-rust" : "border-line bg-white"}`}>
          <div className="flex items-center justify-between gap-3">
            <span className="font-medium">{aiProgress.label}</span>
            <span>{aiProgress.percent}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full bg-teal transition-all" style={{ width: `${aiProgress.percent}%` }} />
          </div>
        </div>
      )}
      <div className="mt-3 grid gap-2 md:grid-cols-3">
        <Metric label="Documents referenced" value={documents.length.toString()} />
        <Metric label="Retained text chunks" value={chunks.length.toString()} />
        <Metric label="Pending AI review" value={pendingCount.toString()} warning={pendingCount > 0} />
      </div>
      {documents.length > 0 && (
        <div className="mt-3 grid gap-2">
          {documents.slice(0, 4).map((document) => (
            <div key={document.id} className="rounded-md border border-line p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <strong>{document.fileName}</strong>
                <span>{document.chunkCount} chunks · {document.textRetained ? "text retained" : "text purged"}</span>
              </div>
              {document.limitationNote && <p className="mt-1 text-rust">{document.limitationNote}</p>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function StructuredAiReviewQueue({
  candidates,
  sourceTypes,
  onAddSourceType,
  onUpdate,
  onAccept,
  onReject
}: {
  candidates: AiCandidate[];
  sourceTypes: string[];
  onAddSourceType: (value: string) => boolean;
  onUpdate: (candidateId: string, patch: Partial<AiCandidate>) => void;
  onAccept: (candidate: AiCandidate) => void;
  onReject: (id: string) => void;
}) {
  const kinds = useMemo(() => Array.from(new Set(candidates.map((candidate) => candidate.kind))), [candidates]);
  const [activeKind, setActiveKind] = useState<AiCandidate["kind"]>(kinds[0] ?? "Evidence");
  const [activeCandidateId, setActiveCandidateId] = useState("");
  const activeCandidates = candidates.filter((candidate) => candidate.kind === activeKind);
  const activePending = activeCandidates.filter((candidate) => candidate.status === "Pending");
  const activeCandidate = activePending.find((candidate) => candidate.id === activeCandidateId) ?? activePending[0];
  useEffect(() => {
    if (!kinds.includes(activeKind) && kinds[0]) setActiveKind(kinds[0]);
  }, [activeKind, kinds]);
  useEffect(() => {
    if (activeCandidate && activeCandidate.id !== activeCandidateId) setActiveCandidateId(activeCandidate.id);
  }, [activeCandidate, activeCandidateId]);

  return (
    <div className="mt-4 rounded-md border border-gold bg-gold/10">
      <div className="border-b border-gold/40 p-4">
        <h2 className="text-lg font-semibold">AI Review Queue</h2>
        <p className="copy-block mt-1 text-sm text-moss">
          AI outputs are staged for human review. Edit any field before accepting if the analysis is useful but needs correction. Edited candidates are labelled as AI generated with user modifications.
        </p>
      </div>
      <div className="grid min-h-[520px] gap-0 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="max-h-[720px] overflow-auto border-b border-gold/40 bg-white p-3 lg:border-b-0 lg:border-r">
          <h3 className="text-sm font-semibold uppercase text-moss">Review Tasklist</h3>
          <div className="mt-2 grid gap-2">
            {kinds.map((kind) => {
              const group = candidates.filter((candidate) => candidate.kind === kind);
              const reviewed = group.filter((candidate) => candidate.status !== "Pending").length;
              return (
                <button
                  key={kind}
                  className={`rounded-md border p-2 text-left text-sm ${activeKind === kind ? "border-ink bg-paper" : "border-line bg-white"}`}
                  onClick={() => setActiveKind(kind)}
                >
                  <span className="block font-medium">{formatCandidateKind(kind)}</span>
                  <span className="text-xs text-moss">{reviewed}/{group.length} reviewed</span>
                </button>
              );
            })}
          </div>
          <div className="mt-4">
            <h4 className="text-xs font-semibold uppercase text-moss">{formatCandidateKind(activeKind)} Items</h4>
            <div className="mt-2 grid gap-1">
              {activePending.map((candidate) => (
                <button
                  key={candidate.id}
                  className={`rounded-md border px-2 py-1 text-left text-xs ${activeCandidate?.id === candidate.id ? "border-ink bg-paper" : "border-line bg-white"}`}
                  onClick={() => setActiveCandidateId(candidate.id)}
                >
                  {getCandidateShortName(candidate)}
                </button>
              ))}
              {activePending.length === 0 && <span className="text-xs text-moss">No pending items in this category.</span>}
            </div>
          </div>
        </aside>
        <div className="min-w-0 p-4">
          {!activeCandidate && <div className="rounded-md border border-line bg-white p-4 text-sm">No pending {formatCandidateKind(activeKind)} items. Select another category or upload more documents.</div>}
          {activeCandidate && (
            <div id={activeCandidate.id} className="rounded-md border border-line bg-white p-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <strong>{getCandidateShortName(activeCandidate)}</strong>
                  <ProvenanceBadge provenance={activeCandidate.modifiedByUser ? "AIEdited" : "AI"} />
                </div>
                <span>{activeCandidate.confidence} confidence - {activeCandidate.sourceFileName ?? "No file"}</span>
              </div>
              <CandidateEditor candidate={activeCandidate} sourceTypes={sourceTypes} onAddSourceType={onAddSourceType} onUpdate={onUpdate} />
              {activeCandidate.sourceReference && <p className="mt-2 text-moss">Source: {activeCandidate.sourceReference}</p>}
              <div className="mt-3 flex gap-2">
                <button className="rounded-md bg-ink px-3 py-2 text-sm font-medium text-white" onClick={() => onAccept(activeCandidate)}>
                  Accept
                </button>
                <button className="rounded-md border border-line px-3 py-2 text-sm" onClick={() => onReject(activeCandidate.id)}>
                  Reject
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getCandidateShortName(candidate: AiCandidate): string {
  const payload = candidate.payload as Record<string, unknown>;
  return String(
    payload.sourceTitle ??
      payload.claim ??
      payload.statement ??
      payload.name ??
      payload.failureCause ??
      payload.title ??
      payload.decisionChange ??
      `${formatCandidateKind(candidate.kind)} ${candidate.id.slice(-4)}`
  ).slice(0, 80);
}

function formatCandidateKind(kind: AiCandidate["kind"]): string {
  const labels: Record<AiCandidate["kind"], string> = {
    Evidence: "Evidence",
    Assumption: "Assumption",
    Option: "Option",
    Criterion: "Criterion",
    Score: "Score",
    Premortem: "Pre-mortem",
    BriefNote: "Brief Note",
    DecisionLog: "Decision Log"
  };
  return labels[kind];
}

function CandidateEditor({
  candidate,
  sourceTypes,
  onAddSourceType,
  onUpdate
}: {
  candidate: AiCandidate;
  sourceTypes: string[];
  onAddSourceType: (value: string) => boolean;
  onUpdate: (candidateId: string, patch: Partial<AiCandidate>) => void;
}) {
  const payload = candidate.payload as Record<string, unknown>;
  const candidateSourceType = String(payload.sourceType ?? payload.suggestedSourceType ?? "");
  const canonicalCandidateSourceType = canonicalizeSourceType(candidateSourceType);
  const sourceTypeKnown = !candidateSourceType || isDuplicateOption(canonicalCandidateSourceType, sourceTypes);
  const updatePayload = (field: string, value: string | number) => {
    onUpdate(candidate.id, { payload: { ...payload, [field]: value } as AiCandidate["payload"] });
  };
  const fields = getCandidateFields(candidate.kind);

  return (
    <div className="mt-3 grid gap-3">
      <div className="grid gap-2 md:grid-cols-2">
        {fields.map((field) => (
          <label key={field.key} className={field.long ? "grid gap-1 text-sm md:col-span-2" : "grid gap-1 text-sm"}>
            <span className="font-medium">{field.label}</span>
            {field.long ? (
              <textarea className="min-h-20 rounded-md border border-line px-3 py-2" value={String(payload[field.key] ?? "")} onChange={(event) => updatePayload(field.key, event.target.value)} />
            ) : (
              <input className="rounded-md border border-line px-3 py-2" type={field.type ?? "text"} value={String(payload[field.key] ?? "")} onChange={(event) => updatePayload(field.key, field.type === "number" ? Number(event.target.value) : event.target.value)} />
            )}
          </label>
        ))}
      </div>
      {candidate.kind === "Evidence" && (
        <div className="rounded-md border border-line bg-paper p-3">
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Source Category</span>
            <select
              className="rounded-md border border-line px-3 py-2"
              value={sourceTypeKnown ? canonicalCandidateSourceType || "UserProvided" : ""}
              onChange={(event) => updatePayload("sourceType", event.target.value)}
            >
              <option value="">Choose Existing Category</option>
              {sourceTypes.map((item) => <option key={item} value={item}>{formatSourceType(item)}</option>)}
            </select>
          </label>
          {!sourceTypeKnown && canonicalCandidateSourceType && (
            <div className="mt-2 rounded-md border border-gold bg-gold/10 p-2 text-sm">
              <p>Suggested new category: <strong>{formatSourceType(canonicalCandidateSourceType)}</strong></p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  className="rounded-md bg-ink px-3 py-2 text-sm font-medium text-white"
                  onClick={() => {
                    if (onAddSourceType(canonicalCandidateSourceType)) updatePayload("sourceType", canonicalCandidateSourceType);
                  }}
                >
                  Add Suggested Category
                </button>
                <span className="text-moss">Duplicate checks ignore case and spaces. You can also choose an existing category above.</span>
              </div>
            </div>
          )}
        </div>
      )}
      <label className="grid gap-1 text-sm">
        <span className="font-medium">Rationale</span>
        <textarea className="min-h-20 rounded-md border border-line px-3 py-2" value={candidate.rationale} onChange={(event) => onUpdate(candidate.id, { rationale: event.target.value })} />
      </label>
      {candidate.whyBetter !== undefined && (
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Why This Is Better</span>
          <textarea className="min-h-20 rounded-md border border-line px-3 py-2" value={candidate.whyBetter} onChange={(event) => onUpdate(candidate.id, { whyBetter: event.target.value })} />
        </label>
      )}
    </div>
  );
}

function getCandidateFields(kind: AiCandidate["kind"]): { key: string; label: string; long?: boolean; type?: "number" }[] {
  if (kind === "Evidence") return [{ key: "sourceTitle", label: "Source Title" }, { key: "sourceUrl", label: "Source URL" }, { key: "sourceDate", label: "Source Date" }, { key: "claim", label: "Claim", long: true }, { key: "implication", label: "Decision Implication", long: true }, { key: "relevance", label: "Relevance", type: "number" }, { key: "notes", label: "Notes", long: true }];
  if (kind === "Assumption") return [{ key: "statement", label: "Assumption Statement", long: true }, { key: "impact", label: "Impact" }, { key: "confidence", label: "Confidence" }, { key: "validationTest", label: "Validation Test", long: true }, { key: "invalidationTrigger", label: "Invalidation Trigger", long: true }];
  if (kind === "Option") return [{ key: "name", label: "Option Name" }, { key: "description", label: "Description", long: true }];
  if (kind === "Criterion") return [{ key: "name", label: "Criterion Name" }, { key: "weight", label: "Weight", type: "number" }];
  if (kind === "Score") return [{ key: "optionId", label: "Option ID" }, { key: "criterionId", label: "Criterion ID" }, { key: "score", label: "Score", type: "number" }, { key: "rationale", label: "Score Rationale", long: true }];
  if (kind === "Premortem") return [{ key: "failureCause", label: "Failure Cause", long: true }, { key: "likelihood", label: "Likelihood", type: "number" }, { key: "severity", label: "Severity", type: "number" }, { key: "mitigation", label: "Mitigation", long: true }, { key: "earlyWarning", label: "Early Warning", long: true }, { key: "owner", label: "Owner" }];
  if (kind === "BriefNote") return [{ key: "title", label: "Brief Note Title" }, { key: "body", label: "Brief Note", long: true }];
  return [{ key: "decisionChange", label: "Decision Change", long: true }, { key: "reason", label: "Reason", long: true }, { key: "recommendationBefore", label: "Recommendation Before" }, { key: "recommendationAfter", label: "Recommendation After" }];
}

function ProvenanceBadge({ provenance }: { provenance?: "User" | "AI" | "AIEdited" }) {
  const fullLabel = provenance === "AI" ? "AI Generated" : provenance === "AIEdited" ? "AI Generated, User Edited" : "User Input";
  const compactLabel = provenance === "AI" ? "AI" : provenance === "AIEdited" ? "AI Edited" : "User";
  const tone = provenance === "AI" ? "border-teal/30 bg-teal/10 text-teal" : provenance === "AIEdited" ? "border-gold/40 bg-gold/10 text-gold" : "border-line bg-paper text-moss";
  return <span title={fullLabel} className={`inline-flex shrink-0 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium leading-5 ${tone}`}>{compactLabel}</span>;
}

export function AiReviewQueue({
  candidates,
  onAccept,
  onReject
}: {
  candidates: AiCandidate[];
  onAccept: (candidate: AiCandidate) => void;
  onReject: (id: string) => void;
}) {
  return (
    <div className="mt-4 rounded-md border border-gold bg-gold/10 p-4">
      <h2 className="text-lg font-semibold">AI Review Queue</h2>
      <p className="copy-block mt-1 text-sm text-moss">
        AI outputs are staged for human review. Accepting a candidate commits it into the project and records the change in the decision log.
      </p>
      <div className="mt-3 grid gap-3">
        {candidates.map((candidate) => (
          <div key={candidate.id} className="rounded-md border border-line bg-white p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <strong>{formatCandidateKind(candidate.kind)}</strong>
              <span>{candidate.confidence} confidence · {candidate.sourceFileName ?? "No file"}</span>
            </div>
            <p className="mt-2">{candidate.rationale}</p>
            {candidate.whyBetter && <p className="mt-2 text-moss">Why better: {candidate.whyBetter}</p>}
            {candidate.sourceReference && <p className="mt-1 text-moss">Source: {candidate.sourceReference}</p>}
            <div className="mt-2 grid gap-2 rounded-md bg-paper p-3">
              {Object.entries(candidate.payload as Record<string, unknown>).map(([key, value]) => (
                <div key={key}>
                  <span className="font-medium">{key.replace(/([a-z])([A-Z])/g, "$1 $2")}: </span>
                  <span>{String(value ?? "")}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <button className="rounded-md bg-ink px-3 py-2 text-sm font-medium text-white" onClick={() => onAccept(candidate)}>
                Accept
              </button>
              <button className="rounded-md border border-line px-3 py-2 text-sm" onClick={() => onReject(candidate.id)}>
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Metric({ label, value, warning = false }: { label: string; value: string; warning?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-line p-3">
      <span>{label}</span>
      <span className={warning ? "font-semibold text-rust" : "font-semibold"}>{value}</span>
    </div>
  );
}

function ToggleSwitch({
  enabled,
  onChange,
  label
}: {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      className={`mt-1 inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors ${
        enabled ? "border-teal bg-teal" : "border-line bg-white"
      }`}
      onClick={() => onChange(!enabled)}
    >
      <span
        className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${
          enabled ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function MarkdownTextView({ markdown, plainText }: { markdown: string; plainText: string }) {
  const lines = markdown.trim().split(/\n/);
  return (
    <div className="mt-3 max-h-96 overflow-auto rounded-md border border-line bg-white p-4 text-sm leading-6" aria-label={plainText.slice(0, 120)}>
      {lines.map((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={index} className="h-3" />;
        if (trimmed.startsWith("# ")) return <h1 key={index} className="text-lg font-semibold">{formatInlineMarkdown(trimmed.slice(2))}</h1>;
        if (trimmed.startsWith("## ")) return <h2 key={index} className="mt-3 text-sm font-semibold uppercase text-moss">{formatInlineMarkdown(trimmed.slice(3))}</h2>;
        if (/^\d+\.\s+/.test(trimmed)) return <p key={index} className="ml-4">{formatInlineMarkdown(trimmed)}</p>;
        if (trimmed.startsWith("- ")) return <p key={index} className="ml-4 before:mr-2 before:content-['-']">{formatInlineMarkdown(trimmed.slice(2))}</p>;
        return <p key={index}>{formatInlineMarkdown(trimmed)}</p>;
      })}
    </div>
  );
}

function formatInlineMarkdown(value: string): string {
  return value
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1 ($2)")
    .replace(/`([^`]+)`/g, "$1");
}

function Overview({ evidence, assumptions, totals, premortems }: { evidence: EvidenceItem[]; assumptions: Assumption[]; totals: ReturnType<typeof calculateOptionTotals>; premortems: PremortemItem[] }) {
  const weak = assumptions.filter((item) => item.impact === "High" && item.confidence === "Low");
  return (
    <div>
      <h2 className="text-lg font-semibold">Decision Workflow</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="Citation-ready evidence" value={evidence.length.toString()} />
        <Metric label="Weak assumptions" value={weak.length.toString()} warning={weak.length > 0} />
        <Metric label="Top option" value={totals[0]?.optionName ?? "None"} />
        <Metric label="Pre-mortem risks" value={premortems.length.toString()} />
      </div>
      <div className="mt-5 rounded-md border border-line bg-paper p-4 text-sm">
        Evidence flows into assumptions, options, weighted scoring, sensitivity checks, pre-mortems, and the executive brief. Claims without evidence remain visible as gaps rather than hidden inside the recommendation.
      </div>
    </div>
  );
}

function EvidenceWorkspace({ sourceTypes, evidence, onAdd, onUpdate, onDelete }: { sourceTypes: string[]; evidence: EvidenceItem[]; onAdd: () => void; onUpdate: (id: string, patch: Partial<EvidenceItem>) => void; onDelete: (id: string) => void }) {
  const [filter, setFilter] = useState("All");
  const visible = filter === "All" ? evidence : evidence.filter((item) => item.sourceType === filter || item.confidence === filter);
  return (
    <div>
      <WorkspaceHeader title="Evidence Workspace" action="Add evidence" onAction={onAdd} />
      <select className="mt-3 rounded-md border border-line px-3 py-2 text-sm" value={filter} onChange={(event) => setFilter(event.target.value)}>
        <option>All</option>
        {sourceTypes.map((item) => <option key={item} value={item}>{formatSourceType(item)}</option>)}
        {confidenceLevels.map((item) => <option key={item}>{item}</option>)}
      </select>
      <div className="mt-4 grid gap-3">
        {visible.map((item) => (
          <div key={item.id} className="rounded-md border border-line p-3">
            <div className="mb-2 flex justify-end">
              <ProvenanceBadge provenance={item.provenance ?? "User"} />
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <input className="rounded-md border border-line px-3 py-2" value={item.sourceTitle} onChange={(event) => onUpdate(item.id, { sourceTitle: event.target.value })} aria-label="Source title" />
              <input className="rounded-md border border-line px-3 py-2" value={item.sourceUrl ?? ""} onChange={(event) => onUpdate(item.id, { sourceUrl: event.target.value })} aria-label="Source URL" placeholder="Source URL" />
              <select className="rounded-md border border-line px-3 py-2" value={item.sourceType} onChange={(event) => onUpdate(item.id, { sourceType: event.target.value as SourceType })}>
                {sourceTypes.map((type) => <option key={type} value={type}>{formatSourceType(type)}</option>)}
              </select>
              <input className="rounded-md border border-line px-3 py-2" type="date" value={item.sourceDate ?? ""} onChange={(event) => onUpdate(item.id, { sourceDate: event.target.value })} />
            </div>
            <textarea className="mt-2 min-h-20 w-full rounded-md border border-line px-3 py-2" value={item.claim} onChange={(event) => onUpdate(item.id, { claim: event.target.value })} aria-label="Claim" />
            <textarea className="mt-2 min-h-20 w-full rounded-md border border-line px-3 py-2" value={item.implication} onChange={(event) => onUpdate(item.id, { implication: event.target.value })} aria-label="Implication" />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <select className="rounded-md border border-line px-3 py-2" value={item.confidence} onChange={(event) => onUpdate(item.id, { confidence: event.target.value as Confidence })}>
                {confidenceLevels.map((level) => <option key={level}>{level}</option>)}
              </select>
              <input className="w-24 rounded-md border border-line px-3 py-2" type="number" min={1} max={5} value={item.relevance} onChange={(event) => onUpdate(item.id, { relevance: Number(event.target.value) as EvidenceItem["relevance"] })} aria-label="Relevance" />
              <button className="ml-auto rounded-md border border-line p-2 text-rust" aria-label="Delete evidence" onClick={() => onDelete(item.id)}><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EvidenceModal({
  sourceTypes,
  openRouterReady,
  onClose,
  onSave,
  onUpload,
  onRunAiFromText
}: {
  sourceTypes: string[];
  openRouterReady: boolean;
  onClose: () => void;
  onSave: (draft: Omit<EvidenceItem, "id" | "projectId">) => void;
  onUpload: (files: FileList | File[]) => void;
  onRunAiFromText: (text: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState<Omit<EvidenceItem, "id" | "projectId">>({
    sourceTitle: "",
    sourceUrl: "",
    sourceType: "UserProvided",
    sourceDate: new Date().toISOString().slice(0, 10),
    claim: "",
    implication: "",
    confidence: "Medium",
    relevance: 3,
    notes: ""
  });
  const [aiContext, setAiContext] = useState("");
  const canSave = draft.sourceTitle.trim() && draft.claim.trim() && draft.implication.trim();

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-auto rounded-lg bg-white p-4 shadow-panel">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Add Evidence</h2>
          <button className="rounded-md border border-line p-2" aria-label="Close evidence modal" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Source Title</span>
            <input className="rounded-md border border-line px-3 py-2" value={draft.sourceTitle} onChange={(event) => setDraft({ ...draft, sourceTitle: event.target.value })} />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Source URL</span>
            <input className="rounded-md border border-line px-3 py-2" value={draft.sourceUrl ?? ""} onChange={(event) => setDraft({ ...draft, sourceUrl: event.target.value })} />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Source Type</span>
            <select className="rounded-md border border-line px-3 py-2" value={draft.sourceType} onChange={(event) => setDraft({ ...draft, sourceType: event.target.value as SourceType })}>
              {sourceTypes.map((item) => <option key={item} value={item}>{formatSourceType(item)}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Date Of Source</span>
            <input className="rounded-md border border-line px-3 py-2" type="date" value={draft.sourceDate ?? ""} onChange={(event) => setDraft({ ...draft, sourceDate: event.target.value })} />
          </label>
        </div>
        <label className="mt-3 grid gap-1 text-sm">
          <span className="font-medium">Evidence Claim</span>
          <textarea className="min-h-24 rounded-md border border-line px-3 py-2" value={draft.claim} onChange={(event) => setDraft({ ...draft, claim: event.target.value })} />
        </label>
        <label className="mt-3 grid gap-1 text-sm">
          <span className="font-medium">Decision Implication</span>
          <textarea className="min-h-24 rounded-md border border-line px-3 py-2" value={draft.implication} onChange={(event) => setDraft({ ...draft, implication: event.target.value })} />
        </label>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Confidence</span>
            <select className="rounded-md border border-line px-3 py-2" value={draft.confidence} onChange={(event) => setDraft({ ...draft, confidence: event.target.value as Confidence })}>
              {confidenceLevels.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Relevance</span>
            <input className="rounded-md border border-line px-3 py-2" type="number" min={1} max={5} value={draft.relevance} onChange={(event) => setDraft({ ...draft, relevance: Number(event.target.value) as EvidenceItem["relevance"] })} />
          </label>
        </div>
        <div className="mt-4 rounded-md border border-line bg-paper p-3">
          <p className="text-sm font-semibold">AI Assist</p>
          <p className="copy-block mt-1 text-sm text-moss">
            Paste source text or upload a text-extractable document. Source URLs are saved as references; browser-side fetching may fail when sites block CORS.
          </p>
          <textarea className="mt-2 min-h-24 w-full rounded-md border border-line px-3 py-2 text-sm" placeholder="Paste source text for AI extraction..." value={aiContext} onChange={(event) => setAiContext(event.target.value)} />
          <div className="mt-2 flex flex-wrap gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-line px-3 py-2 text-sm">
              <Upload size={16} /> Upload document
              <input className="hidden" type="file" multiple accept=".pdf,.docx,.csv,.txt,.md,.json" onChange={(event) => event.target.files && onUpload(event.target.files)} />
            </label>
            <button
              className="inline-flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm"
              disabled={!openRouterReady || !aiContext.trim()}
              onClick={() => onRunAiFromText(aiContext)}
            >
              <Sparkles size={16} /> Draft with OpenRouter
            </button>
          </div>
          {!openRouterReady && <p className="mt-2 text-sm text-rust">Add an OpenRouter API key in Settings to enable AI drafting.</p>}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button className="rounded-md border border-line px-3 py-2 text-sm" onClick={onClose}>Cancel</button>
          <button className="rounded-md bg-ink px-3 py-2 text-sm font-medium text-white disabled:opacity-50" disabled={!canSave} onClick={() => onSave(draft)}>
            Save evidence
          </button>
        </div>
      </div>
    </div>
  );
}

function AddConfigOptionModal({
  title,
  helperText,
  existingValues,
  onClose,
  onSave
}: {
  title: string;
  helperText: string;
  existingValues: string[];
  onClose: () => void;
  onSave: (value: string) => void;
}) {
  const [value, setValue] = useState("");
  const normalized = normalizeOption(value);
  const duplicate = normalized ? isDuplicateOption(normalized, existingValues) : false;
  const error = !normalized ? "" : duplicate ? "This option already exists. Duplicate checks ignore case and extra spaces." : "";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-4 shadow-panel">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button className="rounded-md border border-line p-2" aria-label="Close dialog" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <label className="mt-4 grid gap-1 text-sm">
          <span className="font-medium">Option name</span>
          <input
            className={`rounded-md border px-3 py-2 ${error ? "border-rust" : "border-line"}`}
            value={value}
            placeholder={helperText}
            onChange={(event) => setValue(event.target.value)}
            autoFocus
          />
        </label>
        {error && <p className="mt-2 text-sm text-rust">{error}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <button className="rounded-md border border-line px-3 py-2 text-sm" onClick={onClose}>Cancel</button>
          <button
            className="rounded-md bg-ink px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
            disabled={!normalized || duplicate}
            onClick={() => onSave(normalized)}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmDialog({
  title,
  body,
  confirmLabel,
  onCancel,
  onConfirm
}: {
  title: string;
  body: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-4 shadow-panel">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-2 text-sm text-moss">{body}</p>
        <div className="mt-4 flex justify-end gap-2">
          <button className="rounded-md border border-line px-3 py-2 text-sm" disabled={busy} onClick={onCancel}>Cancel</button>
          <button
            className="rounded-md bg-ink px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              await onConfirm();
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function GlobalSettingsModal({
  activeSection,
  onSection,
  onClose,
  children
}: {
  activeSection: "openrouter" | "types" | "statuses" | "sources";
  onSection: (section: "openrouter" | "types" | "statuses" | "sources") => void;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const sections: { id: "openrouter" | "types" | "statuses" | "sources"; label: string }[] = [
    { id: "openrouter", label: "OpenRouter" },
    { id: "types", label: "Project Types" },
    { id: "statuses", label: "Project Statuses" },
    { id: "sources", label: "Source Categories" }
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-ink/40 p-4 pt-6">
      <div className="flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg bg-white shadow-panel">
        <div className="shrink-0 flex items-center justify-between border-b border-line p-4">
          <h2 className="text-lg font-semibold">Settings and Configuration</h2>
          <button className="rounded-md border border-line p-2" aria-label="Close settings" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="grid min-h-0 grid-cols-1 overflow-hidden md:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="border-b border-line bg-paper p-3 md:border-b-0 md:border-r">
            <div className="grid gap-2">
              {sections.map((section) => (
                <button
                  key={section.id}
                  className={`rounded-md border px-3 py-2 text-left text-sm ${activeSection === section.id ? "border-ink bg-white" : "border-line bg-paper"}`}
                  onClick={() => onSection(section.id)}
                >
                  {section.label}
                </button>
              ))}
            </div>
          </aside>
          <div className="min-h-0 overflow-auto p-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

function AssumptionsWorkspace({ assumptions, evidence, onAdd, onUpdate }: { assumptions: Assumption[]; evidence: EvidenceItem[]; onAdd: () => void; onUpdate: (id: string, patch: Partial<Assumption>) => void }) {
  return (
    <div>
      <WorkspaceHeader title="Assumption Ledger" action="Add assumption" onAction={onAdd} />
      <div className="mt-4 grid gap-3">
        {assumptions.map((item) => (
          <div key={item.id} className={`rounded-md border p-3 ${item.impact === "High" && item.confidence === "Low" ? "border-rust bg-rust/5" : "border-line"}`}>
            <div className="mb-2 flex justify-end">
              <ProvenanceBadge provenance={item.provenance ?? "User"} />
            </div>
            <textarea className="min-h-24 w-full resize-y overflow-auto rounded-md border border-line px-3 py-2" value={item.statement} onChange={(event) => onUpdate(item.id, { statement: event.target.value })} aria-label="Assumption statement" />
            <div className="mt-2 grid gap-2 md:grid-cols-2">
              <select className="rounded-md border border-line px-3 py-2" value={item.impact} onChange={(event) => onUpdate(item.id, { impact: event.target.value as Impact })}>
                {impactLevels.map((level) => <option key={level}>{level}</option>)}
              </select>
              <select className="rounded-md border border-line px-3 py-2" value={item.confidence} onChange={(event) => onUpdate(item.id, { confidence: event.target.value as Confidence })}>
                {confidenceLevels.map((level) => <option key={level}>{level}</option>)}
              </select>
              <textarea className="min-h-20 resize-y overflow-auto rounded-md border border-line px-3 py-2" value={item.validationTest} onChange={(event) => onUpdate(item.id, { validationTest: event.target.value })} aria-label="Validation test" />
              <textarea className="min-h-20 resize-y overflow-auto rounded-md border border-line px-3 py-2" value={item.invalidationTrigger} onChange={(event) => onUpdate(item.id, { invalidationTrigger: event.target.value })} aria-label="Invalidation trigger" />
            </div>
            <label className="mt-2 block text-sm">
              <span className="font-medium">Linked evidence</span>
              <select
                multiple
                className="mt-1 min-h-24 w-full rounded-md border border-line px-3 py-2"
                value={item.linkedEvidenceIds}
                onChange={(event) => onUpdate(item.id, { linkedEvidenceIds: Array.from(event.target.selectedOptions).map((option) => option.value) })}
              >
                {evidence.map((ev) => <option key={ev.id} value={ev.id}>{ev.sourceTitle}: {ev.claim.slice(0, 80)}</option>)}
              </select>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

function DecisionModelWorkspace({
  store,
  projectId,
  options,
  criteria,
  scores,
  totals,
  onUpdate,
  onAddOption,
  onAddCriterion,
  onDeleteOption,
  onDeleteCriterion,
  onUpdateScore
}: {
  store: StrategyStore;
  projectId: string;
  options: DecisionOption[];
  criteria: Criterion[];
  scores: OptionScore[];
  totals: ReturnType<typeof calculateOptionTotals>;
  onUpdate: (store: StrategyStore) => void;
  onAddOption: () => void;
  onAddCriterion: () => void;
  onDeleteOption: (option: DecisionOption) => void;
  onDeleteCriterion: (criterion: Criterion) => void;
  onUpdateScore: (optionId: string, criterionId: string, value: number, rationale?: string) => void;
}) {
  const scoreFor = (optionId: string, criterionId: string) => scores.find((item) => item.optionId === optionId && item.criterionId === criterionId);
  return (
    <div>
      <WorkspaceHeader title="Option Scoring Matrix" action="Add option" onAction={onAddOption} secondaryAction="Add criterion" onSecondaryAction={onAddCriterion} />
      <p className={`mt-3 text-sm ${weightsAreValid(criteria) ? "text-moss" : "text-rust"}`}>Criteria weights total {getWeightTotal(criteria)}%. Weights must sum to 100% for a valid recommendation.</p>
      <div className="mt-4 overflow-x-auto rounded-md border border-line">
        <table className="min-w-[760px] w-full text-sm">
          <thead className="bg-paper">
            <tr>
              <th className="p-2 text-left">Option</th>
              {criteria.map((criterion) => (
                <th key={criterion.id} className="p-2 text-left">
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1">
                        <ProvenanceBadge provenance={criterion.provenance ?? "User"} />
                      </div>
                      <input className="mb-1 w-full rounded border border-line px-2 py-1" value={criterion.name} onChange={(event) => onUpdate({ ...store, criteria: store.criteria.map((item) => item.id === criterion.id ? { ...item, name: event.target.value } : item) })} aria-label="Criterion name" />
                      <input className="w-20 rounded border border-line px-2 py-1" type="number" value={criterion.weight} onChange={(event) => onUpdate({ ...store, criteria: store.criteria.map((item) => item.id === criterion.id ? { ...item, weight: Number(event.target.value) } : item) })} aria-label="Criterion weight" />%
                    </div>
                    <button className="rounded border border-line p-1 text-rust" aria-label={`Delete criterion ${criterion.name}`} onClick={() => onDeleteCriterion(criterion)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </th>
              ))}
              <th className="p-2 text-left">Weighted total</th>
            </tr>
          </thead>
          <tbody>
            {options.map((option) => (
              <tr key={option.id} className="border-t border-line align-top">
                <td className="p-2">
                  <div className="flex gap-2">
                    <input className="min-w-0 flex-1 rounded border border-line px-2 py-1 font-medium" value={option.name} onChange={(event) => onUpdate({ ...store, options: store.options.map((item) => item.id === option.id ? { ...item, name: event.target.value } : item) })} aria-label="Option name" />
                    <button className="rounded border border-line p-1 text-rust" aria-label={`Delete option ${option.name}`} onClick={() => onDeleteOption(option)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="mt-1">
                    <ProvenanceBadge provenance={option.provenance ?? "User"} />
                  </div>
                  <textarea className="mt-1 min-h-14 w-full rounded border border-line px-2 py-1" value={option.description} onChange={(event) => onUpdate({ ...store, options: store.options.map((item) => item.id === option.id ? { ...item, description: event.target.value } : item) })} aria-label="Option description" />
                </td>
                {criteria.map((criterion) => {
                  const score = scoreFor(option.id, criterion.id);
                  return (
                    <td key={criterion.id} className="p-2">
                      <input className="w-16 rounded border border-line px-2 py-1" min={0} max={5} type="number" value={score?.score ?? 0} onChange={(event) => onUpdateScore(option.id, criterion.id, Number(event.target.value))} aria-label="Score" />
                      {score?.provenance && <div className="mt-1"><ProvenanceBadge provenance={score.provenance} /></div>}
                      <textarea className="mt-1 min-h-14 w-full rounded border border-line px-2 py-1" value={score?.rationale ?? ""} onChange={(event) => onUpdateScore(option.id, criterion.id, score?.score ?? 0, event.target.value)} aria-label="Score rationale" />
                    </td>
                  );
                })}
                <td className="p-2 font-semibold">{totals.find((item) => item.optionId === option.id)?.total.toFixed(2) ?? "0.00"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 grid gap-2 md:grid-cols-3">
        {totals.map((item) => <Metric key={item.optionId} label={`#${item.rank} ${item.optionName}`} value={item.total.toFixed(2)} />)}
      </div>
      {!options.length && <p className="mt-4 text-sm text-moss">Add an option to begin scoring this project.</p>}
      {!criteria.length && <p className="mt-4 text-sm text-moss">Add criteria and weights to make the matrix auditable.</p>}
      <input type="hidden" value={projectId} readOnly />
    </div>
  );
}

function SensitivityWorkspace({ options, criteria, scores }: { options: DecisionOption[]; criteria: Criterion[]; scores: OptionScore[] }) {
  const [criterionCount, setCriterionCount] = useState(1);
  const [adjustments, setAdjustments] = useState<{ criterionId: string; weight: number }[]>([]);
  const firstCriterionId = criteria[0]?.id ?? "";
  const firstCriterionWeight = criteria[0]?.weight ?? 0;
  useEffect(() => {
    if (!firstCriterionId) {
      setAdjustments([]);
      return;
    }
    setAdjustments([{ criterionId: firstCriterionId, weight: firstCriterionWeight }]);
    setCriterionCount(1);
  }, [firstCriterionId, firstCriterionWeight]);
  const activeAdjustments = adjustments.slice(0, criterionCount).filter((item) => item.criterionId);
  const adjustedCriteria = rebalanceCriteriaWithAdjustments(criteria, activeAdjustments);
  const beforeTotals = calculateOptionTotals(options, criteria, scores);
  const afterTotals = calculateOptionTotals(options, adjustedCriteria, scores);
  const beforeTop = beforeTotals[0]?.optionName;
  const afterTop = afterTotals[0]?.optionName;
  const recommendationChanged = beforeTotals[0]?.optionId !== afterTotals[0]?.optionId;
  const adjustedTotal = activeAdjustments.reduce((sum, item) => sum + item.weight, 0);
  const invalidTotal = adjustedTotal > 100;
  const selectedIds = activeAdjustments.map((item) => item.criterionId);

  function setCount(nextCount: number) {
    const bounded = Math.min(criteria.length || 1, Math.max(1, nextCount));
    setCriterionCount(bounded);
    setAdjustments((current) => {
      const next = [...current];
      while (next.length < bounded) {
        const fallback = criteria.find((criterion) => !next.some((item) => item.criterionId === criterion.id)) ?? criteria[0];
        next.push({ criterionId: fallback?.id ?? "", weight: fallback?.weight ?? 0 });
      }
      return next.slice(0, bounded);
    });
  }

  function updateAdjustment(index: number, patch: Partial<{ criterionId: string; weight: number }>) {
    setAdjustments((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item))
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold">Sensitivity Checker</h2>
      {criteria.length ? (
        <div className="mt-4 grid gap-4">
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Number of criteria to include</span>
            <select className="rounded-md border border-line px-3 py-2" value={criterionCount} onChange={(event) => setCount(Number(event.target.value))}>
              {criteria.map((_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}
            </select>
          </label>
          {activeAdjustments.map((adjustment, index) => {
            const criterion = criteria.find((item) => item.id === adjustment.criterionId) ?? criteria[0];
            return (
              <div key={`${adjustment.criterionId}-${index}`} className="rounded-md border border-line p-3">
                <div className="grid gap-3 md:grid-cols-[1fr_140px]">
                  <label className="grid gap-1 text-sm">
                    <span className="font-medium">Criterion {index + 1}</span>
                    <select
                      className="rounded-md border border-line px-3 py-2"
                      value={criterion.id}
                      onChange={(event) => {
                        const nextCriterion = criteria.find((item) => item.id === event.target.value);
                        updateAdjustment(index, {
                          criterionId: event.target.value,
                          weight: nextCriterion?.weight ?? adjustment.weight
                        });
                      }}
                    >
                      {criteria.map((item) => (
                        <option key={item.id} value={item.id} disabled={selectedIds.includes(item.id) && item.id !== criterion.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-1 text-sm">
                    <span className="font-medium">Weight %</span>
                    <input
                      className="rounded-md border border-line px-3 py-2"
                      type="number"
                      min={0}
                      max={100}
                      step={0.1}
                      value={adjustment.weight}
                      onChange={(event) => updateAdjustment(index, { weight: Number(event.target.value) })}
                    />
                  </label>
                </div>
                <label className="mt-3 grid gap-2 text-sm">
                  <span className="font-medium">Adjusted weight: {adjustment.weight}%</span>
                  <input
                    className="w-full accent-teal"
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    list="sensitivity-steps"
                    value={Math.min(100, Math.max(0, adjustment.weight))}
                    onChange={(event) => updateAdjustment(index, { weight: Number(event.target.value) })}
                  />
                  <div className="flex justify-between text-xs text-moss" aria-hidden="true">
                    {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((value) => <span key={value}>{value}</span>)}
                  </div>
                </label>
              </div>
            );
          })}
          <datalist id="sensitivity-steps">
            {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((value) => <option key={value} value={value} label={`${value}%`} />)}
          </datalist>
          {invalidTotal && <p className="rounded-md border border-rust bg-rust/5 p-3 text-sm text-rust">Selected adjusted weights exceed 100%. Lower one or more selected criteria before using this scenario.</p>}
          <div className={`rounded-md border p-4 ${recommendationChanged ? "border-rust bg-rust/5" : "border-line bg-paper"}`}>
            <p className="font-semibold">{recommendationChanged ? "Recommendation flips" : "Recommendation holds"}</p>
            <p className="mt-1 text-sm">
              {invalidTotal
                ? "Scenario is invalid because selected weights exceed 100%."
                : recommendationChanged
                  ? `Top-ranked option changes from ${beforeTop} to ${afterTop}.`
                  : `Top-ranked option remains ${afterTop ?? "unavailable"}.`}
            </p>
            {!invalidTotal && (
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                <Metric label="Before top option" value={beforeTop ?? "Unavailable"} />
                <Metric label="After top option" value={afterTop ?? "Unavailable"} />
              </div>
            )}
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm text-moss">Add criteria before running sensitivity checks.</p>
      )}
    </div>
  );
}

function PremortemWorkspace({ premortems, onAdd, onUpdate }: { premortems: PremortemItem[]; onAdd: () => void; onUpdate: (id: string, patch: Partial<PremortemItem>) => void }) {
  const sorted = [...premortems].sort((a, b) => b.likelihood * b.severity - a.likelihood * a.severity);
  return (
    <div>
      <WorkspaceHeader title="Pre-Mortem Builder" action="Add Risk" onAction={onAdd} />
      <div className="mt-4 grid gap-3">
        {sorted.map((item) => (
          <div key={item.id} className="rounded-md border border-line p-3">
            <div className="mb-2 flex justify-end">
              <ProvenanceBadge provenance={item.provenance ?? "User"} />
            </div>
            <input className="w-full rounded-md border border-line px-3 py-2 font-medium" value={item.failureCause} onChange={(event) => onUpdate(item.id, { failureCause: event.target.value })} aria-label="Failure cause" />
            <div className="mt-2 grid gap-2 md:grid-cols-3">
              <label className="text-sm">Likelihood <input className="mt-1 w-full rounded-md border border-line px-3 py-2" type="number" min={1} max={5} value={item.likelihood} onChange={(event) => onUpdate(item.id, { likelihood: Number(event.target.value) as PremortemItem["likelihood"] })} /></label>
              <label className="text-sm">Severity <input className="mt-1 w-full rounded-md border border-line px-3 py-2" type="number" min={1} max={5} value={item.severity} onChange={(event) => onUpdate(item.id, { severity: Number(event.target.value) as PremortemItem["severity"] })} /></label>
              <label className="text-sm">Owner <input className="mt-1 w-full rounded-md border border-line px-3 py-2" value={item.owner ?? ""} onChange={(event) => onUpdate(item.id, { owner: event.target.value })} /></label>
            </div>
            <textarea className="mt-2 min-h-16 w-full rounded-md border border-line px-3 py-2" value={item.mitigation} onChange={(event) => onUpdate(item.id, { mitigation: event.target.value })} aria-label="Mitigation" />
            <textarea className="mt-2 min-h-16 w-full rounded-md border border-line px-3 py-2" value={item.earlyWarning} onChange={(event) => onUpdate(item.id, { earlyWarning: event.target.value })} aria-label="Early warning" />
            <p className="mt-2 text-sm font-semibold">Risk score: {item.likelihood * item.severity}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function FinancialWorkspace({ csvRows, xField, yField, chartType, numericFields, summary, chartData, chartInsights, onCsv, onX, onY, onChartType, onSaveInsight }: { csvRows: Record<string, string | number>[]; xField: string; yField: string; chartType: "line" | "bar"; numericFields: string[]; summary: ReturnType<typeof summarizeField>; chartData: Record<string, string | number>[]; chartInsights: ChartInsight[]; onCsv: (file: File) => void; onX: (value: string) => void; onY: (value: string) => void; onChartType: (value: "line" | "bar") => void; onSaveInsight: () => void }) {
  const fields = Object.keys(csvRows[0] ?? {});
  return (
    <div>
      <h2 className="text-lg font-semibold">Financial and Metric Analysis</h2>
      <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-md border border-line px-3 py-2 text-sm">
        <Upload size={16} /> Upload CSV
        <input className="hidden" type="file" accept=".csv,text/csv" onChange={(event) => event.target.files?.[0] && onCsv(event.target.files[0])} />
      </label>
      {csvRows.length > 0 && (
        <>
          <div className="mt-4 grid gap-2 md:grid-cols-3">
            <select className="rounded-md border border-line px-3 py-2" value={xField} onChange={(event) => onX(event.target.value)}>{fields.map((field) => <option key={field}>{field}</option>)}</select>
            <select className="rounded-md border border-line px-3 py-2" value={yField} onChange={(event) => onY(event.target.value)}>{numericFields.map((field) => <option key={field}>{field}</option>)}</select>
            <select className="rounded-md border border-line px-3 py-2" value={chartType} onChange={(event) => onChartType(event.target.value as "line" | "bar")}><option value="line">Line chart</option><option value="bar">Bar chart</option></select>
          </div>
          <div className="mt-4 h-72 rounded-md border border-line p-3">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "line" ? (
                <LineChart data={chartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey={xField} /><YAxis /><Tooltip /><Line type="monotone" dataKey={yField} stroke="#2d736f" strokeWidth={2} /></LineChart>
              ) : (
                <BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey={xField} /><YAxis /><Tooltip /><Bar dataKey={yField} fill="#a44f2f" /></BarChart>
              )}
            </ResponsiveContainer>
          </div>
          {summary && <p className="mt-3 text-sm">Summary: {summary.field} average {summary.average}; min {summary.min}; max {summary.max}; count {summary.count}.</p>}
          <button className="mt-3 rounded-md bg-ink px-3 py-2 text-sm font-medium text-white" onClick={onSaveInsight}>Save chart insight as evidence</button>
          <div className="mt-4 overflow-x-auto rounded-md border border-line">
            <table className="min-w-[640px] w-full text-sm"><thead className="bg-paper"><tr>{fields.map((field) => <th key={field} className="p-2 text-left">{field}</th>)}</tr></thead><tbody>{csvRows.slice(0, 6).map((row, index) => <tr key={index} className="border-t border-line">{fields.map((field) => <td key={field} className="p-2">{row[field]}</td>)}</tr>)}</tbody></table>
          </div>
        </>
      )}
      {chartInsights.length > 0 && <div className="mt-4 grid gap-2">{chartInsights.map((item) => <div key={item.id} className="rounded-md border border-line p-3 text-sm"><strong>{item.title}</strong><p>{item.summary}</p></div>)}</div>}
    </div>
  );
}

function BriefWorkspace({ brief, project }: { brief: string; project: Project }) {
  return (
    <div>
      <WorkspaceHeader title="Executive Brief Generator" action="Export Markdown" onAction={() => downloadText(`${project.title.split(" ").join("-").toLowerCase()}-brief.md`, brief)} secondaryAction="Print" onSecondaryAction={() => window.print()} />
      <div className="mt-3 rounded-md border border-gold bg-gold/10 p-3 text-sm">
        Template mode is deterministic and works without an API key. Do not paste confidential material into this public-static demo. Optional BYO API key mode should remain session-only and is intentionally not required for v0.1.
      </div>
      <pre className="mt-4 whitespace-pre-wrap rounded-md border border-line bg-paper p-4 text-sm leading-6">{brief}</pre>
    </div>
  );
}

function DecisionLogWorkspace({ store, projectId, onUpdate }: { store: StrategyStore; projectId: string; onUpdate: (store: StrategyStore) => void }) {
  const entries = store.decisionLog.filter((item) => item.projectId === projectId).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  return (
    <div>
      <WorkspaceHeader title="Decision Log" action="Add event" onAction={() => onUpdate({ ...store, decisionLog: [{ id: makeId("dl"), projectId, timestamp: todayIso(), decisionChange: "Decision changed", reason: "Reason for change" }, ...store.decisionLog] })} />
      <div className="mt-4 grid gap-3">
        {entries.map((item) => (
          <div key={item.id} className="rounded-md border border-line p-3">
            <p className="text-xs text-moss">{new Date(item.timestamp).toLocaleString()}</p>
            <input className="mt-2 w-full rounded-md border border-line px-3 py-2 font-medium" value={item.decisionChange} onChange={(event) => onUpdate({ ...store, decisionLog: store.decisionLog.map((entry) => entry.id === item.id ? { ...entry, decisionChange: event.target.value } : entry) })} />
            <textarea className="mt-2 min-h-16 w-full rounded-md border border-line px-3 py-2" value={item.reason} onChange={(event) => onUpdate({ ...store, decisionLog: store.decisionLog.map((entry) => entry.id === item.id ? { ...entry, reason: event.target.value } : entry) })} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ProjectSettingsWorkspace({
  onClear,
  onDeleteProject
}: {
  onClear: () => void;
  onDeleteProject: () => void;
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold">Project Settings</h2>
      <p className="copy-block mt-1 text-sm text-moss">
        Project-level settings are limited to local destructive actions. Global OpenRouter, project type, project status, and source category configuration lives in the top Settings dialog.
      </p>
      <div className="mt-4 grid gap-3 rounded-md border border-line bg-paper p-4 text-sm">
        <button className="inline-flex w-fit items-center gap-2 rounded-md border border-rust px-3 py-2 text-rust" onClick={onClear}>
          <Trash2 size={16} /> Clear Local Data
        </button>
        <button className="inline-flex w-fit items-center gap-2 rounded-md border border-rust px-3 py-2 text-rust" onClick={onDeleteProject}>
          <Trash2 size={16} /> Delete Current Project
        </button>
      </div>
    </div>
  );
}

function SettingsWorkspace({
  store,
  openRouterKey,
  activeSection,
  onUpdate,
  onOpenRouterKey,
  onRefreshModels,
  onOpenConfigModal
}: {
  store: StrategyStore;
  openRouterKey: string;
  activeSection: "openrouter" | "types" | "statuses" | "sources";
  onUpdate: (store: StrategyStore) => void;
  onOpenRouterKey: (value: string) => void;
  onRefreshModels: () => void;
  onOpenConfigModal: (kind: "type" | "status" | "source") => void;
}) {
  function deleteType(value: string) {
    if (store.config.projectTypes.length <= 1) return;
    const nextTypes = store.config.projectTypes.filter((item) => item !== value);
    const replacement = nextTypes[0];
    onUpdate({
      ...store,
      config: { ...store.config, projectTypes: nextTypes },
      projects: store.projects.map((project) =>
        project.type === value ? { ...project, type: replacement } : project
      )
    });
  }

  function deleteStatus(value: string) {
    if (store.config.projectStatuses.length <= 1) return;
    const nextStatuses = store.config.projectStatuses.filter((item) => item !== value);
    const replacement = nextStatuses[0];
    onUpdate({
      ...store,
      config: { ...store.config, projectStatuses: nextStatuses },
      projects: store.projects.map((project) =>
        project.status === value ? { ...project, status: replacement } : project
      )
    });
  }

  function deleteSource(value: string) {
    if (store.config.sourceTypes.length <= 1) return;
    const nextSourceTypes = store.config.sourceTypes.filter((item) => item !== value);
    const replacement = nextSourceTypes.includes("UserProvided") ? "UserProvided" : nextSourceTypes[0];
    onUpdate({
      ...store,
      config: { ...store.config, sourceTypes: nextSourceTypes },
      evidence: store.evidence.map((item) =>
        item.sourceType === value ? { ...item, sourceType: replacement } : item
      )
    });
  }

  return (
    <div>
      <h2 className="text-lg font-semibold">Settings and Configuration</h2>
      <div className="mt-4 grid gap-3">
        <div className="copy-block rounded-md border border-line bg-paper p-4 text-sm">
          GitHub Pages is public static hosting. OpenRouter keys are session-only, original documents are not retained, and extracted text can be purged after AI review.
        </div>
        {activeSection === "openrouter" && (
          <div className="rounded-md border border-line p-4">
            <h3 className="font-semibold">OpenRouter</h3>
            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              <label className="grid gap-1 text-sm">
                <span className="font-medium">Session API Key</span>
                <input className="rounded-md border border-line px-3 py-2" type="password" value={openRouterKey} onChange={(event) => onOpenRouterKey(event.target.value)} />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="font-medium">Model Preset</span>
                <select
                  className="rounded-md border border-line px-3 py-2"
                  value={store.config.aiSettings.selectedModel}
                  onChange={(event) => onUpdate({ ...store, config: { ...store.config, aiSettings: { ...store.config.aiSettings, selectedModel: event.target.value } } })}
                >
                  {store.config.openRouterPresets.map((preset) => (
                    <option key={preset.id} value={preset.id}>{preset.label} - {preset.priceTier}</option>
                  ))}
                </select>
              </label>
            </div>
            <button className="mt-3 rounded-md border border-line px-3 py-2 text-sm" onClick={onRefreshModels}>Retrieve available OpenRouter models</button>
            <label className="mt-3 grid gap-1 text-sm">
              <span className="font-medium">Custom OpenRouter Model</span>
              {store.config.modelMetadata.length > 0 ? (
                <select
                  className="rounded-md border border-line px-3 py-2"
                  value={store.config.aiSettings.customModelId}
                  onChange={(event) => onUpdate({ ...store, config: { ...store.config, aiSettings: { ...store.config.aiSettings, customModelId: event.target.value } } })}
                >
                  <option value="">Use selected preset</option>
                  {store.config.modelMetadata.map((model) => (
                    <option key={model.id} value={model.id}>
                      {(model.name || model.id)} ({model.id})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  className="rounded-md border border-line px-3 py-2"
                  placeholder="Retrieve available OpenRouter models to select from the dropdown"
                  value={store.config.aiSettings.customModelId}
                  onChange={(event) => onUpdate({ ...store, config: { ...store.config, aiSettings: { ...store.config.aiSettings, customModelId: event.target.value } } })}
                />
              )}
            </label>
            {store.config.modelMetadata.length > 0 && <p className="mt-2 text-sm text-moss">Loaded {store.config.modelMetadata.length} model records sorted alphabetically.</p>}
          </div>
        )}
        {activeSection === "types" && (
          <ConfigList title="Project Types" values={store.config.projectTypes} onAdd={() => onOpenConfigModal("type")} onDelete={deleteType} />
        )}
        {activeSection === "statuses" && (
          <ConfigList title="Project Statuses" values={store.config.projectStatuses} onAdd={() => onOpenConfigModal("status")} onDelete={deleteStatus} />
        )}
        {activeSection === "sources" && (
          <ConfigList title="Source Categories" values={store.config.sourceTypes} formatValue={formatSourceType} onAdd={() => onOpenConfigModal("source")} onDelete={deleteSource} />
        )}
      </div>
    </div>
  );
}

function ConfigList({
  title,
  values,
  onAdd,
  onDelete,
  formatValue = (value) => value
}: {
  title: string;
  values: string[];
  onAdd: () => void;
  onDelete: (value: string) => void;
  formatValue?: (value: string) => string;
}) {
  return (
    <div className="rounded-md border border-line p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold">{title}</h3>
        <button className="rounded-md border border-line px-3 py-2 text-sm" onClick={onAdd}>Add</button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {values.map((value) => (
          <span key={value} className="inline-flex items-center gap-2 rounded-md border border-line bg-paper px-3 py-2 text-sm">
            {formatValue(value)}
            <button className="text-rust disabled:text-moss" disabled={values.length <= 1} aria-label={`Delete ${value}`} onClick={() => onDelete(value)}>
              <X size={14} />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

function WorkspaceHeader({ title, action, onAction, secondaryAction, onSecondaryAction }: { title: string; action?: string; onAction?: () => void; secondaryAction?: string; onSecondaryAction?: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="flex gap-2">
        {secondaryAction && <button className="rounded-md border border-line px-3 py-2 text-sm" onClick={onSecondaryAction}>{secondaryAction}</button>}
        {action && <button className="rounded-md bg-ink px-3 py-2 text-sm font-medium text-white" onClick={onAction}>{action}</button>}
      </div>
    </div>
  );
}
