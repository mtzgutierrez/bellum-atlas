interface IconProps {
  name: string
  size?: number
  color?: string
  strokeWidth?: number
  style?: React.CSSProperties
}

export default function Icon({ name, size = 16, color = 'currentColor', strokeWidth = 1.5, style }: IconProps) {
  const props = {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: color, strokeWidth, strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const, style,
  }
  switch (name) {
    case 'search': return <svg {...props}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
    case 'sword': return <svg {...props}><path d="M14.5 17.5L3 6V3h3l11.5 11.5"/><path d="M13 19l6-6"/><path d="M16 16l4 4"/><path d="M19 21l2-2"/></svg>
    case 'shield': return <svg {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
    case 'anchor': return <svg {...props}><circle cx="12" cy="5" r="3"/><path d="M12 22V8"/><path d="M5 12H2a10 10 0 0020 0h-3"/></svg>
    case 'plane': return <svg {...props}><path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5L3 8l9 5-5 4-4-1-1 1 4 4 1-1-1-4 4-5 5 9 1.3-.7c.4-.2.6-.6.5-1.1z"/></svg>
    case 'castle': return <svg {...props}><path d="M2 21V8l3-2v3l3-2v3l3-2v3l3-2v3l3-2v3l3 2v9z"/><path d="M10 21v-5a2 2 0 014 0v5"/></svg>
    case 'crown': return <svg {...props}><path d="M2 4l3 12h14l3-12-6 4-4-8-4 8-6-4z"/><path d="M5 16h14"/></svg>
    case 'map': return <svg {...props}><path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v16M15 6v16"/></svg>
    case 'map-pin': return <svg {...props}><path d="M20 10c0 7-8 12-8 12s-8-5-8-12a8 8 0 0116 0z"/><circle cx="12" cy="10" r="3"/></svg>
    case 'calendar': return <svg {...props}><rect x="3" y="4" width="18" height="18" rx="0"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
    case 'clock': return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
    case 'home': return <svg {...props}><path d="M3 12L12 3l9 9v9h-6v-6h-6v6H3z"/></svg>
    case 'user': return <svg {...props}><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></svg>
    case 'menu': return <svg {...props}><path d="M3 6h18M3 12h18M3 18h18"/></svg>
    case 'filter': return <svg {...props}><path d="M3 5h18M6 12h12M10 19h4"/></svg>
    case 'sliders': return <svg {...props}><path d="M4 6h7M15 6h5M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="13" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/></svg>
    case 'arrow-right': return <svg {...props}><path d="M5 12h14M13 6l6 6-6 6"/></svg>
    case 'arrow-left': return <svg {...props}><path d="M19 12H5M11 18l-6-6 6-6"/></svg>
    case 'arrow-down': return <svg {...props}><path d="M12 5v14M6 13l6 6 6-6"/></svg>
    case 'crosshair': return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M22 12h-4M6 12H2M12 6V2M12 22v-4"/></svg>
    case 'chevron-right': return <svg {...props}><path d="M9 6l6 6-6 6"/></svg>
    case 'chevron-down': return <svg {...props}><path d="M6 9l6 6 6-6"/></svg>
    case 'plus': return <svg {...props}><path d="M12 5v14M5 12h14"/></svg>
    case 'minus': return <svg {...props}><path d="M5 12h14"/></svg>
    case 'compass': return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M16 8l-2 6-6 2 2-6 6-2z"/></svg>
    case 'layers': return <svg {...props}><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 12l10 5 10-5M2 17l10 5 10-5"/></svg>
    case 'globe': return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"/></svg>
    case 'external': return <svg {...props}><path d="M14 4h6v6M20 4l-9 9M20 14v6H4V4h6"/></svg>
    case 'trophy': return <svg {...props}><path d="M6 4h12v4a6 6 0 01-12 0V4z"/><path d="M6 6H3v2a3 3 0 003 3M18 6h3v2a3 3 0 01-3 3M9 18h6M10 14v4M14 14v4M8 22h8"/></svg>
    case 'skull': return <svg {...props}><path d="M4 12a8 8 0 0116 0v4l-3 2v3H7v-3l-3-2z"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><path d="M11 17l1-2 1 2"/></svg>
    case 'flame': return <svg {...props}><path d="M12 22c4 0 7-3 7-7 0-3-2-5-3-7 0 2-2 3-3 3 0-3-1-5-3-7-1 4-5 6-5 11a7 7 0 007 7z"/></svg>
    case 'star': return <svg {...props}><path d="M12 3l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/></svg>
    case 'check': return <svg {...props}><path d="M5 12l5 5L20 7"/></svg>
    case 'x': return <svg {...props}><path d="M6 6l12 12M18 6L6 18"/></svg>
    case 'eye': return <svg {...props}><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>
    case 'book': return <svg {...props}><path d="M4 4v16a2 2 0 002 2h14V6a2 2 0 00-2-2H6a2 2 0 00-2 2z"/><path d="M8 4v18M12 8h6M12 12h6"/></svg>
    case 'flag': return <svg {...props}><path d="M5 21V4M5 4h12l-2 4 2 4H5"/></svg>
    default: return <svg {...props}><circle cx="12" cy="12" r="9"/></svg>
  }
}
