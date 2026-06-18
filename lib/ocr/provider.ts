export type OcrStatus = "not_required" | "required" | "queued" | "processing" | "review" | "completed" | "failed";

export type OcrInput = {
  documentId: string;
  versionId?: string;
  storagePath: string;
  mimeType: string;
  pageCount?: number;
};

export type OcrResult = {
  status: OcrStatus;
  text: string;
  pages: Array<{ pageNumber: number; text: string; confidence?: number }>;
  provider: string;
  error?: string;
};

export interface OcrProvider {
  name: string;
  detect(input: OcrInput, extractedText: string): Promise<OcrStatus>;
  start(input: OcrInput): Promise<{ jobId: string; status: OcrStatus }>;
  getResult(jobId: string): Promise<OcrResult>;
}

export class ManualOcrProvider implements OcrProvider {
  name = "manual";

  async detect(_input: OcrInput, extractedText: string): Promise<OcrStatus> {
    return extractedText.trim().length < 80 ? "required" : "not_required";
  }

  async start(input: OcrInput) {
    return { jobId: `manual-${input.documentId}`, status: "review" as OcrStatus };
  }

  async getResult(jobId: string): Promise<OcrResult> {
    return {
      status: "review",
      text: "",
      pages: [],
      provider: this.name,
      error: `${jobId} は手動OCR又は外部OCR設定待ちです。`
    };
  }
}

export function createOcrProvider(providerName = process.env.OCR_PROVIDER ?? "manual"): OcrProvider {
  switch (providerName) {
    case "manual":
    default:
      return new ManualOcrProvider();
  }
}
