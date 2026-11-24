// In-app navigation from anywhere (click handlers, helpers) without a full page
// reload. RouterBridge (in the root layout) hands us Next's router; until it
// has, fall back to a normal page load.
type Router = { push: (href: string) => void; replace: (href: string) => void; prefetch?: (href: string) => void }

let router: Router | null = null

export function setRouter(r: Router) {
  router = r
}

export function go(href: string, opts: { replace?: boolean } = {}) {
  const external = /^https?:\/\//.test(href) && !href.startsWith(window.location.origin)
  if (!router || external) {
    window.location.href = href
    return
  }
  if (opts.replace) router.replace(href)
  else router.push(href)
}
