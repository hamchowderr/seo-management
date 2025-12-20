'use client'

import * as React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import {
  FileText,
  LayoutDashboard,
  Kanban,
  Tag,
  Building2,
  Search,
  Settings,
  Users,
  BarChart3,
  Plus,
  UserPlus,
  Moon,
  Sun,
  CheckCircle,
  Edit3,
  Eye,
  Send,
  User,
  Calendar,
  type LucideIcon,
} from 'lucide-react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command'
import type { UserRole } from '@/lib/constants/roles'
import { STAGE_LABELS, type ArticleStage } from '@/lib/constants/stages'

interface Article {
  id: string
  title: string
  article_number: number
  companies: { name: string }
}

interface Keyword {
  id: string
  keyword_text: string
  companies: { name: string }
}

interface Company {
  id: string
  name: string
}

interface NavItem {
  title: string
  url: string
  icon: LucideIcon
  roles: UserRole[]
}

// Navigation items with role permissions (same as NavMain)
const navigation: NavItem[] = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: LayoutDashboard,
    roles: ['admin', 'project_manager', 'writer', 'editor', 'poster', 'client'],
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
    icon: Tag,
    roles: ['admin', 'project_manager', 'client'],
  },
  {
    title: 'Articles',
    url: '/articles',
    icon: FileText,
    roles: ['admin', 'project_manager', 'writer', 'editor', 'poster', 'client'],
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
    title: 'Settings',
    url: '/settings',
    icon: Settings,
    roles: ['admin', 'project_manager', 'writer', 'editor', 'poster', 'client'],
  },
]

// Stage icons
const STAGE_ICONS: Record<ArticleStage, LucideIcon> = {
  keyword_hopper: Tag,
  needs_writing: Edit3,
  ready_for_editing: Eye,
  ready_for_approval: CheckCircle,
  assigned_for_posting: Send,
  published: CheckCircle,
}

// Define which roles can see which search results
const SEARCH_PERMISSIONS: Record<
  UserRole,
  {
    articles: boolean
    keywords: boolean
    companies: boolean
    articlesAssignedOnly: boolean
  }
> = {
  admin: { articles: true, keywords: true, companies: true, articlesAssignedOnly: false },
  project_manager: { articles: true, keywords: true, companies: true, articlesAssignedOnly: false },
  writer: { articles: true, keywords: false, companies: false, articlesAssignedOnly: true },
  editor: { articles: true, keywords: false, companies: false, articlesAssignedOnly: true },
  poster: { articles: true, keywords: false, companies: false, articlesAssignedOnly: true },
  client: { articles: true, keywords: true, companies: false, articlesAssignedOnly: false },
}

// Define which roles can use which actions
const ACTION_PERMISSIONS: Record<string, UserRole[]> = {
  addKeyword: ['admin', 'project_manager'],
  inviteUser: ['admin'],
  addCompany: ['admin'],
}

interface CommandMenuProps {
  userRole: UserRole
  userId: string
}

export function CommandMenu({ userRole, userId }: CommandMenuProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const [articles, setArticles] = React.useState<Article[]>([])
  const [keywords, setKeywords] = React.useState<Keyword[]>([])
  const [companies, setCompanies] = React.useState<Company[]>([])
  const [loading, setLoading] = React.useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { setTheme, resolvedTheme } = useTheme()
  const isOnBoard = pathname === '/board'

  // Filter navigation based on user role
  const filteredNavigation = navigation.filter((item) => item.roles.includes(userRole))

  // Check action permissions
  const canAddKeyword = ACTION_PERMISSIONS.addKeyword.includes(userRole)
  const canInviteUser = ACTION_PERMISSIONS.inviteUser.includes(userRole)
  const canAddCompany = ACTION_PERMISSIONS.addCompany.includes(userRole)

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(true)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  React.useEffect(() => {
    if (!open) {
      setSearch('')
      return
    }

    const perms = SEARCH_PERMISSIONS[userRole]

    const fetchData = async () => {
      setLoading(true)
      try {
        const fetches: Promise<Response>[] = []

        // Fetch articles if permitted
        if (perms.articles) {
          const articlesUrl = perms.articlesAssignedOnly
            ? `/api/articles?limit=10&assigned_to=${userId}`
            : '/api/articles?limit=10'
          fetches.push(fetch(articlesUrl))
        }

        // Fetch keywords if permitted
        if (perms.keywords) {
          fetches.push(fetch('/api/keywords?limit=10'))
        }

        // Fetch companies if permitted
        if (perms.companies) {
          fetches.push(fetch('/api/companies'))
        }

        const responses = await Promise.all(fetches)
        const data = await Promise.all(responses.map((r) => r.json()))

        let dataIndex = 0

        if (perms.articles) {
          setArticles(data[dataIndex]?.data || [])
          dataIndex++
        } else {
          setArticles([])
        }

        if (perms.keywords) {
          setKeywords(data[dataIndex]?.data || [])
          dataIndex++
        } else {
          setKeywords([])
        }

        if (perms.companies) {
          setCompanies(data[dataIndex]?.data || [])
        } else {
          setCompanies([])
        }
      } catch {
        console.error('Failed to fetch command menu data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [open, userRole, userId])

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false)
    command()
  }, [])

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  const dispatchAction = (eventName: string) => {
    window.dispatchEvent(new CustomEvent(eventName))
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Command Menu"
      description="Search and navigate"
    >
      <CommandInput
        placeholder="Type a command or search..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>{loading ? 'Loading...' : 'No results found.'}</CommandEmpty>

        {/* Quick Actions */}
        <CommandGroup heading="Quick Actions">
          {canAddKeyword && (
            <CommandItem
              onSelect={() =>
                runCommand(() => {
                  router.push('/keywords')
                  setTimeout(() => dispatchAction('open:add-keyword'), 500)
                })
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Keyword
            </CommandItem>
          )}
          {canInviteUser && (
            <CommandItem
              onSelect={() =>
                runCommand(() => {
                  router.push('/users')
                  setTimeout(() => dispatchAction('open:invite-user'), 500)
                })
              }
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Invite User
            </CommandItem>
          )}
          {canAddCompany && (
            <CommandItem
              onSelect={() =>
                runCommand(() => {
                  router.push('/clients')
                  setTimeout(() => dispatchAction('open:add-company'), 500)
                })
              }
            >
              <Building2 className="mr-2 h-4 w-4" />
              Add Company
            </CommandItem>
          )}
          <CommandItem onSelect={() => runCommand(toggleTheme)}>
            {resolvedTheme === 'dark' ? (
              <Sun className="mr-2 h-4 w-4" />
            ) : (
              <Moon className="mr-2 h-4 w-4" />
            )}
            {resolvedTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Filter by Stage */}
        <CommandGroup heading="Filter by Stage">
          {(Object.entries(STAGE_LABELS) as [ArticleStage, string][]).map(([stage, label]) => {
            const Icon = STAGE_ICONS[stage]
            return (
              <CommandItem
                key={stage}
                onSelect={() => runCommand(() => router.push(`/articles?stage=${stage}`))}
              >
                <Icon className="mr-2 h-4 w-4" />
                {label}
              </CommandItem>
            )
          })}
        </CommandGroup>

        <CommandSeparator />

        {/* Filter by Content Type */}
        <CommandGroup heading="Filter by Content Type">
          <CommandItem onSelect={() => runCommand(() => router.push('/articles?content_type=seo'))}>
            <FileText className="mr-2 h-4 w-4" />
            SEO Articles
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push('/articles?content_type=blog'))}
          >
            <FileText className="mr-2 h-4 w-4" />
            Blog Articles
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* My Articles */}
        <CommandGroup heading="My Articles">
          <CommandItem
            onSelect={() => runCommand(() => router.push(`/articles?assigned_to=${userId}`))}
          >
            <User className="mr-2 h-4 w-4" />
            My Assigned Articles
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push(`/board?assigned_to=${userId}`))}
          >
            <Kanban className="mr-2 h-4 w-4" />
            My Articles on Board
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/articles?stage=published'))}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Published Articles
          </CommandItem>
          <CommandItem
            onSelect={() => {
              const today = new Date().toISOString().split('T')[0]
              runCommand(() => router.push(`/articles?updated_after=${today}`))
            }}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Updated Today
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Board Actions (when on board) */}
        {isOnBoard && (
          <>
            <CommandGroup heading="Board Actions">
              <CommandItem
                onSelect={() =>
                  runCommand(() => {
                    const event = new CustomEvent('board:filter', { detail: { type: 'clear' } })
                    window.dispatchEvent(event)
                  })
                }
              >
                <Search className="mr-2 h-4 w-4" />
                Clear All Filters
              </CommandItem>
              <CommandItem
                onSelect={() =>
                  runCommand(() => {
                    window.dispatchEvent(
                      new CustomEvent('board:filter', {
                        detail: { type: 'assigned_to', value: userId },
                      })
                    )
                  })
                }
              >
                <User className="mr-2 h-4 w-4" />
                Show Only My Articles
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Navigation */}
        <CommandGroup heading="Navigation">
          {filteredNavigation.map((item) => (
            <CommandItem key={item.url} onSelect={() => runCommand(() => router.push(item.url))}>
              <item.icon className="mr-2 h-4 w-4" />
              {item.title}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {/* Recent Articles */}
        {articles.length > 0 && (
          <>
            <CommandGroup heading="Recent Articles">
              {articles.slice(0, 5).map((article) => (
                <CommandItem
                  key={article.id}
                  onSelect={() => runCommand(() => router.push(`/articles/${article.id}`))}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  <span className="truncate">{article.title}</span>
                  <CommandShortcut>#{article.article_number}</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Keywords */}
        {keywords.length > 0 && (
          <>
            <CommandGroup heading="Keywords">
              {keywords.slice(0, 5).map((keyword) => (
                <CommandItem
                  key={keyword.id}
                  onSelect={() => runCommand(() => router.push('/keywords'))}
                >
                  <Tag className="mr-2 h-4 w-4" />
                  <span className="truncate">{keyword.keyword_text}</span>
                  <CommandShortcut>{keyword.companies?.name}</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Companies */}
        {companies.length > 0 && (
          <CommandGroup heading="Companies">
            {companies.slice(0, 5).map((company) => (
              <CommandItem
                key={company.id}
                onSelect={() => runCommand(() => router.push(`/board?company=${company.id}`))}
              >
                <Building2 className="mr-2 h-4 w-4" />
                {company.name}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  )
}
