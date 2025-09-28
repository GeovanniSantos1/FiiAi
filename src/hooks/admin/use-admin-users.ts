"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface User {
  id: string;
  clerkId: string;
  email: string | null;
  name: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    usageHistory: number;
  };
}

export interface AdminUsersResponse {
  users: User[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminUsersParams {
  page?: number;
  pageSize?: number;
  search?: string;
  includeUsageCount?: boolean;
}

// Basic user management hook - simplified without credit functionality
export function useAdminUsers(params: AdminUsersParams = {}) {
  return useQuery({
    queryKey: ['admin-users', params],
    queryFn: async (): Promise<AdminUsersResponse> => {
      const searchParams = new URLSearchParams();
      if (params.page) searchParams.append('page', params.page.toString());
      if (params.pageSize) searchParams.append('pageSize', params.pageSize.toString());
      if (params.search) searchParams.append('search', params.search);
      if (params.includeUsageCount) searchParams.append('includeUsageCount', 'true');

      const response = await fetch(`/api/admin/users?${searchParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      return response.json();
    },
  });
}

export function useEditUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, name, email }: { userId: string; name: string; email: string }) => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });
      if (!response.ok) {
        throw new Error('Failed to update user');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });
}

export function useDeactivateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to deactivate user');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });
}

export function useActivateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/admin/users/${userId}/activate`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to activate user');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });
}

// Removed credit management functions as they are no longer needed in manual access control model
export function useUpdateUserCredits() {
  return {
    mutate: () => {
      alert('Credit management has been removed. Users are managed manually through Clerk admin panel.');
    },
    isPending: false,
  };
}

export function useSyncFromClerk() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (options: any) => {
      const response = await fetch('/api/admin/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      });
      if (!response.ok) {
        throw new Error('Failed to sync from Clerk');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });
}