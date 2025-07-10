"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";

import { cn } from "@/lib/utils";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function Avatar({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        "relative flex size-8 shrink-0 overflow-hidden rounded-full",
        className
      )}
      {...props}
    />
  );
}

export function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn("aspect-square size-full", className)}
      {...props}
    />
  );
}

export function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "bg-muted flex size-full items-center justify-center rounded-full",
        className
      )}
      {...props}
    />
  );
}

// SidebarUserFooter fundido ao avatar.tsx
export function SidebarUserFooter() {
  const { data: session } = useSession();
  const user = session?.user;
  return (
    <div className="flex items-center gap-3 w-full p-4 border-t ">
      {user ? (
        <>
          <Link href={`/profile`}>
            <Avatar className="h-10 w-10">
              {user.image ? (
                <AvatarImage
                  src={user.image}
                  alt={user.name || user.email || "Avatar"}
                />
              ) : null}
              <AvatarFallback>
                {user.name
                  ? user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                  : user.email?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="font-medium text-sm text-sidebar-foreground truncate">
              {user.name || user.email}
            </span>
            {user.email && user.name && (
              <span className="text-xs text-muted-foreground truncate">
                {user.email}
              </span>
            )}
          </div>
          <Button
            onClick={() => signOut({ callbackUrl: "/auth/login" })}
            variant="outline"
            size="icon"
            title="Sair"
            className="ml-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6A2.25 2.25 0 0 0 5.25 5.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m-6-3h12m0 0-3-3m3 3-3 3"
              />
            </svg>
          </Button>
        </>
      ) : (
        <Button
          onClick={() => (window.location.href = "/auth/login")}
          className="w-full"
          size="sm"
        >
          Login
        </Button>
      )}
    </div>
  );
}
