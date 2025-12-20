'use client'

import { useState, useEffect } from 'react'
import { Plus, Building2, Globe, ExternalLink, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
  useCompanies,
  useCreateCompany,
  useUpdateCompany,
  useDeleteCompany,
  type Company,
} from '@/hooks/queries'

export default function ClientsPage() {
  const isMobile = useIsMobile()
  const { data: companies = [], isLoading: loading } = useCompanies()
  const createCompany = useCreateCompany()
  const updateCompany = useUpdateCompany()
  const deleteCompany = useDeleteCompany()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    website_url: '',
    blog_quota: 2,
    seo_quota: 6,
  })

  const submitting = createCompany.isPending || updateCompany.isPending

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const data = {
        ...formData,
        website_url: formData.website_url || null,
      }

      if (editingCompany) {
        await updateCompany.mutateAsync({ id: editingCompany.id, ...data })
        toast.success('Client updated')
      } else {
        await createCompany.mutateAsync(data)
        toast.success('Client created')
      }

      setDialogOpen(false)
      resetForm()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save client')
    }
  }

  const handleDelete = async (company: Company) => {
    if (!confirm(`Are you sure you want to delete "${company.name}"?`)) return

    try {
      await deleteCompany.mutateAsync(company.id)
      toast.success('Client deleted')
    } catch {
      toast.error('Failed to delete client')
    }
  }

  const openEditDialog = (company: Company) => {
    setEditingCompany(company)
    setFormData({
      name: company.name,
      slug: company.slug,
      website_url: company.website_url || '',
      blog_quota: company.blog_quota,
      seo_quota: company.seo_quota,
    })
    setDialogOpen(true)
  }

  const resetForm = () => {
    setEditingCompany(null)
    setFormData({
      name: '',
      slug: '',
      website_url: '',
      blog_quota: 2,
      seo_quota: 6,
    })
  }

  const openNewDialog = () => {
    resetForm()
    setDialogOpen(true)
  }

  // Listen for command menu trigger
  useEffect(() => {
    const handleOpen = () => openNewDialog()
    window.addEventListener('open:add-company', handleOpen)
    return () => window.removeEventListener('open:add-company', handleOpen)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground">Manage client companies and their content quotas.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog} className="min-h-[44px] w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingCompany ? 'Edit Client' : 'Add New Client'}</DialogTitle>
                <DialogDescription>
                  {editingCompany
                    ? 'Update client information and quotas.'
                    : 'Add a new client company to manage their content.'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Company Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Acme Inc."
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="acme-inc (auto-generated if empty)"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="website">Website URL</Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website_url}
                    onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                    placeholder="https://example.com"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="blog_quota">Blog Quota</Label>
                    <Input
                      id="blog_quota"
                      type="number"
                      min={1}
                      value={formData.blog_quota}
                      onChange={(e) =>
                        setFormData({ ...formData, blog_quota: parseInt(e.target.value) || 1 })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="seo_quota">SEO Quota</Label>
                    <Input
                      id="seo_quota"
                      type="number"
                      min={1}
                      value={formData.seo_quota}
                      onChange={(e) =>
                        setFormData({ ...formData, seo_quota: parseInt(e.target.value) || 1 })
                      }
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Saving...' : editingCompany ? 'Save Changes' : 'Add Client'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Clients</CardTitle>
          <CardDescription>
            {companies.length} {companies.length === 1 ? 'client' : 'clients'} registered
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
            </div>
          ) : companies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Building2 className="text-muted-foreground mb-4 h-12 w-12" />
              <h3 className="text-lg font-semibold">No clients yet</h3>
              <p className="text-muted-foreground mb-4">
                Add your first client to start managing their content.
              </p>
              <Button onClick={openNewDialog} className="min-h-[44px]">
                <Plus className="mr-2 h-4 w-4" />
                Add Client
              </Button>
            </div>
          ) : isMobile ? (
            // Mobile card view
            <div className="space-y-3">
              {companies.map((company) => (
                <Card key={company.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-semibold">
                        {company.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{company.name}</div>
                        <div className="text-muted-foreground text-xs">{company.slug}</div>
                        {company.website_url && (
                          <a
                            href={company.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 flex items-center gap-1 text-xs text-blue-600 hover:underline"
                          >
                            <Globe className="h-3 w-3" />
                            {new URL(company.website_url).hostname}
                          </a>
                        )}
                        <div className="mt-2 flex gap-2">
                          <Badge variant="secondary" className="text-xs">
                            Blog: {company.blog_quota}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            SEO: {company.seo_quota}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-11 w-11 shrink-0">
                          <MoreHorizontal className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(company)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDelete(company)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            // Desktop table view
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Website</TableHead>
                  <TableHead className="text-center">Blog Quota</TableHead>
                  <TableHead className="text-center">SEO Quota</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-lg text-sm font-semibold">
                          {company.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium">{company.name}</div>
                          <div className="text-muted-foreground text-xs">{company.slug}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {company.website_url ? (
                        <a
                          href={company.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                        >
                          <Globe className="h-3 w-3" />
                          {new URL(company.website_url).hostname}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{company.blog_quota}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{company.seo_quota}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-10 w-10 md:h-8 md:w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(company)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(company)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
