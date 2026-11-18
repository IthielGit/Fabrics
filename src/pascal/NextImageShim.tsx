import type { CSSProperties, ImgHTMLAttributes } from 'react'

/**
 * Remplace `next/image` pour les paquets de Pascal compilés par Vite (alias dans `vite.config.ts`,
 * M17, ADR 0002). Fabrics n'a pas le serveur d'images de Next.js : on affiche l'image telle quelle.
 * Les options d'optimisation de Next (priority, quality, placeholder…) sont ignorées.
 */
type StaticImage = { src: string; width?: number; height?: number }

export interface NextImageShimProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'width' | 'height'> {
  src: string | StaticImage
  width?: number | string
  height?: number | string
  /** Next : l'image remplit son parent (positionné). */
  fill?: boolean
  priority?: boolean
  quality?: number | string
  placeholder?: string
  blurDataURL?: string
  unoptimized?: boolean
  loader?: unknown
  overrideSrc?: string
}

const FILL_STYLE: CSSProperties = { position: 'absolute', inset: 0, width: '100%', height: '100%' }

export default function NextImageShim({
  src,
  width,
  height,
  fill,
  style,
  loading,
  priority,
  quality: _quality,
  placeholder: _placeholder,
  blurDataURL: _blurDataURL,
  unoptimized: _unoptimized,
  loader: _loader,
  overrideSrc,
  ...rest
}: NextImageShimProps) {
  const url = overrideSrc ?? (typeof src === 'string' ? src : src.src)
  const w = width ?? (typeof src === 'string' ? undefined : src.width)
  const h = height ?? (typeof src === 'string' ? undefined : src.height)
  return (
    <img
      {...rest}
      src={url}
      width={fill ? undefined : w}
      height={fill ? undefined : h}
      loading={loading ?? (priority ? 'eager' : 'lazy')}
      decoding="async"
      style={fill ? { ...FILL_STYLE, ...style } : style}
    />
  )
}
