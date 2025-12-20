import type { ContentType } from '../constants/content-types'

/**
 * Generate article card name
 * Format: {COMPANY} {TYPE} {#} - {Title} - {MONYY}
 * Posted: POSTED-{MONYY} - {COMPANY} {TYPE} {#} - {Title}
 */
export function generateCardName(
  companyName: string,
  contentType: ContentType,
  articleNumber: number,
  title: string,
  monthYear: string,
  isPosted: boolean = false
): string {
  const typeAbbrev = contentType.toUpperCase()

  if (isPosted) {
    return `POSTED-${monthYear} - ${companyName.toUpperCase()} ${typeAbbrev} ${articleNumber} - ${title}`
  }

  return `${companyName.toUpperCase()} ${typeAbbrev} ${articleNumber} - ${title} - ${monthYear}`
}

/**
 * Format current date to MONYY format (e.g., "DEC25")
 */
export function formatMonthYear(date: Date = new Date()): string {
  const months = [
    'JAN',
    'FEB',
    'MAR',
    'APR',
    'MAY',
    'JUN',
    'JUL',
    'AUG',
    'SEP',
    'OCT',
    'NOV',
    'DEC',
  ]
  const year = date.getFullYear().toString().slice(-2)
  return `${months[date.getMonth()]}${year}`
}

/**
 * Parse MONYY format to Date object (first day of month)
 */
export function parseMonthYear(monthYear: string): Date | null {
  const months: Record<string, number> = {
    JAN: 0,
    FEB: 1,
    MAR: 2,
    APR: 3,
    MAY: 4,
    JUN: 5,
    JUL: 6,
    AUG: 7,
    SEP: 8,
    OCT: 9,
    NOV: 10,
    DEC: 11,
  }

  const match = monthYear.match(/^([A-Z]{3})(\d{2})$/)
  if (!match) return null

  const [, month, year] = match
  const monthIndex = months[month]
  if (monthIndex === undefined) return null

  const fullYear = 2000 + parseInt(year, 10)
  return new Date(fullYear, monthIndex, 1)
}

/**
 * Generate Google Doc folder path
 * Format: /SEO Monster/{Company Name}/{MONYY}/
 */
export function generateDriveFolderPath(companyName: string, monthYear: string): string {
  return `SEO Monster/${companyName}/${monthYear}`
}

/**
 * Create slug from company name
 */
export function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
