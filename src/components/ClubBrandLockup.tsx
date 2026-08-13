import { ClubLogo } from './ClubLogo'

interface ClubBrandLockupProps {
  organizationName: string
  title: string
  titleId?: string
  className?: string
  logoClassName?: string
  logoSize?: number
}

export function ClubBrandLockup({
  organizationName,
  title,
  titleId,
  className,
  logoClassName,
  logoSize,
}: ClubBrandLockupProps) {
  return (
    <div className={`club-brand-lockup ${className ?? ''}`.trim()}>
      <ClubLogo className={logoClassName} size={logoSize ?? 52} />
      <div>
        <p className="club-brand-organization">{organizationName}</p>
        <h1 id={titleId}>{title}</h1>
      </div>
    </div>
  )
}
