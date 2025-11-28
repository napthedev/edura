import { protectedProcedure, publicProcedure, router } from "../index";
import { educationRouter } from "./education";
import { notificationRouter } from "./notification";
import { profileRouter } from "./profile";

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
  notification: notificationRouter,
  profile: profileRouter,
});
export type AppRouter = typeof appRouter;
