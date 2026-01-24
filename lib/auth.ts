import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

/**
 * Get the currently authenticated user from the database
 * Returns null if not authenticated
 */
export async function getCurrentUser() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    // Get user from our database
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id }
    });

    return dbUser;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Require authentication - throws 401 if not authenticated
 * Use this in API routes that require authentication
 */
export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  return user;
}
