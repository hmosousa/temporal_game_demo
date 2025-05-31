// Utility for generating consistent colors for entities across the app

// Simple entity color system with 5 predefined colors

const ENTITY_COLORS = [
  '#FFE4E1', // Light pink
  '#E1F5FE', // Light blue
  '#E8F5E8', // Light green
  '#FFF3E0', // Light orange
  '#F3E5F5', // Light purple
]

const ENTITY_BORDER_COLORS = [
  '#FF6B6B', // Pink
  '#4FC3F7', // Blue
  '#81C784', // Green
  '#FFB74D', // Orange
  '#BA68C8', // Purple
]

export function generateEntityColor(entityId) {
  // Extract number from entity ID (e.g., "e0" -> 0, "e1" -> 1)
  const entityNumber = parseInt(entityId.replace('e', ''), 10)
  if (isNaN(entityNumber)) return ENTITY_COLORS[0]
  
  // Use modulo to cycle through colors if we have more than 5 entities
  return ENTITY_COLORS[entityNumber % ENTITY_COLORS.length]
}

// Get a darker version of the entity color for borders and text
export function getDarkerEntityColor(entityId) {
  // Extract number from entity ID
  const entityNumber = parseInt(entityId.replace('e', ''), 10)
  if (isNaN(entityNumber)) return ENTITY_BORDER_COLORS[0]
  
  // Use modulo to cycle through colors if we have more than 5 entities
  return ENTITY_BORDER_COLORS[entityNumber % ENTITY_BORDER_COLORS.length]
}

// Extract entity ID from endpoint string (e.g., "start e0", "end e1", "instant e0" -> "e0")
export function extractEntityId(endpoint) {
  if (!endpoint) return null
  const parts = endpoint.split(' ')
  return parts.length > 1 ? parts[1] : null
} 