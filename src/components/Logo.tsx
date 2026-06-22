interface LogoProps {
  size?: number
}

export function Logo({ size = 48 }: LogoProps) {
  return (
    <img
      src="/logo.png"
      alt="Logo SL"
      style={{
        height: size,
        width: 'auto',
        display: 'block',
        flexShrink: 0,
        objectFit: 'contain',
      }}
    />
  )
}
