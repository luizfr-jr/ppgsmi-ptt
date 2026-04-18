/**
 * Gera os ícones PWA a partir de public/logo-ninma.png
 * Uso: node scripts/generate-icons.mjs
 */

import sharp from 'sharp'
import { existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const SOURCE = join(ROOT, 'public', 'logo-ninma.png')
const ICONS_DIR = join(ROOT, 'public', 'icons')

const ICONS = [
  { name: 'icon-72.png',   size: 72  },
  { name: 'icon-96.png',   size: 96  },
  { name: 'icon-128.png',  size: 128 },
  { name: 'icon-144.png',  size: 144 },
  { name: 'icon-152.png',  size: 152 },
  { name: 'icon-192.png',  size: 192 },
  { name: 'icon-384.png',  size: 384 },
  { name: 'icon-512.png',  size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'favicon-32.png', size: 32 },
  { name: 'favicon-16.png', size: 16 },
]

async function main() {
  if (!existsSync(SOURCE)) {
    console.error('❌  Arquivo não encontrado: public/logo-ninma.png')
    console.error('   Salve o PNG do logo NinMaHub nesse caminho e tente novamente.')
    process.exit(1)
  }

  if (!existsSync(ICONS_DIR)) {
    mkdirSync(ICONS_DIR, { recursive: true })
    console.log('📁  Criada pasta public/icons/')
  }

  // Detecta se o logo tem fundo branco para adicionar padding no ícone PWA
  const meta = await sharp(SOURCE).metadata()
  console.log(`📐  Imagem source: ${meta.width}×${meta.height}px  (${meta.format})`)

  for (const icon of ICONS) {
    const dest = join(ICONS_DIR, icon.name)

    // Para ícones PWA maiores, adiciona fundo branco + padding de 10%
    const pad = Math.round(icon.size * 0.1)
    const inner = icon.size - pad * 2

    await sharp(SOURCE)
      .resize(inner, inner, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .extend({ top: pad, bottom: pad, left: pad, right: pad, background: { r: 255, g: 255, b: 255, alpha: 255 } })
      .flatten({ background: { r: 255, g: 255, b: 255 } })
      .png()
      .toFile(dest)

    console.log(`✅  ${icon.name.padEnd(26)} ${icon.size}×${icon.size}px`)
  }

  // Gera também favicon.ico (32px)
  const favicoSrc = join(ICONS_DIR, 'favicon-32.png')
  const favicoOut = join(ROOT, 'public', 'favicon.ico')
  await sharp(favicoSrc).toFile(favicoOut)
  console.log(`✅  favicon.ico`)

  console.log('\n🎉  Todos os ícones gerados em public/icons/')
  console.log('   Adicione ao <head> do layout.tsx se necessário:')
  console.log('   <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />')
}

main().catch(err => {
  console.error('Erro:', err.message)
  process.exit(1)
})
