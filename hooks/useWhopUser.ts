'use client';

import { useWhop } from '@whop/react';

export function useWhopUser() {
  const { user, isLoading } = useWhop();
  return { user, isLoading, isAuthenticated: Boolean(user) && !isLoading };
}



