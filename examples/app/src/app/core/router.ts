function getQueryValue(key: string): string | null {
  return new URLSearchParams(window.location.search).get(key)
}

export function getRouteActionId(): string | null {
  const route = getQueryValue("route")
  return route && /^[a-z0-9-]+$/.test(route) ? route : null
}

export function getScreen(): string | null {
  return getQueryValue("screen")
}

export function getSettingsPage(): string | null {
  return getQueryValue("settings")
}

export function getTrainingProgramId(): string | null {
  return getQueryValue("trainingProgram")
}

export function navigate(search: string, onNavigate: () => void): void {
  history.pushState({}, "", search)
  onNavigate()
}
