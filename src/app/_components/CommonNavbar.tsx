import { ArrowLeft, LogOut, User } from "lucide-react";
import React from "react";
import { Button } from "~/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { SidebarTrigger } from "~/components/ui/sidebar";
import { SignOutButton } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";

export interface NavbarButtonProps {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export interface CommonNavbarProps {
  title: string;
  buttons?: NavbarButtonProps[];
  rightContent?: React.ReactNode;
  mobilePopoverContent?: React.ReactNode;
  className?: string;
  showBackButton?: boolean;
}

const CommonNavbar: React.FC<CommonNavbarProps> = ({
  title,
  buttons = [],
  rightContent,
  mobilePopoverContent,
  className = "",
  showBackButton = false,
}) => {
  const router = useRouter();
  return (
    <nav
      className={`w-full flex items-center py-2 sm:py-4 bg-white border-b ${className}`}
    >
      {/* SidebarTrigger (left) */}
      <div className="flex-shrink-0 flex items-center justify-start min-w-[40px]">
        <SidebarTrigger />
      </div>

      {/* Title + Subtext (center) */}
      <div className="flex flex-1 items-center sm:items-start justify-center min-w-0 px-2">
        {showBackButton && (
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-center sm:text-left truncate w-full">
          {title}
        </h1>
      </div>

      {/* Buttons/RightContent (right) */}
      <div className="flex flex-shrink-0 items-center justify-end gap-2 min-w-[40px]">
        {/* Mobile: Show popover trigger if mobilePopoverContent is provided */}
        {mobilePopoverContent && (
          <div className="sm:hidden">
            {mobilePopoverContent}
          </div>
        )}

        {/* Desktop: Show full buttons/rightContent */}
        <div className="hidden sm:flex items-center gap-2">
          {rightContent
            ? rightContent
            : buttons.map((btn, idx) => (
              <button
                key={idx}
                onClick={btn.onClick}
                className={`flex items-center px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition text-sm ${btn.className || ""}`}
              >
                {btn.icon && <span className="mr-2">{btn.icon}</span>}
                {btn.label}
              </button>
            ))}
        </div>
      </div>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10">
            <User className="h-5 w-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-2" align="end">
          <div className="space-y-1">
            <SignOutButton redirectUrl="/">
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 h-9 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </SignOutButton>
          </div>
        </PopoverContent>
      </Popover>
    </nav>
  );
};

export default CommonNavbar;
