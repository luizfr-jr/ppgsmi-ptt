'use client'

import { useEffect, useState } from 'react'

interface NinMaLogoProps {
  className?: string
}

export function NinMaLogo({ className = 'h-10 w-auto' }: NinMaLogoProps) {
  // Start with SVG (safe for SSR). Switch to PNG only if the file actually loads.
  const [pngLoaded, setPngLoaded] = useState(false)

  useEffect(() => {
    const img = new window.Image()
    img.onload = () => setPngLoaded(true)
    img.src = '/logo-ninma.png'
  }, [])

  if (pngLoaded) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src="/logo-ninma.png" alt="NinMaHub" className={className} />
  }

  return <LogoSVG className={className} />
}

function LogoSVG({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 500 500"
      className={className}
      aria-label="NinMaHub"
    >
      {/* Arc of dots: teal → orange → pink */}
      <circle cx="38"  cy="310" r="14" fill="#5fc3ad" />
      <circle cx="62"  cy="272" r="13" fill="#5fc3ad" />
      <circle cx="92"  cy="238" r="12" fill="#5fc3ad" />
      <circle cx="126" cy="208" r="11" fill="#f9a870" />
      <circle cx="163" cy="182" r="10" fill="#f9a870" />
      <circle cx="202" cy="162" r="9"  fill="#f9a870" />
      <circle cx="242" cy="147" r="9"  fill="#f9a870" />
      <circle cx="283" cy="138" r="8"  fill="#f9a870" />
      <circle cx="323" cy="133" r="8"  fill="#f9a870" />
      <circle cx="362" cy="133" r="7"  fill="#f9a870" />
      <circle cx="397" cy="138" r="7"  fill="#f05a72" />
      <circle cx="428" cy="150" r="6"  fill="#f05a72" />

      <text x="148" y="318"
        fontFamily="'Nunito','Varela Round','Arial Rounded MT Bold',Arial,sans-serif"
        fontSize="148" fontWeight="800" fill="#7b6faf" letterSpacing="-2">
        ninMa
      </text>
      <text x="268" y="445"
        fontFamily="'Nunito','Varela Round','Arial Rounded MT Bold',Arial,sans-serif"
        fontSize="148" fontWeight="800" fill="#7b6faf" letterSpacing="-2">
        hub
      </text>
      <text x="148" y="348"
        fontFamily="'Nunito',Arial,sans-serif"
        fontSize="26" fontWeight="400" fill="#7b6faf">
        Núcleo de Inovação
      </text>
      <text x="148" y="380"
        fontFamily="'Nunito',Arial,sans-serif"
        fontSize="26" fontWeight="700" fill="#7b6faf">
        Materno Infantil <tspan fontWeight="400">UFN</tspan>
      </text>
    </svg>
  )
}
