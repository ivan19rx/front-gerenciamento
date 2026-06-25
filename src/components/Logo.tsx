interface LogoProps {
  size?: number
}

export function Logo({ size = 48 }: LogoProps) {
  return (
    <img
      src="/logo.jpeg"
      alt="Logo SL"
      style={{
        height: size,
        width: size,
        objectFit: 'cover',
        objectPosition: 'center',
        borderRadius: 8,
        display: 'block',
        flexShrink: 0,
      }}
    />
  )
}
