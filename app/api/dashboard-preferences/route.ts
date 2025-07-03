// app/api/dashboard-preferences/route.ts
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import * as z from "zod";
import { OrderStatus } from "@prisma/client";

const bodySchema = z.object({
  statuses: z
    .array(z.enum(Object.values(OrderStatus) as [OrderStatus]))
    .min(1)
    .max(20),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const json = await request.json();
  const validated = bodySchema.safeParse(json);
  if (!validated.success) {
    return new NextResponse("Invalid data", { status: 400 });
  }

  const { statuses } = validated.data;

  await prisma.dashboardPreference.upsert({
    where: { userId: session.user.id },
    update: { statuses },
    create: {
      userId: session.user.id,
      statuses,
    },
  });

  return new NextResponse("Preferências salvas", { status: 200 });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const pref = await prisma.dashboardPreference.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json(pref?.statuses || []);
}
