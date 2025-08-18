"use client";

import { signOut, useSession } from "next-auth/react";

export function UserNav() {
  const { data: session } = useSession();

  if (!session) return null;

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-gray-600">
        {session.user?.email}
      </span>
      <button
        onClick={() => signOut()}
        className="text-sm underline text-red-600 hover:text-red-700"
      >
        Sign out
      </button>
    </div>
  );
}
