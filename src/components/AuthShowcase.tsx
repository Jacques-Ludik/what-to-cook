// src/components/AuthShowcase.tsx

import { signIn, signOut, useSession } from "next-auth/react";
import Image from "next/image";
import { FiLogIn, FiLogOut } from 'react-icons/fi'; // Import the icons

export function AuthShowcase() {
  const { data: sessionData } = useSession();

  return (
    <div className="flex items-center justify-end gap-2 sm:gap-4">
      {/* User Info: Hidden on extra-small screens, visible on 'sm' and up */}
      {sessionData?.user && (
        <div className="hidden items-center gap-2 text-black sm:flex">
          {sessionData.user.image && (
            <Image
              src={sessionData.user.image}
              alt={sessionData.user.name ?? 'User avatar'}
              width={32}
              height={32}
              className="rounded-full"
            />
          )}
          {/* User's name is also hidden on extra-small screens */}
          <span className="hidden font-semibold lg:inline">{sessionData.user.name}</span>
        </div>
      )}

      {/* --- The Sign In / Sign Out Button --- */}
      <button
        className="flex items-center gap-2 rounded-lg bg-green-800 px-3 py-2 font-semibold text-white no-underline transition hover:bg-green-700 active:scale-95"
        onClick={sessionData ? () => void signOut() : () => void signIn()}
        aria-label={sessionData ? "Sign out" : "Sign in"}
      >
        {sessionData ? (
          <>
            {/* Sign Out Icon */}
            <FiLogOut className="h-5 w-5" />
            {/* Text label is hidden by default, shown on medium screens and up */}
            <span className="hidden md:inline">Sign out</span>
          </>
        ) : (
          <>
            {/* Sign In Icon */}
            <FiLogIn className="h-5 w-5" />
            {/* Text label is hidden by default, shown on medium screens and up */}
            <span className="hidden md:inline">Sign in</span>
          </>
        )}
      </button>
    </div>
  );
}


// // src/components/AuthShowcase.tsx

// import { signIn, signOut, useSession } from "next-auth/react";
// import Image from "next/image";

// export function AuthShowcase() {
//   const { data: sessionData } = useSession();

//   return (
//     <div className="flex items-center justify-center gap-4">
//       {sessionData && (
//         <div className="hidden sm:inline">
//         <div className="flex items-center gap-2 text-black">
//             {sessionData.user?.image && (
//                 <Image 
//                     src={sessionData.user.image}
//                     alt={sessionData.user.name ?? 'User avatar'}
//                     width={32}
//                     height={32}
//                     className="rounded-full"
//                 />
//             )}
//           <span className="font-semibold">{sessionData.user?.name}</span>
//         </div>
//         </div>
//       )}
//       <button
//         className="rounded-full bg-green-800 px-3 md:px-6 py-2 font-semibold text-white text-sm md:text-md no-underline transition hover:bg-green-700"
//         onClick={sessionData ? () => void signOut() : () => void signIn()}
//       >
//         {sessionData ? "Sign out" : "Sign in"}
//       </button>
//     </div>
//   );
// }