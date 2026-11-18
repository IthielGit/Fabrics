import { Layers, Package, Palette, Settings } from 'lucide-react'
import type { ComponentType, ReactNode } from 'react'
import type { Translate } from '../i18n/useT'
import PaintPanel from './PaintPanel'
import { BuiltInPanel, EditorItemsPanel } from './PascalTabPanels'

export interface PascalTab {
  id: string
  label: string
  icon: ReactNode
  mobileIcon: ReactNode
  mobileDefaultSnap?: number
  component: ComponentType
}

/** Icône d'onglet de Pascal (fichiers `public/icons` de Pascal, servis par Fabrics). */
function railIcon(name: string): ReactNode {
  return <img alt="" className="h-8 w-8 object-contain" height={32} src={`/icons/${name}.webp`} width={32} />
}

/**
 * Onglets de la barre latérale de Pascal (M19 A5), d'après `scene-loader.tsx` de Pascal : Scène,
 * Peinture, Objets et Paramètres (rendu, animation de construction, sons…). Les onglets de Fabrics
 * (Métrés, Commentaires, Historique) se placent entre Objets et Paramètres.
 * « Construire » (palette d'outils de l'application Pascal) arrive avec les outils, sous-lot B1.
 */
export function pascalTabs(t: Translate): { leading: PascalTab[]; trailing: PascalTab[] } {
  return {
    leading: [
      {
        id: 'site',
        label: t('pascalEditor.tabScene'),
        icon: railIcon('scene'),
        mobileIcon: <Layers className="h-5 w-5" />,
        mobileDefaultSnap: 0.5,
        component: BuiltInPanel,
      },
      {
        id: 'paint',
        label: t('pascalEditor.tabPaint'),
        icon: railIcon('paint'),
        mobileIcon: <Palette className="h-5 w-5" />,
        mobileDefaultSnap: 0.5,
        component: PaintPanel,
      },
      {
        id: 'items',
        label: t('pascalEditor.tabItems'),
        icon: railIcon('couch'),
        mobileIcon: <Package className="h-5 w-5" />,
        mobileDefaultSnap: 0.5,
        component: EditorItemsPanel,
      },
    ],
    trailing: [
      {
        id: 'settings',
        label: t('pascalEditor.tabSettings'),
        icon: railIcon('settings'),
        mobileIcon: <Settings className="h-5 w-5" />,
        mobileDefaultSnap: 0.5,
        component: BuiltInPanel,
      },
    ],
  }
}
