'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Kanban,
  FileText,
  Hash,
  Building2,
  Users,
  BarChart3,
  Settings,
  Plug2,
  FolderArchive,
  type LucideIcon,
} from 'lucide-react'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import type { UserRole } from '@/lib/constants/roles'

interface NavItem {
  title: string
  url: string
  icon: LucideIcon
  roles: UserRole[]
}

const navigation: NavItem[] = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: LayoutDashboard,
    roles: ['admin', 'project_manager', 'writer', 'editor', 'poster'],
  },
  // Client portal home - only for clients
  {
    title: 'Dashboard',
    url: '/client-portal',
    icon: LayoutDashboard,
    roles: ['client'],
  },
  {
    title: 'Board',
    url: '/board',
    icon: Kanban,
    roles: ['admin', 'project_manager', 'writer', 'editor', 'poster'],
  },
  {
    title: 'Keywords',
    url: '/keywords',
    icon: Hash,
    roles: ['admin', 'project_manager'],
  },
  {
    title: 'Articles',
    url: '/articles',
    icon: FileText,
    roles: ['admin', 'project_manager', 'writer', 'editor', 'poster'],
  },
  // Client Portal - simplified views for clients
  {
    title: 'My Articles',
    url: '/client-portal/articles',
    icon: FileText,
    roles: ['client'],
  },
  {
    title: 'Document Archive',
    url: '/client-portal/archive',
    icon: FolderArchive,
    roles: ['client'],
  },
  {
    title: 'Clients',
    url: '/clients',
    icon: Building2,
    roles: ['admin', 'project_manager'],
  },
  {
    title: 'Users',
    url: '/users',
    icon: Users,
    roles: ['admin'],
  },
  {
    title: 'Reports',
    url: '/reports',
    icon: BarChart3,
    roles: ['admin', 'project_manager'],
  },
  {
    title: 'Integrations',
    url: '/integrations',
    icon: Plug2,
    roles: ['admin'],
  },
  {
    title: 'Settings',
    url: '/settings',
    icon: Settings,
    roles: ['admin', 'project_manager', 'writer', 'editor', 'poster', 'client'],
  },
]

interface NavMainProps {
  userRole: UserRole
}

export function NavMain({ userRole }: NavMainProps) {
  const pathname = usePathname()

  const filteredNavigation = navigation.filter((item) => item.roles.includes(userRole))

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Navigation</SidebarGroupLabel>
      <SidebarMenu>
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.url || pathname.startsWith(`${item.url}/`)
          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                <Link href={item.url}>
                  <item.icon />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
