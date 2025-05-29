'use client'

import { useMemo } from 'react'
import styles from './TextDisplay.module.css'

export default function TextDisplay({ text, entities }) {
  const displayText = useMemo(() => {
    if (!text || !entities || entities.length === 0) return text

    // Debug the entities structure
    console.log("First entity structure:", entities[0])

    // Create a map of colors for each entity
    const entityColors = {}
    entities.forEach((entity, index) => {
      const colorIndex = index % 10
      // Using rgba colors with transparency (0.3 alpha value)
      const colors = [
        'rgba(230, 25, 75, 0.3)',    // Red with transparency
        'rgba(60, 180, 75, 0.3)',    // Green with transparency
        'rgba(255, 225, 25, 0.3)',   // Yellow with transparency
        'rgba(67, 99, 216, 0.3)',    // Blue with transparency
        'rgba(245, 130, 49, 0.3)',   // Orange with transparency
        'rgba(145, 30, 180, 0.3)',   // Purple with transparency
        'rgba(66, 212, 244, 0.3)',   // Cyan with transparency
        'rgba(240, 50, 230, 0.3)',   // Magenta with transparency
        'rgba(191, 239, 69, 0.3)',   // Lime with transparency
        'rgba(250, 190, 212, 0.3)'   // Pink with transparency
      ]
      entityColors[entity.id] = colors[colorIndex]
    })

    // Create spans for each entity's offsets
    // Sort entities by their start offset in reverse order to avoid messing up the positions
    const sortedEntities = [...entities].sort((a, b) => {
      // For the specific format: { id, offsets: [start, end], text }
      const aStart = Array.isArray(a.offsets) && a.offsets.length === 2 && typeof a.offsets[0] === 'number'
        ? a.offsets[0]
        : 0

      const bStart = Array.isArray(b.offsets) && b.offsets.length === 2 && typeof b.offsets[0] === 'number'
        ? b.offsets[0]
        : 0

      return bStart - aStart
    })

    let result = text
    for (const entity of sortedEntities) {
      // Skip if no offsets
      if (!entity.offsets) continue

      // Handle the specific format where offsets is [start, end]
      if (Array.isArray(entity.offsets) && entity.offsets.length === 2 &&
          typeof entity.offsets[0] === 'number' && typeof entity.offsets[1] === 'number') {

        const start = entity.offsets[0]
        const end = entity.offsets[1]

        const entityText = text.substring(start, end)
        const color = entityColors[entity.id]
        const span = `<span class="${styles.entity}" style="background-color: ${color}; border: 1px solid rgba(0,0,0,0.1)" data-id="${entity.id}" title="${entity.id}: ${entity.text}">${entityText}</span>`

        result = result.substring(0, start) + span + result.substring(end)
      }
    }

    // After applying entity highlighting, split the text into sentences and wrap them
    // We look for sentence-ending punctuation followed by whitespace
    // and replace it with the same punctuation plus a closing/opening span tags
    const sentenceRegex = /([.!?])\s+/g;
    result = '<span class="' + styles.sentence + '">' +
              result.replace(sentenceRegex, '$1</span> <span class="' + styles.sentence + '">') +
              '</span>';

    return result
  }, [text, entities])

  return (
    <div className={styles.textContainer}>
      <div
        className={styles.textContent}
        dangerouslySetInnerHTML={{ __html: displayText }}
      />
    </div>
  )
}
