# Edura: AI Coding Agent Instructions

## Project Overview

**Edura** is a monorepo-based full-stack education platform using a **modern TypeScript stack**: Next.js 15, tRPC, Drizzle ORM, PostgreSQL, and Better-Auth. The app enables teachers to create classes, assign homework, track submissions, and manage schedules; students join classes and submit assignments. Managers can oversee operations.

**Key Commands:**

```bash
pnpm dev              # Start all apps (web on port 3001)
pnpm build            # Build all apps
pnpm db:push          # Push schema changes to database
pnpm db:studio        # Open Drizzle Studio UI
pnpm check-types      # Verify TypeScript across workspace
```

## Architecture & Monorepo Structure

### Workspace Layout

- **`apps/web/`** - Next.js 15 fullstack app (frontend + API routes). Port 3001 with Turbopack.
- **`packages/api/`** - tRPC router definitions and business logic. Exported via `@edura/api`.
- **`packages/db/`** - Drizzle schema + database client. Uses Neon Postgres. Exported via `@edura/db`.
- **`packages/auth/`** - Better-Auth configuration. Exported via `@edura/auth`.

### App Structure (`apps/web/src/`)

```
app/
├── api/
│   ├── auth/           # Better-Auth API routes
│   ├── trpc/           # tRPC fetch handler
│   ├── upload/         # File upload endpoints
│   └── secret/         # Protected API routes
├── class/
│   ├── teacher/[class_id]/   # Teacher class views (assignments, lectures, students, schedule, settings, modules, announcements, requests)
│   └── student/[class_id]/   # Student class views (assignments, lectures, schedule, announcements, modules, teacher info)
├── dashboard/
│   ├── teacher/        # Teacher dashboard
│   ├── student/        # Student dashboard
│   └── manager/        # Manager dashboard
├── do-assignment/[assignment_id]/    # Assignment taking interface
├── view-submission/[assignment_id]/  # Submission viewing/grading
├── lecture/[lecture_id]/             # Lecture viewing page
├── login/              # Sign in page
└── register/           # Sign up page

components/
├── announcement/       # Announcement list, create/edit forms
├── assignment/         # Question editor, AI generation, metrics
├── auth/               # Auth header component
├── class/              # Class shell, sidebar, modules (create, move, add content dialogs)
├── dashboard/          # Dashboard shell, sidebar, top-nav, manager components
├── landing/            # Landing page sections (hero, features, pricing, testimonials, footer, demo-video)
├── notification/       # Notification dropdown and items
├── schedule/           # Schedule calendar and form
├── ui/                 # shadcn/ui components (50+ components)
└── [shared]            # header, user-menu, language-switcher, providers, theme-provider, loader, join-class-form, latex-renderer
```

### Data Flow

1. **Client** (Next.js components) → **tRPC client** (`apps/web/src/utils/trpc.ts`)
2. **tRPC Router** (`packages/api/src/routers/`) → **Drizzle ORM** + **Better-Auth**
3. **Database** (PostgreSQL via Neon)

**Key Integration Files:**

- `apps/web/src/app/api/trpc/[trpc]/route.ts` - tRPC fetch handler
- `packages/api/src/context.ts` - Injects session & db into all procedures
- `packages/api/src/routers/education.ts` - Main education router
- `packages/api/src/routers/notification.ts` - Notification router

## Core Patterns

### tRPC Procedure Types

```typescript
// In packages/api/src/index.ts
publicProcedure; // No auth required (e.g., healthCheck)
protectedProcedure; // Requires valid session; throws UNAUTHORIZED if missing
```

**Access Control:** Procedures manually check `ctx.session.user.role` ("teacher", "student", or "manager") and resource ownership via database queries. Example: `getClasses` filters by `teacherId === ctx.session.user.id`.

### Schema & Database

- **Auth Schema** (`packages/db/src/schema/auth.ts`) - Users, sessions, accounts (Better-Auth managed)
- **Education Schema** (`packages/db/src/schema/education.ts`) - Classes, enrollments, assignments, submissions, lectures, announcements, schedules, modules

**Key Relationships:**

- `user` → `classes` (teacher), `enrollments` (student)
- `assignments` → `submissions` (with auto-grading logic)
- `classes` → `modules` → `assignments/lectures` (content organization)
- Class code: 5-char uppercase unique identifier for students to join

### Grading Logic

Submissions auto-grade via JSON structure matching in `educationRouter.submitAssignment()`:

- Parses `assignmentContent` (JSON with question objects containing `correctAnswer`)
- Compares to `submissionContent` (answers object)
- Calculates percentage score

## Internationalization (i18n) - CRITICAL

**⚠️ NEVER HARD-CODE USER-FACING TEXT. Always use translations.**

Edura uses `next-intl` for internationalization. All user-facing strings must be translated.

### Translation Files

- **English**: `apps/web/messages/en.json`
- **Vietnamese**: `apps/web/messages/vi.json`

### i18n Configuration

- Config: `apps/web/src/i18n/request.ts`
- Default locale: Vietnamese (`vi`)
- Locale stored in cookies

### Usage Pattern

```typescript
// In React components
import { useTranslations } from "next-intl";

export function MyComponent() {
  const t = useTranslations("MyNamespace");

  return (
    <div>
      <h1>{t("title")}</h1>
      <p>{t("description")}</p>
      <button>{t("submitButton")}</button>
    </div>
  );
}
```

### Adding New Translations

1. **Add keys to both JSON files** (`en.json` and `vi.json`)
2. **Use a descriptive namespace** (e.g., `"CreateAssignment"`, `"ClassPage"`, `"TeacherDashboard"`)
3. **Structure translations hierarchically**:

```json
// en.json
{
  "MyFeature": {
    "title": "My Feature Title",
    "description": "Feature description here",
    "buttons": {
      "submit": "Submit",
      "cancel": "Cancel"
    },
    "errors": {
      "required": "This field is required"
    }
  }
}
```

### Existing Namespaces

`Languages`, `Header`, `Hero`, `DemoVideo`, `Features`, `Pricing`, `Testimonials`, `Footer`, `Auth`, `TeacherDashboard`, `ClassPage`, `CreateAssignment`, `EditAssignment`, `UploadLecture`, `CreateAnnouncement`, `AnnouncementList`, `ClassSidebar`, `JoinClass`, `UserMenu`, `ViewSubmission`, `CreateModule`, `MoveContent`, and more.

### DO NOT

- ❌ Hard-code strings like `"Submit"`, `"Cancel"`, `"Loading..."`
- ❌ Use template literals with hard-coded text
- ❌ Forget to add translations to both `en.json` and `vi.json`

### DO

- ✅ Use `t("key")` for all user-facing text
- ✅ Add new namespaces for new features
- ✅ Keep translation keys descriptive and organized

## Development Workflows

### Adding a New tRPC Procedure

1. Define in `packages/api/src/routers/education.ts` or `notification.ts`
2. Use `protectedProcedure` if auth required; add Zod validation
3. Check permissions manually (teacher/student/manager role, resource ownership)
4. Access database via `ctx.db`
5. Return data or throw `TRPCError`

**Pattern:**

```typescript
myNewProcedure: protectedProcedure
  .input(z.object({ classId: z.string() }))
  .mutation(async ({ ctx, input }) => {
    const classData = await ctx.db
      .select()
      .from(classes)
      .where(eq(classes.classId, input.classId));
    if (classData.length === 0) throw new Error("Not found or access denied");
    // ... do work
    return result;
  });
```

### Schema Changes

1. Edit `packages/db/src/schema/auth.ts` or `education.ts`
2. Run `pnpm db:push` to apply changes (creates migrations)
3. Use `pnpm db:studio` to inspect data

### Client-Side tRPC Usage

```typescript
// In React components (apps/web/src)
const mutation = trpc.education.createClass.useMutation();
mutation.mutate(
  { className: "Math 101" },
  {
    onSuccess: (data) => {
      /* handle success */
    },
    onError: (err) => {
      /* toast.error already shown via QueryCache */
    },
  }
);
```

Errors are automatically toasted via `QueryCache.onError` in `apps/web/src/utils/trpc.ts`.

## Project-Specific Conventions

### Naming

- IDs: `crypto.randomUUID()` (strings, used as primary keys)
- Enum fields: `pgEnum` for types (e.g., `userRoleEnum` = "teacher"/"student"/"manager")
- Class codes: 5-char uppercase (e.g., `ABC12`)

### Authorization

- **Always verify resource ownership** after fetching (no implicit grants)
- Check `ctx.session.user.role` for role-based access (teacher, student, manager)
- Example: Only class teacher can update assignments in that class

### Error Handling

- Throw descriptive errors; tRPC serializes them
- Use `TRPCError` for custom codes (e.g., `UNAUTHORIZED`)
- Client-side: `@tanstack/react-query` with error toasting via Sonner

### TypeScript

- Strict mode enabled; use Zod for runtime validation on all inputs
- Export router types: `type AppRouter = typeof appRouter;`
- Infer types from Drizzle schema

## Key External Dependencies

- **@trpc/server & @trpc/client** - Type-safe RPC layer
- **drizzle-orm** - SQL ORM for PostgreSQL (Neon serverless)
- **better-auth** - Authentication with custom user fields (role)
- **@tanstack/react-query** - Client-side caching & mutations
- **next-intl** - Internationalization (messages in `apps/web/messages/`)
- **shadcn/ui** - Radix UI component library (50+ components in `apps/web/src/components/ui/`)
- **zod** - Schema validation
- **sonner** - Toast notifications

## Common Issues & Debugging

- **Database connection:** Check `DATABASE_URL` env var points to Neon database
- **Auth not working:** Verify `CORS_ORIGIN` env var in `packages/auth/src/index.ts`
- **Type errors:** Run `pnpm check-types` to catch missing types across workspace
- **Turbopack issues:** Clear `.next` folder and restart `pnpm dev:web`
- **Missing translations:** Ensure keys exist in both `en.json` and `vi.json`

## Design System & UI Patterns

### Core Design Principles

Edura follows a **modern, card-based design language** with Material Design influences:

- **Card-Based Layout**: Content is organized into distinct rectangular containers with white backgrounds. This compartmentalizes complex data (finance, teachers, students) into digestible chunks.
- **Soft Shadows & Elevation**: Subtle, diffused drop shadows create depth, making cards appear to float slightly above the light gray background (similar to Material Design elevation).
- **Generous Whitespace**: Significant negative space between elements reduces cognitive load and prevents cluttered layouts.
- **Rounded Corners**: Softened border-radius on cards, buttons, progress bars, and images creates a friendly, approachable aesthetic rather than rigid geometry.
- **Muted/Cool Color Palette**: Primarily white, light grays, and soft tech blue accents. Avoids harsh contrasts or neon colors.
- **Clean Typography**: Simple, sans-serif typefaces (Inter/Roboto/Poppins-inspired) prioritize readability and hierarchy.

### UI Components & Implementation

- Uses `shadcn/ui` (Radix UI components) with TailwindCSS for theming
- Component customization via `apps/web/src/components/ui/` (50+ components including badge, button, dialog, card, calendar, form, etc.)
- Dark mode support via `next-themes` provider in `apps/web/src/components/theme-provider.tsx`
- Toast notifications via `sonner` library for user feedback

### Layout & Spacing

Follow TailwindCSS spacing conventions:

- Use multiples of `4px` (e.g., `gap-4`, `p-6`)
- Cards typically have `p-6` internal padding and `rounded-lg` corners
- Soft shadows: `shadow-sm` or `shadow` (not heavy shadows)

## References

- tRPC Routers: `packages/api/src/routers/` (education.ts, notification.ts)
- Database Schemas: `packages/db/src/schema/` (auth.ts, education.ts)
- Auth Setup: `packages/auth/src/index.ts`
- Client Integration: `apps/web/src/utils/trpc.ts`
- UI Components: `apps/web/src/components/ui/`
- Theme Provider: `apps/web/src/components/theme-provider.tsx`
- i18n Config: `apps/web/src/i18n/request.ts`
- Translation Files: `apps/web/messages/en.json`, `apps/web/messages/vi.json`
