import { bool, type IfcModel, identifier, label, text } from './ifc-model'
import { type StepRef, type StepValue, typed } from './step'

/**
 * Host additions to an IFC export (Fabrics, M22): property sets, quantity
 * sets and classification references, keyed by Pascal node id. Values are in
 * the file's SI units (m, m², m³). Each set lands on every IFC product written
 * for its node; nodes that wrote no product are listed in `unmatched`.
 */
export interface IfcExportExtensions {
  propertySets?: Readonly<Record<string, readonly IfcExtraPropertySet[]>>
  quantitySets?: Readonly<Record<string, readonly IfcExtraQuantitySet[]>>
  classification?: IfcExtraClassification
}

export interface IfcExtraPropertySet {
  name: string
  properties: readonly IfcExtraProperty[]
}

export interface IfcExtraProperty {
  name: string
  kind: 'label' | 'identifier' | 'text' | 'boolean' | 'real' | 'integer'
  value: string | number | boolean
}

export interface IfcExtraQuantitySet {
  name: string
  quantities: readonly IfcExtraQuantity[]
}

export interface IfcExtraQuantity {
  name: string
  kind: 'length' | 'area' | 'volume' | 'count'
  value: number
  description?: string
}

export interface IfcExtraClassification {
  source: string
  edition: string
  name: string
  location?: string
  /** Node id → reference (`Identification`, `Name`). */
  references: Readonly<Record<string, { identification: string; name: string }>>
}

const QUANTITY_ENTITY: Record<IfcExtraQuantity['kind'], string> = {
  length: 'IFCQUANTITYLENGTH',
  area: 'IFCQUANTITYAREA',
  volume: 'IFCQUANTITYVOLUME',
  count: 'IFCQUANTITYCOUNT',
}

function propertyValue(property: IfcExtraProperty): StepValue {
  switch (property.kind) {
    case 'label':
      return label(String(property.value))
    case 'identifier':
      return identifier(String(property.value))
    case 'text':
      return text(String(property.value))
    case 'boolean':
      return bool(Boolean(property.value))
    case 'integer':
      return typed('IFCINTEGER', Math.round(Number(property.value)))
    case 'real':
      return typed('IFCREAL', Number(property.value))
  }
}

/** Writes the extensions; returns the node ids that had sets but no product. */
export function writeExtensions(
  model: IfcModel,
  extensions: IfcExportExtensions,
  productsByNodeId: ReadonlyMap<string, StepRef[]>,
  project: StepRef,
): string[] {
  const { step } = model
  const unmatched = new Set<string>()
  const productsOf = (nodeId: string) => {
    const refs = productsByNodeId.get(nodeId) ?? []
    if (refs.length === 0) unmatched.add(nodeId)
    return refs
  }

  for (const [nodeId, sets] of Object.entries(extensions.propertySets ?? {})) {
    const refs = productsOf(nodeId)
    for (const set of sets) {
      model.propertySet(
        nodeId,
        set.name,
        set.properties.map((property) => [property.name, propertyValue(property)]),
        refs,
      )
    }
  }

  for (const [nodeId, sets] of Object.entries(extensions.quantitySets ?? {})) {
    const refs = productsOf(nodeId)
    if (refs.length === 0) continue
    for (const set of sets) {
      const quantities = set.quantities
        .filter((quantity) => Number.isFinite(quantity.value))
        .map((quantity) =>
          step.add(
            QUANTITY_ENTITY[quantity.kind],
            quantity.name,
            quantity.description ?? null,
            null,
            quantity.value,
            null,
          ),
        )
      if (quantities.length === 0) continue
      const qto = step.add(
        'IFCELEMENTQUANTITY',
        model.guid(`${nodeId}:qto:${set.name}`),
        model.ownerHistory,
        set.name,
        null,
        null,
        quantities,
      )
      model.rel('IFCRELDEFINESBYPROPERTIES', `${nodeId}:rel:${set.name}`, refs, qto)
    }
  }

  const classification = extensions.classification
  if (classification) {
    const source = step.add(
      'IFCCLASSIFICATION',
      classification.source,
      classification.edition,
      null,
      classification.name,
      null,
      classification.location ?? null,
      null,
    )
    model.rel(
      'IFCRELASSOCIATESCLASSIFICATION',
      `classification:${classification.name}`,
      [project],
      source,
    )
    // One reference per code, shared by every product that carries it.
    const byCode = new Map<string, { name: string; products: StepRef[] }>()
    for (const [nodeId, reference] of Object.entries(classification.references)) {
      const refs = productsOf(nodeId)
      if (refs.length === 0) continue
      const entry = byCode.get(reference.identification) ?? { name: reference.name, products: [] }
      entry.products.push(...refs)
      byCode.set(reference.identification, entry)
    }
    for (const [code, entry] of byCode) {
      const reference = step.add(
        'IFCCLASSIFICATIONREFERENCE',
        null,
        code,
        entry.name,
        source,
        null,
        null,
      )
      model.rel(
        'IFCRELASSOCIATESCLASSIFICATION',
        `classification:${classification.name}:${code}`,
        entry.products,
        reference,
      )
    }
  }
  return [...unmatched].sort()
}
