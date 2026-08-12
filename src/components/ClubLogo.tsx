interface ClubLogoProps {
  className?: string
  size: number
}

export function ClubLogo({ className, size }: ClubLogoProps) {
  return (
    <img
      className={className}
      src="/branding/ppc-logo.png"
      alt="Princeton Poker Club logo"
      width={size}
      height={size}
    />
  )
}
