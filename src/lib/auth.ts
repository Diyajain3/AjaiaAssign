import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import prisma from "./prisma";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  title: string | null;
}

/**
 * Retrieves the authenticated user from the HTTP session cookie
 */
export async function getSessionUser(request?: NextRequest): Promise<AuthUser | null> {
  let userId: string | undefined;

  if (request) {
    userId = request.cookies.get("ajaia_session_user_id")?.value;
  } else {
    try {
      const cookieStore = cookies();
      userId = cookieStore.get("ajaia_session_user_id")?.value;
    } catch {
      // Not in server component context
    }
  }

  if (!userId) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        title: true,
      },
    });
    return user;
  } catch (err) {
    console.error("Failed to authenticate session user:", err);
    return null;
  }
}
