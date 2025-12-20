'use client'

import Image from 'next/image'
import Link from 'next/link'
import { NavMain } from '@/components/layout/nav-main'
import { NavUser } from '@/components/layout/nav-user'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import type { UserRole } from '@/lib/constants/roles'

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: {
    email: string
    full_name?: string
    avatar_url?: string
  }
  userRole: UserRole
}

export function AppSidebar({ user, userRole, ...props }: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-2 py-1.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
        >
          <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full">
            <Image
              src="/logo.jpg"
              alt="SEO Monster"
              width={32}
              height={32}
              className="h-full w-full object-cover"
              priority
            />
          </div>
          <span className="text-lg font-semibold group-data-[collapsible=icon]:hidden">
            SEO Monster
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <NavMain userRole={userRole} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} userRole={userRole} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
