/** Backend default icon keyword → display glyph */
export const PROJECT_ICON_ALIASES: Record<string, string> = {
  folder: '📁',
  inbox: '📥',
  star: '⭐',
  bolt: '⚡',
  target: '🎯',
  home: '🏠',
  briefcase: '💼',
  rocket: '🚀',
}

export function displayProjectIcon(icon: string): string {
  if (!icon) return '📁'
  const mapped = PROJECT_ICON_ALIASES[icon.toLowerCase()]
  if (mapped) return mapped
  return icon
}

export const PRESET_PROJECT_ICONS = ['📁', '📥', '⭐', '⚡', '🎯', '🏠', '💼', '🚀', '✨', '🌿', '🔥', '💡']

export const PRESET_PROJECT_COLORS = [
  '#3B82F6',
  '#8B5CF6',
  '#EC4899',
  '#EF4444',
  '#F59E0B',
  '#10B981',
  '#06B6D4',
  '#64748B',
]
