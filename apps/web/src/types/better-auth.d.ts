// Extend the better-auth User type to include our additional fields
declare module "better-auth/types" {
  interface User {
    role: string;
    managerId?: string | null;
    generatedPassword?: string | null;
    hasChangedPassword?: boolean | null;
    dateOfBirth?: Date | null;
    address?: string | null;
    grade?: string | null;
    schoolName?: string | null;
  }
}

export {};
