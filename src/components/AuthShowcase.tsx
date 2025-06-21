// src/components/AuthShowcase.tsx

import { signIn, signOut, useSession } from "next-auth/react";
import Image from "next/image";

export function AuthShowcase() {
  const { data: sessionData } = useSession();

  return (
    <div className="flex items-center justify-center gap-4">
      {sessionData && (
        <div className="hidden sm:inline">
        <div className="flex items-center gap-2 text-black">
            {sessionData.user?.image && (
                <Image 
                    src={sessionData.user.image}
                    alt={sessionData.user.name ?? 'User avatar'}
                    width={32}
                    height={32}
                    className="rounded-full"
                />
            )}
          <span className="font-semibold">{sessionData.user?.name}</span>
        </div>
        </div>
      )}
      <button
        className="rounded-full bg-green-800 px-3 md:px-6 py-2 font-semibold text-white text-sm md:text-md no-underline transition hover:bg-green-700"
        onClick={sessionData ? () => void signOut() : () => void signIn()}
      >
        {sessionData ? "Sign out" : "Sign in"}
      </button>
    </div>
  );
}