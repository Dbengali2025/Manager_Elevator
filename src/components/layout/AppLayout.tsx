"use client";

import { useState, Fragment } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dialog, Transition } from "@headlessui/react";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: DashboardIcon,
  },
  {
    name: "Masterclass",
    href: "/masterclass",
    icon: MasterclassIcon,
  },
  {
    name: "CI Trackers",
    href: "/trackers",
    icon: TrackersIcon,
  },
  {
    name: "Success Dashboard",
    href: "/success-dashboard",
    icon: SuccessDashboardIcon,
  },
  {
    name: "CI Professor",
    href: "/ci-professor",
    icon: CIProfessorIcon,
  },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-offWhite">
      {/* Mobile sidebar overlay */}
      <Transition show={sidebarOpen} as={Fragment}>
        <Dialog onClose={() => setSidebarOpen(false)} className="relative z-50 md:hidden">
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-charcoal/60" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative flex w-[240px] flex-col">
                <SidebarContent pathname={pathname} onNavigate={() => setSidebarOpen(false)} />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-[240px] md:flex-shrink-0">
        <SidebarContent pathname={pathname} />
      </div>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top header */}
        <header className="flex h-[64px] flex-shrink-0 items-center justify-between border-b border-paleGray bg-white px-lg">
          {/* Hamburger menu for mobile */}
          <button
            type="button"
            className="md:hidden p-sm -ml-sm text-charcoal"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <HamburgerIcon />
          </button>

          {/* Spacer for desktop (pushes icons to right) */}
          <div className="hidden md:block" />

          {/* Right side icons */}
          <div className="flex items-center gap-md">
            <button
              type="button"
              className="rounded-md p-sm text-charcoal/60 hover:text-charcoal hover:bg-paleGray transition-colors"
              aria-label="Notifications"
            >
              <BellIcon />
            </button>
            <Link
              href="/settings"
              className="rounded-md p-sm text-charcoal/60 hover:text-charcoal hover:bg-paleGray transition-colors"
              aria-label="Settings"
            >
              <GearIcon />
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-lg">
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarContent({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col bg-navy">
      {/* Logo */}
      <div className="flex h-[64px] items-center px-lg">
        <Image
          src="/manager-elevator_logo.png"
          alt="Manager Elevator"
          width={180}
          height={40}
          className="h-auto w-auto max-h-[40px]"
          priority
        />
      </div>

      {/* Navigation */}
      <nav className="mt-md flex-1 px-sm">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-md rounded-md px-md py-sm mb-xs text-body transition-colors ${
                isActive
                  ? "bg-white/15 text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <item.icon active={isActive} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User info at bottom */}
      <div className="border-t border-white/15 px-md py-md">
        <div className="flex items-center gap-md">
          <div className="flex h-[36px] w-[36px] flex-shrink-0 items-center justify-center rounded-full bg-mintGreen text-navy font-body font-semibold text-body">
            U
          </div>
          <div className="min-w-0">
            <p className="truncate text-body font-medium text-white">User</p>
            <p className="truncate text-caption text-white/60">Manager</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Icons ---------- */

function HamburgerIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function DashboardIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={active ? "text-white" : "text-white/70"}>
      <path d="M3 3h6v8H3zM13 3h4v4h-4zM13 11h4v6h-4zM3 15h6v2H3z" />
    </svg>
  );
}

function MasterclassIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={active ? "text-white" : "text-white/70"}>
      <path d="M3 7l7-4 7 4-7 4-7-4z" />
      <path d="M3 7v5c0 2 3.5 4 7 4s7-2 7-4V7" />
    </svg>
  );
}

function TrackersIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={active ? "text-white" : "text-white/70"}>
      <rect x="3" y="2" width="14" height="16" rx="2" />
      <path d="M7 6h6M7 10h6M7 14h4" />
    </svg>
  );
}

function SuccessDashboardIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={active ? "text-white" : "text-white/70"}>
      <path d="M10 2l2.4 4.8L18 7.6l-4 3.9 1 5.5L10 14.5 4.9 17l1-5.5-4-3.9 5.6-.8z" />
    </svg>
  );
}

function CIProfessorIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={active ? "text-white" : "text-white/70"}>
      <path d="M4 14v2a2 2 0 002 2h8a2 2 0 002-2v-2" />
      <path d="M4 6a6 6 0 0112 0v4a4 4 0 01-4 4H8a4 4 0 01-4-4V6z" />
      <circle cx="8" cy="8" r="1" fill="currentColor" />
      <circle cx="12" cy="8" r="1" fill="currentColor" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 2a5 5 0 00-5 5v3l-1.5 2.5h13L15 10V7a5 5 0 00-5-5z" />
      <path d="M8 15a2 2 0 004 0" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="3" />
      <path d="M10 1.5l1.2 2.3a1 1 0 00.9.5h2.5l-1.2 2.3a1 1 0 000 1l1.2 2.3h-2.5a1 1 0 00-.9.5L10 12.7l-1.2-2.3a1 1 0 00-.9-.5H5.4l1.2-2.3a1 1 0 000-1L5.4 4.3h2.5a1 1 0 00.9-.5z" />
    </svg>
  );
}
