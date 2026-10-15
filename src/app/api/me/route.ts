import { getCurrentUser } from "@/lib/auth";
import { json } from "@/lib/http";
export async function GET() {
  const user = await getCurrentUser();
  return user
    ? json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
          preferences: user.preferences,
        },
      })
    : json({ error: "UNAUTHENTICATED" }, 401);
}
