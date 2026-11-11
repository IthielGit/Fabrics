/** Groupe de pastilles (`Choice`) avec sa légende. */
export default function ChoiceGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-slate-900">{label}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  )
}
