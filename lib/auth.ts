import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

/**
 * Get the currently authenticated user from the database (cookie-based auth)
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
 * Get user from Bearer token (for CLI auth)
 * Returns null if token is invalid or user not found
 */
export async function getUserFromBearerToken() {
  try {
    const headersList = await headers();
    const authHeader = headersList.get('authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);

    // Create a Supabase client and verify the JWT token
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
    );

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return null;
    }

    // Get user from our database
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id }
    });

    return dbUser;
  } catch (error) {
    console.error('Error getting user from bearer token:', error);
    return null;
  }
}

/**
 * Require authentication - supports both cookie auth and Bearer token
 * Use this in API routes that require authentication
 */
export async function requireAuth() {
  // Try cookie-based auth first (for web)
  let user = await getCurrentUser();

  // If no cookie auth, try Bearer token (for CLI)
  if (!user) {
    user = await getUserFromBearerToken();
  }

  if (!user) {
    throw new Error('Unauthorized');
  }

  return user;
}
