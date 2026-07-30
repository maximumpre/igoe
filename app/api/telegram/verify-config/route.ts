import { NextResponse } from "next/server";
import { telegramService } from "@/lib/telegram";

export async function GET() {
  try {
    const result = await telegramService.verifyConfiguration();
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("Telegram verification failed:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 },
    );
  }
}
