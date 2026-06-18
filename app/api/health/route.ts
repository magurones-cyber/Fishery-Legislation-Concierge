import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    ok: true,
    app: "漁業関係法令コンシェルジュ",
    phase: "0",
    ai: "not_connected"
  });
}
