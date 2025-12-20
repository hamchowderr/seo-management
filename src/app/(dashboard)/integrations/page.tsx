'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Building2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  FolderPlus,
  Search,
  Hash,
  Plug2,
} from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface IntegrationsData {
  google: {
    connected: boolean
    is_expired: boolean
    updated_at: string | null
  }
  slack: {
    configured: boolean
  }
  companies: Array<{
    id: string
    name: string
    slug: string
    google_drive_folder_id: string | null
    slack_channel_id: string | null
  }>
}

interface DriveFolder {
  id: string
  name: string
  webViewLink?: string
}

export default function IntegrationsPage() {
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<DriveFolder[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchDialogOpen, setSearchDialogOpen] = useState(false)
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null)
  const [creatingFolderFor, setCreatingFolderFor] = useState<string | null>(null)
  const [creatingChannelFor, setCreatingChannelFor] = useState<string | null>(null)

  const {
    data: integrationsResponse,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['integrations'],
    queryFn: async () => {
      const response = await fetch('/api/integrations')
      if (!response.ok) throw new Error('Failed to fetch integrations')
      return response.json()
    },
  })

  const integrations: IntegrationsData | null = integrationsResponse?.data

  // Handle OAuth callback
  useEffect(() => {
    const success = searchParams.get('success')
    const error = searchParams.get('error')
    const provider = searchParams.get('provider')

    if (success === 'true') {
      toast.success(
        `${provider === 'google' ? 'Google Drive' : 'Integration'} connected successfully`
      )
      refetch()
    } else if (error) {
      toast.error(`Connection failed: ${error}`)
    }
  }, [searchParams, refetch])

  // Connect Google
  const handleConnectGoogle = async () => {
    try {
      const response = await fetch('/api/auth/google')
      const data = await response.json()

      if (response.ok && data.auth_url) {
        window.location.href = data.auth_url
      } else {
        toast.error(data.error || 'Failed to initiate connection')
      }
    } catch {
      toast.error('Failed to initiate connection')
    }
  }

  // Disconnect Google
  const disconnectGoogleMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/integrations/google', { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to disconnect')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] })
      toast.success('Google Drive disconnected')
    },
    onError: () => {
      toast.error('Failed to disconnect')
    },
  })

  // Create Drive folder for company
  const createFolderMutation = useMutation({
    mutationFn: async (companyId: string) => {
      setCreatingFolderFor(companyId)
      const response = await fetch('/api/integrations/google/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_id: companyId }),
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create folder')
      }
      return response.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] })
      toast.success(data.message)
      setCreatingFolderFor(null)
    },
    onError: (error: Error) => {
      toast.error(error.message)
      setCreatingFolderFor(null)
    },
  })

  // Search Drive folders
  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      const response = await fetch(
        `/api/integrations/google/folders?search=${encodeURIComponent(searchQuery)}`
      )
      const data = await response.json()
      if (response.ok) {
        setSearchResults(data.data || [])
      } else {
        toast.error(data.error || 'Search failed')
      }
    } catch {
      toast.error('Search failed')
    } finally {
      setIsSearching(false)
    }
  }

  // Set folder ID for company
  const setFolderMutation = useMutation({
    mutationFn: async ({ companyId, folderId }: { companyId: string; folderId: string }) => {
      const response = await fetch(`/api/integrations/${companyId}/google`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ google_drive_folder_id: folderId }),
      })
      if (!response.ok) throw new Error('Failed to set folder')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] })
      setSearchDialogOpen(false)
      setSearchQuery('')
      setSearchResults([])
      toast.success('Folder linked successfully')
    },
    onError: () => {
      toast.error('Failed to link folder')
    },
  })

  // Create Slack channel for company
  const createChannelMutation = useMutation({
    mutationFn: async (companyId: string) => {
      setCreatingChannelFor(companyId)
      const response = await fetch('/api/integrations/slack/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_id: companyId }),
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create channel')
      }
      return response.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] })
      toast.success(data.message)
      setCreatingChannelFor(null)
    },
    onError: (error: Error) => {
      toast.error(error.message)
      setCreatingChannelFor(null)
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="text-muted-foreground size-8" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
          <p className="text-muted-foreground">
            Connect Google Drive and Slack to automate your workflow.
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Global Integrations */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Google Drive Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                <svg className="h-5 w-5" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z"
                    fill="#0066da"
                  />
                  <path
                    d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z"
                    fill="#00ac47"
                  />
                  <path
                    d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z"
                    fill="#ea4335"
                  />
                  <path
                    d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z"
                    fill="#00832d"
                  />
                  <path
                    d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z"
                    fill="#2684fc"
                  />
                  <path
                    d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z"
                    fill="#ffba00"
                  />
                </svg>
              </div>
              <div>
                <CardTitle>Google Drive</CardTitle>
                <CardDescription>Store documents for all clients</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {integrations?.google.connected ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-600">Connected</span>
                    {integrations.google.updated_at && (
                      <span className="text-muted-foreground text-xs">
                        •{' '}
                        {formatDistanceToNow(new Date(integrations.google.updated_at), {
                          addSuffix: true,
                        })}
                      </span>
                    )}
                  </>
                ) : integrations?.google.is_expired ? (
                  <>
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm text-yellow-600">Token Expired</span>
                  </>
                ) : (
                  <>
                    <XCircle className="text-muted-foreground h-4 w-4" />
                    <span className="text-muted-foreground text-sm">Not connected</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                {integrations?.google.connected ? (
                  <>
                    <Button variant="outline" size="sm" onClick={handleConnectGoogle}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Reconnect
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm('Disconnect Google Drive?')) {
                          disconnectGoogleMutation.mutate()
                        }
                      }}
                      disabled={disconnectGoogleMutation.isPending}
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      Disconnect
                    </Button>
                  </>
                ) : (
                  <Button size="sm" onClick={handleConnectGoogle}>
                    <Plug2 className="mr-2 h-4 w-4" />
                    Connect Google Account
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Slack Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#4A154B]">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="white">
                  <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
                </svg>
              </div>
              <div>
                <CardTitle>Slack</CardTitle>
                <CardDescription>Notifications and updates</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {integrations?.slack.configured ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-600">Configured</span>
                  </>
                ) : (
                  <>
                    <XCircle className="text-muted-foreground h-4 w-4" />
                    <span className="text-muted-foreground text-sm">Not configured</span>
                  </>
                )}
              </div>
              {!integrations?.slack.configured && (
                <Badge variant="secondary" className="text-xs">
                  Set SLACK_BOT_TOKEN in env
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Company Folders & Channels */}
      <Card>
        <CardHeader>
          <CardTitle>Company Settings</CardTitle>
          <CardDescription>
            Configure Google Drive folders and Slack channels for each company.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!integrations?.companies.length ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Building2 className="text-muted-foreground mb-4 h-12 w-12" />
              <h3 className="text-lg font-semibold">No companies found</h3>
              <p className="text-muted-foreground">
                Add companies first to configure their integrations.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {integrations.companies.map((company) => (
                <div
                  key={company.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                      <Building2 className="text-primary h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{company.name}</p>
                      <p className="text-muted-foreground text-sm">{company.slug}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Google Drive Folder */}
                    <div className="flex items-center gap-2">
                      {company.google_drive_folder_id ? (
                        <Badge variant="secondary" className="font-mono text-xs">
                          <a
                            href={`https://drive.google.com/drive/folders/${company.google_drive_folder_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 hover:underline"
                          >
                            Drive Folder
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </Badge>
                      ) : integrations.google.connected ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => createFolderMutation.mutate(company.id)}
                            disabled={creatingFolderFor === company.id}
                          >
                            {creatingFolderFor === company.id ? (
                              <Spinner className="mr-1 size-4" />
                            ) : (
                              <FolderPlus className="mr-1 h-4 w-4" />
                            )}
                            Create Folder
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedCompanyId(company.id)
                              setSearchQuery(company.name)
                              setSearchDialogOpen(true)
                            }}
                          >
                            <Search className="mr-1 h-4 w-4" />
                            Find Existing
                          </Button>
                        </>
                      ) : (
                        <span className="text-muted-foreground text-xs">Connect Google first</span>
                      )}
                    </div>

                    {/* Slack Channel */}
                    <div className="flex items-center gap-2 border-l pl-4">
                      {company.slack_channel_id ? (
                        <Badge variant="secondary" className="font-mono text-xs">
                          <Hash className="mr-1 h-3 w-3" />
                          {company.slug}-content
                        </Badge>
                      ) : integrations.slack.configured ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => createChannelMutation.mutate(company.id)}
                          disabled={creatingChannelFor === company.id}
                        >
                          {creatingChannelFor === company.id ? (
                            <Spinner className="mr-1 size-4" />
                          ) : (
                            <Hash className="mr-1 h-4 w-4" />
                          )}
                          Create Channel
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-xs">Configure Slack first</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search Folder Dialog */}
      <Dialog open={searchDialogOpen} onOpenChange={setSearchDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Find Existing Folder</DialogTitle>
            <DialogDescription>
              Search your Google Drive for an existing folder to link.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search folders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={isSearching}>
                {isSearching ? <Spinner className="size-4" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>

            {searchResults.length > 0 && (
              <div className="max-h-64 space-y-2 overflow-y-auto">
                {searchResults.map((folder) => (
                  <div
                    key={folder.id}
                    className="hover:bg-muted/50 flex cursor-pointer items-center justify-between rounded-lg border p-3"
                    onClick={() => {
                      if (selectedCompanyId) {
                        setFolderMutation.mutate({
                          companyId: selectedCompanyId,
                          folderId: folder.id,
                        })
                      }
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <FolderPlus className="text-muted-foreground h-4 w-4" />
                      <span className="text-sm">{folder.name}</span>
                    </div>
                    <Button size="sm" variant="ghost" disabled={setFolderMutation.isPending}>
                      {setFolderMutation.isPending ? <Spinner className="size-4" /> : 'Select'}
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {searchResults.length === 0 && searchQuery && !isSearching && (
              <p className="text-muted-foreground py-4 text-center text-sm">
                No folders found. Try a different search term.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
