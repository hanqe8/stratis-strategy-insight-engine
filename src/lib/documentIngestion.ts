import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import mammoth from "mammoth/mammoth.browser";
import type { DocumentChunk, ExtractedDocument } from "../types/ai";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/legacy/build/pdf.worker.min.js",
  import.meta.url
).toString();

export interface ExtractedFileResult {
  document: ExtractedDocument;
  chunks: DocumentChunk[];
}

interface PageText {
  pageNumber: number;
  text: string;
}

const chunkTargetCharacters = 12000;

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function makeId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeText(text: string): string {
  return text.replace(/\s+\n/g, "\n").replace(/\n{3,}/g, "\n\n").replace(/[ \t]{2,}/g, " ").trim();
}

function chunkPlainText(projectId: string, documentId: string, fileName: string, text: string): DocumentChunk[] {
  const normalized = normalizeText(text);
  if (!normalized) return [];
  const chunks: DocumentChunk[] = [];
  for (let start = 0; start < normalized.length; start += chunkTargetCharacters) {
    const chunkText = normalized.slice(start, start + chunkTargetCharacters);
    chunks.push({
      id: makeId("chunk"),
      documentId,
      projectId,
      fileName,
      chunkIndex: chunks.length + 1,
      sectionIndex: chunks.length + 1,
      text: chunkText,
      estimatedTokens: estimateTokens(chunkText)
    });
  }
  return chunks;
}

function chunkPageText(projectId: string, documentId: string, fileName: string, pages: PageText[]): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];
  let buffer = "";
  let pageStart = pages[0]?.pageNumber ?? 1;
  let pageEnd = pageStart;

  pages.forEach((page) => {
    const pageText = normalizeText(page.text);
    if (!pageText) return;
    if (buffer.length + pageText.length > chunkTargetCharacters && buffer) {
      chunks.push({
        id: makeId("chunk"),
        documentId,
        projectId,
        fileName,
        chunkIndex: chunks.length + 1,
        pageStart,
        pageEnd,
        text: buffer.trim(),
        estimatedTokens: estimateTokens(buffer)
      });
      buffer = "";
      pageStart = page.pageNumber;
    }
    pageEnd = page.pageNumber;
    buffer += `\n\n[Page ${page.pageNumber}]\n${pageText}`;
  });

  if (buffer.trim()) {
    chunks.push({
      id: makeId("chunk"),
      documentId,
      projectId,
      fileName,
      chunkIndex: chunks.length + 1,
      pageStart,
      pageEnd,
      text: buffer.trim(),
      estimatedTokens: estimateTokens(buffer)
    });
  }

  return chunks;
}

async function extractPdfText(file: File): Promise<{ chunks: PageText[]; limitationNote?: string }> {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({
    data: new Uint8Array(buffer)
  }).promise;
  const pages: PageText[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    pages.push({ pageNumber, text });
  }

  const extractedLength = pages.reduce((sum, page) => sum + page.text.trim().length, 0);
  return {
    chunks: pages,
    limitationNote:
      extractedLength < 500
        ? "Very little text was extracted. This may be scanned or image-based; OCR is not supported in v1."
        : undefined
  };
}

async function extractDocxText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

export async function extractFileToChunks(projectId: string, file: File): Promise<ExtractedFileResult> {
  const documentId = makeId("doc");
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  let chunks: DocumentChunk[] = [];
  let limitationNote: string | undefined;

  if (extension === "pdf") {
    const pdfResult = await extractPdfText(file);
    chunks = chunkPageText(projectId, documentId, file.name, pdfResult.chunks);
    limitationNote = pdfResult.limitationNote;
  } else if (extension === "docx") {
    const text = await extractDocxText(file);
    chunks = chunkPlainText(projectId, documentId, file.name, text);
  } else {
    const text = await file.text();
    chunks = chunkPlainText(projectId, documentId, file.name, text);
  }

  if (!chunks.length) {
    limitationNote =
      limitationNote ??
      "No usable text was extracted. v1 supports text-extractable PDF/DOCX and plain text-style files only.";
  }

  return {
    document: {
      id: documentId,
      projectId,
      fileName: file.name,
      fileType: extension || file.type || "unknown",
      extractedAt: new Date().toISOString(),
      chunkCount: chunks.length,
      textRetained: true,
      limitationNote
    },
    chunks
  };
}
