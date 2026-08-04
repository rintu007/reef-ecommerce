import { NextResponse } from "next/server";
import { reviewCreateSchema } from "@reef-market/shared";
import { requireUser } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { createReview } from "@/lib/server/reviews";

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const input = reviewCreateSchema.parse(await request.json());
    const review = await createReview(user.id, input);
    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
