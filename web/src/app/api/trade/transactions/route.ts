import prisma from "@/prisma";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const user = await prisma.user.findFirst({
    select: {
      transactions: {
        orderBy: {
          createdAt: "desc"
        }
      }
    }
  })

  return NextResponse.json(user?.transactions ?? [])
}