import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { searchFolders, createCompanyFolder, isGoogleDriveConnected } from '@/lib/google-drive'
import { z } from 'zod'

// GET /api/integrations/google/folders?search=query
// Search for folders in Google Drive
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('search')

    if (!query) {
      return NextResponse.json({ error: 'search parameter is required' }, { status: 400 })
    }

    if (!(await isGoogleDriveConnected())) {
      return NextResponse.json({ error: 'Google Drive not connected' }, { status: 400 })
    }

    const folders = await searchFolders(query)

    return NextResponse.json({ data: folders })
  } catch (error) {
    console.error('GET /api/integrations/google/folders error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

const createFolderSchema = z.object({
  company_id: z
    .string()
    .regex(
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
      'Invalid UUID format'
    ),
})

// POST /api/integrations/google/folders
// Create a folder for a company in Google Drive
export async function POST(request: NextRequest) {
  try {
    if (!(await isGoogleDriveConnected())) {
      return NextResponse.json({ error: 'Google Drive not connected' }, { status: 400 })
    }

    const body = await request.json()
    const { company_id } = createFolderSchema.parse(body)

    const supabase = createAdminClient()

    // Get company details
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name, google_drive_folder_id')
      .eq('id', company_id)
      .single()

    if (companyError || !company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Check if folder already exists
    if (company.google_drive_folder_id) {
      return NextResponse.json(
        { error: 'Company already has a folder configured' },
        { status: 400 }
      )
    }

    // Create folder in Google Drive
    const { companyFolderId } = await createCompanyFolder(company.name)

    // Update company with folder ID
    const { error: updateError } = await supabase
      .from('companies')
      .update({ google_drive_folder_id: companyFolderId })
      .eq('id', company_id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      data: {
        folder_id: companyFolderId,
        folder_url: `https://drive.google.com/drive/folders/${companyFolderId}`,
      },
      message: `Folder created for ${company.name}`,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    console.error('POST /api/integrations/google/folders error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
