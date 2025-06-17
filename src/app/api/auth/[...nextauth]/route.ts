// import { handlers } from "~/server/auth";

// export const { GET, POST } = handlers;

// src/app/api/auth/[...nextauth]/route.ts

import NextAuth from "next-auth";
import { authOptions } from "~/server/auth/config"; // We will rename the export to this in the next step

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
