"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function ProductHeaderActions() {
  const { user, loading } = useAuth();

  if (loading) {
    return <span>Checking account...</span>;
  }

  if (!user) {
    return <Link href="/login">Sign In</Link>;
  }

  if (user.role === "admin") {
    return <Link href="/admin/dashboard">Admin Dashboard</Link>;
  }

  return <Link href="/customer/dashboard">My Account</Link>;
}