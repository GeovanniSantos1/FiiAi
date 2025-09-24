"use client";

import { useUser } from "@clerk/nextjs";
import { useMemo } from "react";

const ADMIN_EMAILS = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(",") || [];

export function useAdmin() {
  const { user, isLoaded } = useUser();

  const isAdmin = useMemo(() => {
    if (!isLoaded || !user) return false;
    
    const userEmail = user.emailAddresses[0]?.emailAddress;
    if (!userEmail) return false;
    
    return ADMIN_EMAILS.includes(userEmail);
  }, [isLoaded, user]);

  return {
    isAdmin,
    isLoaded,
  };
}