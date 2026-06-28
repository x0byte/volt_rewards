interface ButtonProps {
  children: string
  href?: string
  small?: boolean
}

export default function Button({ children, href, small }: ButtonProps) {
  const cls = `hv-btn${small ? ' hv-btn--small' : ''} ttu`

  const inner = (
    <>
      <span className="hv-btn__wrapper oh">
        <span className="hv-btn__label hv-btn__label--base">{children}</span>
      </span>
      <span className="hv-btn__shimmer">
        <span className="hv-btn__shimmer-inner" />
      </span>
      <svg className="hv-btn__svg" fill="none" aria-hidden="true" viewBox="0 0 300 60" preserveAspectRatio="none">
        <defs>
          <linearGradient id="btnBorderGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#a78bfa" stopOpacity="1" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.6" />
          </linearGradient>
        </defs>
        <rect x="0.5" y="0.5" width="299" height="59" rx="5" ry="5" stroke="url(#btnBorderGrad)" />
      </svg>
    </>
  )

  if (href) {
    return (
      <a href={href} className={cls}>
        {inner}
      </a>
    )
  }

  return <button className={cls}>{inner}</button>
}
