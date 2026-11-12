import AuthLogo from './AuthLogo'

/**
 * Panneau de marque (bureau uniquement) : un plan dessiné à la main, cote en mm
 * comme dans l'application. Décoratif : aucun texte ajouté à la page.
 */
export default function AuthBrandPanel() {
  return (
    <aside className="relative hidden flex-col justify-between overflow-hidden bg-indigo-950 p-12 lg:flex">
      <AuthLogo inverse />
      <svg
        viewBox="0 0 360 300"
        aria-hidden="true"
        focusable="false"
        className="relative mx-auto w-full max-w-md text-indigo-300"
      >
        <defs>
          <pattern id="auth-plan-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M20 0H0V20" fill="none" stroke="currentColor" strokeOpacity="0.12" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="360" height="300" fill="url(#auth-plan-grid)" />
        {/* Murs extérieurs */}
        <rect x="40" y="50" width="280" height="200" fill="none" stroke="currentColor" strokeWidth="6" strokeOpacity="0.85" />
        {/* Cloison verticale avec passage */}
        <path d="M180 50V138M180 178V250" fill="none" stroke="currentColor" strokeWidth="6" strokeOpacity="0.85" />
        {/* Cloison horizontale avec porte */}
        <path d="M180 150H246M278 150H320" fill="none" stroke="currentColor" strokeWidth="6" strokeOpacity="0.85" />
        {/* Vantail et débattement de la porte */}
        <path d="M246 150V120A30 30 0 0 1 276 150" fill="none" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.7" />
        {/* Cote horizontale : 3500 mm */}
        <path
          d="M40 282H180M40 272V292M180 272V292"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeOpacity="0.8"
        />
        <text
          x="110"
          y="268"
          textAnchor="middle"
          fill="currentColor"
          fontSize="13"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          3500 mm
        </text>
      </svg>
    </aside>
  )
}
