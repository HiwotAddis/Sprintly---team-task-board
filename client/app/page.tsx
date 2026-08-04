"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./context/AuthContext";
import { LoadingSkeleton } from "../components/LoadingSkeleton";

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.push("/workspaces");
      } else {
        router.push("/login");
      }
    }
  }, [user, isLoading, router]);

  return <LoadingSkeleton message="Redirecting..." />;
}
