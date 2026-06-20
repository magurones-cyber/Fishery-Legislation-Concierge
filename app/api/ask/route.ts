import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-admin";
import { audienceRoleFor, requireApiAuth } from "@/lib/auth";
import { createGroundedAnswer } from "@/lib/rag/openai";
import { hybridSearch } from "@/lib/rag/search";
import { estimateConfidence } from "@/lib/rag/confidence";
import { maskSensitiveText } from "@/lib/privacy/masking";
import { CURRENT_TERMS_VERSION } from "@/lib/privacy/consent";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const auth = await requireApiAuth();
    if (auth.response) return auth.response;

    const body = (await request.json()) as { question?: string };
    const question = body.question?.trim();
    if (!question) {
      return NextResponse.json({ error: "質問を入力してください。" }, { status: 400 });
    }
    const supabase = createServiceClient();
    const organizationId = auth.context.organizationId;
    const role = audienceRoleFor(auth.context);
    const masked = maskSensitiveText(question);
    const sources = await hybridSearch(supabase, {
      query: masked.maskedText,
      organizationId,
      role,
      limit: 8
    });

    const answer = await createGroundedAnswer(masked.maskedText, sources);
    const confidence = estimateConfidence(sources);
    const sessionId = await saveQaLog(supabase, organizationId, auth.context.user.id, question, masked.maskedText, answer, confidence, sources);

    return NextResponse.json({
      sessionId,
      answer,
      confidence,
      sources,
      noSourceWarning: sources.length === 0,
      containsPersonalData: masked.containsPersonalData
    });
  } catch {
    return NextResponse.json({ error: "回答生成処理でエラーが発生しました。" }, { status: 500 });
  }
}

async function saveQaLog(
  supabase: ReturnType<typeof createServiceClient>,
  organizationId: string,
  userId: string,
  question: string,
  maskedQuestion: string,
  answer: string,
  confidence: string,
  sources: Awaited<ReturnType<typeof hybridSearch>>
) {
  const { data: session } = await supabase
    .from("qa_sessions")
    .insert({
      organization_id: organizationId,
      user_id: userId,
      user_organization_id: organizationId,
      title: maskedQuestion.slice(0, 80),
      status: "active",
      consent_version: CURRENT_TERMS_VERSION,
      contains_personal_data: question !== maskedQuestion,
      anonymized_for_analytics: true,
      confidence_level: confidence
    })
    .select("id")
    .single();
  if (!session) return null;

  await supabase.from("qa_messages").insert({
    session_id: session.id,
    role: "user",
    content: maskedQuestion,
    raw_text: question,
    masked_text: maskedQuestion,
    ai_sent_text: maskedQuestion,
    contains_personal_data: question !== maskedQuestion
  });
  const { data: assistantMessage } = await supabase
    .from("qa_messages")
    .insert({
      session_id: session.id,
      role: "assistant",
      content: answer,
      model: process.env.OPENAI_MODEL ?? "local-fallback",
      confidence: confidence === "高" ? 0.9 : confidence === "中" ? 0.65 : confidence === "要確認" ? 0.45 : 0.25,
      no_source_reason: sources.length === 0 ? "登録済み資料に該当根拠がありません。" : null
    })
    .select("id")
    .single();

  if (assistantMessage && sources.length > 0) {
    await supabase.from("qa_sources").insert(
      sources.map((source, index) => ({
        message_id: assistantMessage.id,
        document_id: source.document_id,
        document_version_id: source.document_version_id,
        chunk_id: source.chunk_id,
        source_rank: index + 1,
        page_number: source.page_start,
        article_number: source.article_number,
        quote: source.citation_text ?? source.content.slice(0, 420),
        score: source.score
      }))
    );
  }

  return session.id;
}
