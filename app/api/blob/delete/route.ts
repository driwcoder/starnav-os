// app/api/blob/delete/route.ts
import { del } from "@vercel/blob";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL do arquivo não fornecida" }, { status: 400 });
    }

    await del(url); // Remove do blob

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar blob:", error);
    return NextResponse.json({ error: "Erro ao deletar o arquivo" }, { status: 500 });
  }
}
