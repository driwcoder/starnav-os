import { NextRequest } from "next/server";
import { put } from "@vercel/blob";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
const session = await getServerSession(authOptions);
  if (!session || !session.user?.email?.endsWith("@starnav.com.br")) {
    return new Response("Unauthorized", { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return new Response("Missing file", { status: 400 });
  }

  const blob = await put(file.name, file, {
    access: "public",
  });

  return Response.json(blob);
}
