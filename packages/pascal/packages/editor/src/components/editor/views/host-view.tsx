'use client'

import type { LazyComponent } from '@pascal-app/core'
import { usePascalI18n } from '@pascal-app/core'
import { type ComponentType, lazy, Suspense } from 'react'
import type { EditorViewDescriptor } from '../../../lib/editor-views'
import { ErrorBoundary } from '../../ui/primitives/error-boundary'

// `React.lazy` once per loader, so a view keeps its identity across renders.
const lazyViewCache = new WeakMap<LazyComponent, ComponentType>()

function resolveViewComponent(component: LazyComponent): ComponentType {
  const cached = lazyViewCache.get(component)
  if (cached) return cached
  const Lazy = lazy(component)
  lazyViewCache.set(component, Lazy)
  return Lazy
}

function ViewMessage({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-sidebar p-6 text-center">
      <div className="max-w-xs">
        <p className="font-medium text-sidebar-foreground text-sm">{title}</p>
        <p className="mt-1 text-sidebar-foreground/50 text-xs">{body}</p>
      </div>
    </div>
  )
}

/**
 * A registered view, loaded lazily and isolated: a view that throws is
 * unloaded for the session and the rest of the editor keeps working. A layout
 * can name a view this project cannot show — its plugin uninstalled, or not
 * registered yet — and the pane says so rather than silently swapping views,
 * so the choice comes back once the view does.
 */
export function HostView({ view }: { view: EditorViewDescriptor | undefined }) {
  const i18n = usePascalI18n()
  if (!view?.component) {
    return (
      <ViewMessage
        body="Its plugin isn't installed in this project. Pick another view above."
        title={i18n._({
          id: 'editor.views.hostView.thisViewIsnTAvailable',
          message: "This view isn't available",
        })}
      />
    )
  }
  const Component = resolveViewComponent(view.component)
  return (
    <ErrorBoundary
      fallback={
        <ViewMessage
          body="This view hit an error and was unloaded for this session. Reload to try again."
          title={i18n._({
            id: 'editor.views.hostView.labelCrashed',
            message: '"{label}" crashed',
            values: { label: view.label },
          })}
        />
      }
    >
      <Suspense
        fallback={
          <ViewMessage
            body=""
            title={i18n._({ id: 'editor.views.hostView.loading', message: 'Loading…' })}
          />
        }
      >
        <Component />
      </Suspense>
    </ErrorBoundary>
  )
}
