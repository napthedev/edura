import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "@edura/auth";

export const getSession = cache(async () => {
  return await auth.api.getSession({
    headers: await headers(),
  });
});
