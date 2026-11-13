interface ChoiceGroupProps {
  label: string
  children: React.ReactNode
  /** Pastilles rangées en trois colonnes égales (listes longues), au lieu de passer à la ligne. */
  columns?: boolean
}

/** Groupe de pastilles (`Choice`) avec sa légende. */
export default function ChoiceGroup({ label, children, columns = false }: ChoiceGroupProps) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-slate-900">{label}</legend>
      <div className={columns ? 'grid grid-cols-3 gap-2' : 'flex flex-wrap gap-2'}>{children}</div>
    </fieldset>
  )
}
