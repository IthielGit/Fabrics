/**
 * Fabrique un petit classeur .xlsx pour les tests de l'import (données synthétiques uniquement).
 * Un nombre peut être donné en texte brut (`{ n: '208333.33333333334' }`) pour tester la lecture exacte.
 */
import { strToU8, zipSync } from 'fflate'

export type FixtureCell = string | number | { n: string } | null
export interface FixtureSheet {
  name: string
  /** Lignes à partir de A1 ; `null` = cellule vide. */
  rows: FixtureCell[][]
}

function colName(index: number): string {
  let name = ''
  let n = index + 1
  while (n > 0) {
    const rest = (n - 1) % 26
    name = String.fromCharCode(65 + rest) + name
    n = Math.floor((n - 1) / 26)
  }
  return name
}

function escape(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export function buildXlsx(sheets: FixtureSheet[]): Uint8Array {
  const strings: string[] = []
  const stringIndex = new Map<string, number>()
  const files: Record<string, Uint8Array> = {}
  sheets.forEach((sheet, sheetIndex) => {
    const rowsXml = sheet.rows
      .map((cells, r) => {
        const cellsXml = cells
          .map((cell, c) => {
            if (cell === null) return ''
            const ref = `${colName(c)}${r + 1}`
            if (typeof cell === 'number') return `<c r="${ref}"><v>${cell}</v></c>`
            if (typeof cell === 'object') return `<c r="${ref}"><v>${cell.n}</v></c>`
            let index = stringIndex.get(cell)
            if (index === undefined) {
              index = strings.length
              strings.push(cell)
              stringIndex.set(cell, index)
            }
            return `<c r="${ref}" t="s"><v>${index}</v></c>`
          })
          .join('')
        return `<row r="${r + 1}">${cellsXml}</row>`
      })
      .join('')
    files[`xl/worksheets/sheet${sheetIndex + 1}.xml`] = strToU8(
      `<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rowsXml}</sheetData></worksheet>`,
    )
  })
  files['xl/sharedStrings.xml'] = strToU8(
    `<?xml version="1.0" encoding="UTF-8"?><sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${strings
      .map((s) => `<si><t xml:space="preserve">${escape(s)}</t></si>`)
      .join('')}</sst>`,
  )
  files['xl/workbook.xml'] = strToU8(
    `<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets
      .map((sheet, i) => `<sheet name="${escape(sheet.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`)
      .join('')}</sheets></workbook>`,
  )
  files['xl/_rels/workbook.xml.rels'] = strToU8(
    `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets
      .map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`)
      .join('')}</Relationships>`,
  )
  return zipSync(files)
}

/** Classeur synthétique au format « Expert BTP » : 2 matériaux, 2 tableaux de matériel et de MO, 2 postes. */
export function syntheticWorkbook(): FixtureSheet[] {
  return [
    {
      name: 'MTX',
      rows: [
        ['◀ TABLEAU DE BORD'],
        [null, 'BASE DE PRIX'],
        [null, 'Date de mise à jour', null, null, 46296],
        [null, 'CODES', 'CATEGORIES', 'DESIGNATIONS', 'UNITES', 'PU HT ANTANANARIVO', 'PU TTC ANTANANARIVO', 'FRAIS DE TRANSPORT', 'PU HT LIVRE SUR CHANTIER', 'PRIX TTC LIVRE SUR CHANTIER', 'FOURNISSEUR'],
        [null, '1', 'LIANT', null, null, null, 0, null, null, 0],
        [null, '1.1', 'LIANT', 'Liant  synthétique\nsac  A', 'Sac', 1000, 1200, null, 1000, 1200, 'Fournisseur X'],
        [null, '1.2', 'GRANULAT', 'Granulat synthétique', 'm3', 500, 500, null, 500, 500, 'Fournisseur Y'],
        [null, '1.3', 'DIVERS', 'Article sans prix', 'U', null, null, null, null, 0, ''],
        [null, '1.4', 'DIVERS', 'Article à virgule', 'kg', null, null, null, { n: '30416.666666666668' }, { n: '36500.000000000004' }, ''],
      ],
    },
    {
      name: 'MTL ET OUTILLAGE',
      rows: [
        [],
        [],
        [null, 'Date de mise à jour', null, null, 46296],
        [null, 'DESIGNATION', 'UNITES', 'PRIX HT TANA', "Durée d'amortissement (jour)", 'Prix location par jour (Ariary)', 'Carburant par jour(Ar)', 'Prix location par heure (Ariary)', 'FOURNISSEUR'],
        [null, 'Engin synthétique', 'U', 900000, 100, 9000, 1000, 1125],
        [null, 'Casque synthétique', 'U', 2500],
        [null, 'LOT DE PETIT MATERIEL'],
        [null, 'DESIGNATION', 'UNITES', 'PRIX HT TANA', "Durée d'Amortissement (jour)", "Montant d'Amortissement par jour", "Nombre d'outillage necessaire", "Montant d'Amortissement total"],
        [null, 'Pelle synthétique', 'Jour', 3000, 30, 100, 2, 200],
        [null, 'TOTAL LOT DE PETIT MATERIEL', null, null, null, null, null, 200],
      ],
    },
    {
      name: 'MO',
      rows: [
        [],
        [null, 'Date de mise à jour', 46296],
        [],
        [],
        [null, 'Designation', 'MO/mois', 'MO/semaine', 'MO/jr', 'MO/hr'],
        [null, 'Chef synthétique', 520000, 120000, 20000, 2500],
        [],
        [null, 'Designation', 'MO / jr', 'MO/hr'],
        [null, 'Aide synthétique', { n: '16346.153846153846' }, 2043],
      ],
    },
    {
      name: 'BIBLIOTHEQUE_TRAVAUX',
      rows: [
        [],
        [],
        [null, 'Code', 'Catégorie', 'Désignation du sous-détail de prix', 'Unité', 'Prix de référence (Ar)', 'Aller à la feuille SDP'],
        [null, 'CAT-01-001', 'Essais', 'Poste synthétique A', 'm2', 3700, '🔗VOIR_SDP_001'],
        [null, 'CAT-01-002', 'Essais', 'Poste synthétique B', 'ml', 1100, '🔗 VOIR_SPD_002'],
        [null, 'CAT-01-003', 'Essais', 'Poste sans sous-détail', 'U', 500, '🔗VOIR_SDP_009'],
        [null, null, null, null, null, 'TOTAL CAT-01', 3],
      ],
    },
    {
      name: 'SDP',
      rows: [
        ['SDP-001', 'DESIGNATION', 'Poste synthétique A', null, 'Coeff. de déboursé K=', { n: '1.1000000000000001' }],
        [null, 'UNITE', 'm2'],
        [null, 'RENDEMENT', 1],
        [null, 'POSTES', 'UNITE', 'QUANTITE', 'P.U', 'MONTANT'],
        [null, 'Matériels'],
        [null, 'Outil synthétique', 'J', 1, 1000, 1000],
        [null, 'Matériaux'],
        [null, 'Sous-titre sans valeur'],
        [null, 'Granulat synthétique', 'm3', { n: '0.5' }, 2000, 1000],
        [null, 'Ligne vide', 'U', 0, 300, 0],
        [null, 'Personnel'],
        [null, 'Aide synthétique', 'H', 2, { n: '681.3' }, { n: '1362.6' }],
        [null, null, null, null, 'MTL', 1000],
        [null, null, null, null, 'MTX', 1000],
        [null, null, null, null, 'MO', { n: '1362.6' }],
        [null, 'Total', null, null, null, { n: '3362.6' }],
        [null, 'Prix unitaire: ', null, null, null, { n: '3698.86' }],
        [],
        ['SDP-002', 'DESIGNATION', 'Poste synthétique B', null, 'Coeff. de déboursé K=', 1.1],
        [null, 'UNITE', 'UNITE'],
        [null, 'RENDEMENT', 1],
        [null, 'POSTES', 'UNITE', 'QUANTITE', 'P.U', 'MONTANT'],
        [null, 'Personnel'],
        [null, 'Aide synthétique', 'H', 1, 1000, 1000],
        [null, 'Total', null, null, null, 1000],
        [null, 'Prix unitaire: ', null, null, null, 1000],
        ['SDP-003', 'DESIGNATION', 'Sous-détail orphelin', null, 'Coeff. de déboursé K=', 1.1],
        [null, 'Total', null, null, null, 10],
      ],
    },
  ]
}
