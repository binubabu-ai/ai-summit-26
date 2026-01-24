'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

// Fetch current authenticated user from Supabase
export function useAuthUser() {
  return useQuery({
    queryKey: ['auth', 'user'],
    queryFn: async () => {
      const supabase = createClient();
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) {
        throw error;
      }

      return user;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - user data doesn't change often
    retry: false, // Don't retry if user is not authenticated
  });
}

// Fetch current user from our database
export function useCurrentUser() {
  return useQuery({
    queryKey: ['user', 'current'],
    queryFn: async (): Promise<User> => {
      const response = await fetch('/api/user');
      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });
}
