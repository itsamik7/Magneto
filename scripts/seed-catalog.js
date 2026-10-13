/**
 * Programmatic catalog seed script for Supabase
 * Usage: node scripts/seed-catalog.js
 */
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://telsqvdytbpfyevgvngb.supabase.co'
const secretKey = process.env.SUPABASE_SECRET_KEY || ''

if (!secretKey) {
  console.log('SUPABASE_SECRET_KEY not set. Set it before running: SUPABASE_SECRET_KEY=... node scripts/seed-catalog.js')
}

const supabase = createClient(supabaseUrl, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function seed() {
  console.log('Connecting to Supabase at:', supabaseUrl)

  // Read destinations from TypeScript catalog
  const catalogPath = path.join(__dirname, '../src/data/destinationsCatalog.ts')
  const content = fs.readFileSync(catalogPath, 'utf8')
  const jsonMatch = content.match(/DESTINATIONS_CATALOG:\s*DestinationWithMagnet\[\]\s*=\s*(\[[\s\S]*?\]);/)

  if (!jsonMatch) {
    console.error('Could not parse destinations catalog from file')
    process.exit(1)
  }

  const destinations = JSON.parse(jsonMatch[1])
  console.log(`Parsed ${destinations.length} destinations from catalog`)

  // Check if destinations table exists
  const { error: testErr } = await supabase.from('destinations').select('id').limit(1)
  if (testErr) {
    console.log(
      'Note: Destinations table not yet created in Supabase schema cache.',
      'Run supabase/migrations/20261013000001_destination_catalog.sql in the Supabase SQL editor first.'
    )
    return
  }

  // Extract unique countries
  const countriesMap = new Map()
  destinations.forEach((d) => {
    if (!countriesMap.has(d.country_code)) {
      countriesMap.set(d.country_code, {
        name: d.country_name,
        country_code: d.country_code,
        continent: d.continent,
        flag_emoji: d.flag_emoji || '✈️',
      })
    }
  })

  console.log(`Upserting ${countriesMap.size} countries...`)
  for (const c of countriesMap.values()) {
    await supabase.from('countries').upsert(c, { onConflict: 'country_code' })
  }

  // Get countries with IDs
  const { data: dbCountries } = await supabase.from('countries').select('id, country_code')
  const countryIdLookup = new Map()
  dbCountries?.forEach((c) => countryIdLookup.set(c.country_code, c.id))

  console.log('Upserting destinations and magnet assets...')
  for (const d of destinations) {
    const countryId = countryIdLookup.get(d.country_code)
    if (!countryId) continue

    const { data: destRow, error: destErr } = await supabase
      .from('destinations')
      .upsert(
        {
          slug: d.slug,
          name: d.name,
          country_id: countryId,
          city: d.city || null,
          region: d.region || null,
          continent: d.continent,
          destination_type: d.destination_type,
          short_description: d.short_description || null,
          landmark_names: d.landmark_names || [],
          tags: d.tags || [],
          popularity_score: d.popularity_score || 0,
          is_featured: !!d.is_featured,
          is_active: true,
        },
        { onConflict: 'slug' }
      )
      .select('id')
      .single()

    if (destErr) {
      console.warn(`Error upserting destination ${d.slug}:`, destErr.message)
      continue
    }

    if (destRow) {
      await supabase.from('magnet_assets').upsert({
        destination_id: destRow.id,
        asset_url: d.asset_url,
        asset_format: d.asset_url.endsWith('.png') ? 'png' : 'svg',
        magnet_shape: d.magnet_shape,
        dominant_colors: d.dominant_colors || [],
        is_primary: true,
      })
    }
  }

  console.log('Seeding finished successfully!')
}

seed().catch(console.error)
