import sharp from 'sharp'
import path from 'path'

async function generateCircularFavicon() {
  const inputPath = path.join(process.cwd(), 'public', 'logo.jpg')
  const outputPath = path.join(process.cwd(), 'public', 'icon.png')

  // Get image metadata to find dimensions
  const metadata = await sharp(inputPath).metadata()
  const size = Math.min(metadata.width || 512, metadata.height || 512)

  // Create circular mask
  const circleSize = 512
  const circleMask = Buffer.from(
    `<svg width="${circleSize}" height="${circleSize}">
      <circle cx="${circleSize / 2}" cy="${circleSize / 2}" r="${circleSize / 2}" fill="white"/>
    </svg>`
  )

  // Extract center square, resize to 512x512, apply circular mask
  await sharp(inputPath)
    .resize(circleSize, circleSize, {
      fit: 'cover',
      position: 'left', // Focus on left side where the monster is
    })
    .composite([
      {
        input: circleMask,
        blend: 'dest-in',
      },
    ])
    .png()
    .toFile(outputPath)

  console.log(`✅ Generated circular favicon: ${outputPath}`)
}

generateCircularFavicon().catch(console.error)
