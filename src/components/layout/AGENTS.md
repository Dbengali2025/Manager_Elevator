# Layout Components

## AppLayout (`AppLayout.tsx`)
- Client component (`"use client"`) — uses `useState` for mobile sidebar and `usePathname` for active nav
- Wraps all authenticated pages via `app/(dashboard)/layout.tsx`
- **Sidebar:** 240px fixed width, navy `#08376B` background
  - Logo: `Image` from `next/image`, loads `/manager-elevator_logo.png`
  - 6 nav items defined in `navigation` array — add new routes here
  - Admin nav item has `adminOnly: true` — only shown when `isAdmin` prop is true
  - Active route: `pathname === item.href || pathname.startsWith(item.href + "/")`
  - User avatar: mint green circle with initial, placeholder "User" / "Manager" text
- **Header:** 64px height, white bg, border-bottom with `paleGray`
  - Bell icon (button) and gear icon (Link to `/settings`) on right
  - Hamburger button on mobile (hidden on `md:` and above)
- **Mobile:** Uses Headless UI `Dialog` + `Transition` for slide-out sidebar overlay
  - Breakpoint: `md:hidden` (below 768px)
  - Overlay: `charcoal/60` semi-transparent backdrop

## Adding New Nav Items
1. Add entry to `navigation` array with `name`, `href`, `icon` component, and optional `adminOnly: boolean`
2. Create an icon component following the pattern: `function XIcon({ active }: { active: boolean })`
3. Icon should be 20x20 SVG with `stroke="currentColor"` and conditional color class

## Admin Visibility
- `AppLayout` accepts `isAdmin` prop (default false) — controls visibility of admin-only nav items
- `(dashboard)/layout.tsx` calls `checkIsAdmin()` server-side and passes result to AppLayout
- `SidebarContent` filters navigation items via `item.adminOnly` flag

## Gotchas
- All SVG icons are inline components at bottom of file — keep them there for co-location
- `SidebarContent` is extracted as a separate function (shared between desktop and mobile)
- Mobile sidebar calls `onNavigate` callback on link click to close the drawer
