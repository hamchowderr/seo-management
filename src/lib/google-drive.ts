import { createAdminClient } from '@/lib/supabase-admin'

interface GoogleToken {
  access_token: string
  refresh_token: string | null
  expires_at: string | null
}

interface DriveFolder {
  id: string
  name: string
  webViewLink?: string
}

/**
 * Get the global Google OAuth token
 */
async function getGoogleToken(): Promise<GoogleToken | null> {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('integration_tokens')
    .select('access_token, refresh_token, expires_at')
    .is('company_id', null)
    .eq('provider', 'google')
    .single()

  return data
}

/**
 * Refresh the access token if expired
 */
async function refreshTokenIfNeeded(token: GoogleToken): Promise<string> {
  // Check if token is expired
  if (token.expires_at && new Date(token.expires_at) < new Date()) {
    if (!token.refresh_token) {
      throw new Error('Token expired and no refresh token available')
    }

    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth credentials not configured')
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: token.refresh_token,
        grant_type: 'refresh_token',
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to refresh token')
    }

    const newTokens = await response.json()

    // Update token in database
    const supabase = createAdminClient()
    await supabase
      .from('integration_tokens')
      .update({
        access_token: newTokens.access_token,
        expires_at: newTokens.expires_in
          ? new Date(Date.now() + newTokens.expires_in * 1000).toISOString()
          : null,
        updated_at: new Date().toISOString(),
      })
      .is('company_id', null)
      .eq('provider', 'google')

    return newTokens.access_token
  }

  return token.access_token
}

/**
 * Check if Google Drive is connected
 */
export async function isGoogleDriveConnected(): Promise<boolean> {
  const token = await getGoogleToken()
  return !!token
}

/**
 * Create a folder in Google Drive
 * @param name - Folder name
 * @param parentFolderId - Optional parent folder ID (creates in root if not specified)
 */
export async function createFolder(name: string, parentFolderId?: string): Promise<DriveFolder> {
  const token = await getGoogleToken()
  if (!token) {
    throw new Error('Google Drive not connected')
  }

  const accessToken = await refreshTokenIfNeeded(token)

  const metadata: Record<string, unknown> = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
  }

  if (parentFolderId) {
    metadata.parents = [parentFolderId]
  }

  const response = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Failed to create folder: ${error.error?.message || 'Unknown error'}`)
  }

  const folder = await response.json()

  return {
    id: folder.id,
    name: folder.name,
    webViewLink: `https://drive.google.com/drive/folders/${folder.id}`,
  }
}

/**
 * Search for folders by name in Google Drive
 * @param query - Search query (folder name)
 */
export async function searchFolders(query: string): Promise<DriveFolder[]> {
  const token = await getGoogleToken()
  if (!token) {
    throw new Error('Google Drive not connected')
  }

  const accessToken = await refreshTokenIfNeeded(token)

  // Search for folders containing the query in the name
  const searchQuery = `mimeType='application/vnd.google-apps.folder' and name contains '${query.replace(/'/g, "\\'")}'`

  const params = new URLSearchParams({
    q: searchQuery,
    fields: 'files(id,name,webViewLink)',
    pageSize: '20',
    orderBy: 'name',
  })

  const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Failed to search folders: ${error.error?.message || 'Unknown error'}`)
  }

  const data = await response.json()

  return (data.files || []).map((file: { id: string; name: string; webViewLink?: string }) => ({
    id: file.id,
    name: file.name,
    webViewLink: file.webViewLink,
  }))
}

/**
 * Create the SEO Monster root folder structure for a company
 * Creates: SEO Monster/{Company Name}/
 * @param companyName - The company name
 * @param rootFolderId - Optional root "SEO Monster" folder ID to use
 */
export async function createCompanyFolder(
  companyName: string,
  rootFolderId?: string
): Promise<{ companyFolderId: string; rootFolderId: string }> {
  let seoMonsterFolderId = rootFolderId

  // If no root folder specified, search for or create "SEO Monster" folder
  if (!seoMonsterFolderId) {
    const existingFolders = await searchFolders('SEO Monster')
    const seoMonsterFolder = existingFolders.find((f) => f.name === 'SEO Monster')

    if (seoMonsterFolder) {
      seoMonsterFolderId = seoMonsterFolder.id
    } else {
      const newFolder = await createFolder('SEO Monster')
      seoMonsterFolderId = newFolder.id
    }
  }

  // Create company folder inside SEO Monster folder
  const companyFolder = await createFolder(companyName, seoMonsterFolderId)

  return {
    companyFolderId: companyFolder.id,
    rootFolderId: seoMonsterFolderId,
  }
}

/**
 * Get folder details by ID
 */
export async function getFolder(folderId: string): Promise<DriveFolder | null> {
  const token = await getGoogleToken()
  if (!token) {
    throw new Error('Google Drive not connected')
  }

  const accessToken = await refreshTokenIfNeeded(token)

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,name,webViewLink`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.ok) {
    if (response.status === 404) {
      return null
    }
    const error = await response.json()
    throw new Error(`Failed to get folder: ${error.error?.message || 'Unknown error'}`)
  }

  const folder = await response.json()

  return {
    id: folder.id,
    name: folder.name,
    webViewLink: folder.webViewLink,
  }
}

/**
 * Get or create a month subfolder within a parent folder
 * @param parentFolderId - The parent folder ID (company folder)
 * @param monthYear - Month/year string (e.g., "DEC25")
 */
export async function getOrCreateMonthFolder(
  parentFolderId: string,
  monthYear: string
): Promise<DriveFolder> {
  const token = await getGoogleToken()
  if (!token) {
    throw new Error('Google Drive not connected')
  }

  const accessToken = await refreshTokenIfNeeded(token)

  // Search for existing month folder within the parent
  const searchQuery = `mimeType='application/vnd.google-apps.folder' and name='${monthYear}' and '${parentFolderId}' in parents and trashed=false`

  const params = new URLSearchParams({
    q: searchQuery,
    fields: 'files(id,name,webViewLink)',
    pageSize: '1',
  })

  const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Failed to search for month folder: ${error.error?.message || 'Unknown error'}`)
  }

  const data = await response.json()

  // Return existing folder if found
  if (data.files && data.files.length > 0) {
    const folder = data.files[0]
    return {
      id: folder.id,
      name: folder.name,
      webViewLink: `https://drive.google.com/drive/folders/${folder.id}`,
    }
  }

  // Create new month folder
  return createFolder(monthYear, parentFolderId)
}

interface GoogleDocument {
  id: string
  name: string
  webViewLink: string
}

/**
 * Create a Google Doc in the specified folder
 * @param title - The document title
 * @param parentFolderId - The folder ID to create the document in
 */
export async function createDocument(
  title: string,
  parentFolderId: string
): Promise<GoogleDocument> {
  const token = await getGoogleToken()
  if (!token) {
    throw new Error('Google Drive not connected')
  }

  const accessToken = await refreshTokenIfNeeded(token)

  const metadata = {
    name: title,
    mimeType: 'application/vnd.google-apps.document',
    parents: [parentFolderId],
  }

  const response = await fetch(
    'https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metadata),
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Failed to create document: ${error.error?.message || 'Unknown error'}`)
  }

  const doc = await response.json()

  return {
    id: doc.id,
    name: doc.name,
    webViewLink: doc.webViewLink || `https://docs.google.com/document/d/${doc.id}/edit`,
  }
}

interface DocRevision {
  id: string
  modifiedTime: string
  lastModifyingUser?: {
    displayName?: string
    emailAddress?: string
    photoLink?: string
  }
}

/**
 * Get the revision history for a Google Doc
 * @param documentId - The Google Doc ID
 */
export async function getDocumentRevisions(documentId: string): Promise<DocRevision[]> {
  const token = await getGoogleToken()
  if (!token) {
    throw new Error('Google Drive not connected')
  }

  const accessToken = await refreshTokenIfNeeded(token)

  const params = new URLSearchParams({
    fields: 'revisions(id,modifiedTime,lastModifyingUser(displayName,emailAddress,photoLink))',
    pageSize: '100',
  })

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${documentId}/revisions?${params}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Failed to get revisions: ${error.error?.message || 'Unknown error'}`)
  }

  const data = await response.json()

  return (data.revisions || []).map(
    (rev: {
      id: string
      modifiedTime: string
      lastModifyingUser?: {
        displayName?: string
        emailAddress?: string
        photoLink?: string
      }
    }) => ({
      id: rev.id,
      modifiedTime: rev.modifiedTime,
      lastModifyingUser: rev.lastModifyingUser,
    })
  )
}

/**
 * Create a named version/snapshot of a Google Doc
 * This keeps the revision from being merged/deleted by Google
 * @param documentId - The Google Doc ID
 * @param versionName - The name for this version (e.g., "Ready for Editing")
 */
export async function createNamedVersion(documentId: string, versionName: string): Promise<void> {
  const token = await getGoogleToken()
  if (!token) {
    throw new Error('Google Drive not connected')
  }

  const accessToken = await refreshTokenIfNeeded(token)

  // First, get the latest revision
  const listParams = new URLSearchParams({
    fields: 'revisions(id)',
    pageSize: '1',
  })

  const listResponse = await fetch(
    `https://www.googleapis.com/drive/v3/files/${documentId}/revisions?${listParams}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!listResponse.ok) {
    const error = await listResponse.json()
    throw new Error(`Failed to get latest revision: ${error.error?.message || 'Unknown error'}`)
  }

  const listData = await listResponse.json()
  const revisions = listData.revisions || []

  if (revisions.length === 0) {
    // No revisions yet, nothing to name
    return
  }

  // Get the last revision (most recent)
  const latestRevisionId = revisions[revisions.length - 1]?.id

  if (!latestRevisionId) {
    return
  }

  // Update the revision to keep it forever and add a name in the published link
  // Note: Google Drive API v3 doesn't have a direct "name" field for revisions
  // We keep it by setting keepForever=true which prevents auto-cleanup
  const updateResponse = await fetch(
    `https://www.googleapis.com/drive/v3/files/${documentId}/revisions/${latestRevisionId}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        keepForever: true,
      }),
    }
  )

  if (!updateResponse.ok) {
    const error = await updateResponse.json()
    // Log but don't throw - this is a non-critical operation
    console.warn(
      `Failed to mark revision as keep forever (${versionName}):`,
      error.error?.message || 'Unknown error'
    )
  }
}
