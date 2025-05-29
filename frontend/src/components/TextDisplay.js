'use client'

import { useMemo } from 'react'
import styles from './TextDisplay.module.css'

export default function TextDisplay({ contextWithTags }) {
  const displayText = useMemo(() => {
    if (!contextWithTags) return ""

    // Parse the XML-tagged context and convert to HTML with styling
    // The context comes with XML tags like <e0>text content</e0>, <e1>another event</e1>, etc.
    let result = contextWithTags

    // Replace entity tags in the format <eN>content</eN> with styled HTML spans
    result = result.replace(
      /<e(\d+)>(.*?)<\/e\d+>/g,
      (match, entityNumber, content) => {
        const entityId = `e${entityNumber}`
        // Generate a color for the entity based on its ID
        const entityColor = generateEntityColor(entityId)
        return `<span class="${styles.entity}" style="background-color: ${entityColor}; border: 1px solid rgba(0,0,0,0.1)" data-id="${entityId}" title="Entity ${entityId}: ${content}">${content}</span>`
      }
    )

    // Add sentence wrapping
    const sentenceRegex = /([.!?])\s+/g
    result = '<span class="' + styles.sentence + '">' +
             result.replace(sentenceRegex, '$1</span> <span class="' + styles.sentence + '">') +
             '</span>'

    return result
  }, [contextWithTags])

  return (
    <div className={styles.textContainer}>
      <div
        className={styles.textContent}
        dangerouslySetInnerHTML={{ __html: displayText }}
      />
    </div>
  )
}

// Helper function to generate consistent colors for entities
function generateEntityColor(entityId) {
  // Use a simple hash to generate consistent colors for each entity ID
  let hash = 0
  for (let i = 0; i < entityId.length; i++) {
    hash = entityId.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  // Generate a light, pastel color
  const hue = Math.abs(hash) % 360
  return `hsla(${hue}, 70%, 85%, 0.8)`
}
