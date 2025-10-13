import { protectedProcedure, publicProcedure, router } from "../index";
import { educationRouter } from "./education";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  privateData: protectedProcedure.query(({ ctx }) => {
    return {
      message: "This is private",
      user: ctx.session.user,
    };
  }),
  education: educationRouter,
});
export type AppRouter = typeof appRouter;
