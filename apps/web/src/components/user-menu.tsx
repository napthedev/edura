import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import { Button } from "./ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "./ui/skeleton";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function UserMenu() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <Skeleton className="h-9 w-9 rounded-full" />;
  }

  if (!session) {
    return (
      <Button variant="outline" asChild>
        <Link href="/login">Sign In</Link>
      </Button>
    );
  }

  // Use typed image field from session.user when available
  const avatarSrc = session.user.image ?? undefined;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="rounded-full p-0">
          <Avatar className="w-9 h-9">
            {avatarSrc ? (
              <AvatarImage src={avatarSrc} />
            ) : (
              <AvatarFallback className="bg-black text-white">
                {session.user.name?.[0]?.toUpperCase() ?? "U"}
              </AvatarFallback>
            )}
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-card">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="p-2">
          <div>
            <strong>Username</strong>: {session.user.name}
          </div>
          <div>
            <strong>Email</strong>: {session.user.email}
          </div>
          <div>
            <strong>Role</strong>: {/* @ts-ignore */}
            {session.user.role! === "teacher"
              ? "Teacher"
              : session.user.role! === "manager"
              ? "Manager"
              : "Student"}
          </div>
        </div>
        <DropdownMenuItem asChild>
          <Button
            variant="destructive"
            className="w-full cursor-pointer"
            onClick={() => {
              authClient.signOut({
                fetchOptions: {
                  onSuccess: () => {
                    router.push("/");
                  },
                },
              });
            }}
          >
            Sign Out
          </Button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
