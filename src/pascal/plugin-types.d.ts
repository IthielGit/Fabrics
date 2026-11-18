// Types minimaux des modules d'extension de Pascal (`@pascal-app/plugin-*`, M19 A5). Ils sont fournis
// en source TypeScript, compilée par Vite ; `paths` (tsconfig.app.json) envoie ici leurs imports pour
// que `tsc` ne parcoure pas leur code avec les réglages stricts de Fabrics (ADR 0002 § 5).
import type { Plugin } from '@pascal-app/core'

type HostPanel = { id: string; [key: string]: unknown }
type Presentation = { [key: string]: unknown }

export declare const treesPlugin: Plugin
export declare const treesHostPanel: HostPanel
export declare const environmentPlugin: Plugin
export declare const environmentHostPanel: HostPanel
export declare const environmentPresentation: Presentation
export declare const bonesPlugin: Plugin
export declare const bonesHostPanel: HostPanel
export declare const poolPlugin: Plugin
export declare const poolHostPanel: HostPanel
export declare const landscapePlugin: Plugin
export declare const landscapeHostPanel: HostPanel
export declare const bathSpacePlugin: Plugin
export declare const bathSpaceHostPanel: HostPanel
export declare const streetscapePlugin: Plugin
export declare const streetscapeHostPanel: HostPanel