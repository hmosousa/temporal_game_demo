'use client'

import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { generateEntityColor, getDarkerEntityColor, extractEntityId } from '../utils/entityColors'

const TextHighlighter = ({ text, entities = [], onEntitiesChange, dct = null }) => {
  const [hoveredEntity, setHoveredEntity] = useState(null)
  const [showTypeDropdown, setShowTypeDropdown] = useState(null)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })
  const textRef = useRef(null)

  // Sort entities by start position for proper rendering and color assignment
  const sortedEntities = useMemo(() => {
    return [...entities].sort((a, b) => a.start - b.start)
  }, [entities])

  const handleMouseUp = useCallback(() => {
    if (!textRef.current) return

    const selection = window.getSelection()
    if (selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)
    const textContainer = textRef.current

    // Check if selection is within our text container
    if (!textContainer.contains(range.commonAncestorContainer)) return

    // Get the text content and calculate offsets
    const selectedText = selection.toString().trim()
    if (selectedText.length === 0) return

    // Calculate character offsets relative to the original text
    const preCaretRange = range.cloneRange()
    preCaretRange.selectNodeContents(textContainer)
    preCaretRange.setEnd(range.startContainer, range.startOffset)
    const start = preCaretRange.toString().length

    const end = start + selectedText.length

    // Check for overlapping entities
    const overlapping = entities.some(entity => 
      (start < entity.end && end > entity.start)
    )

    if (overlapping) {
      alert('Cannot create entity: overlaps with existing entity')
      selection.removeAllRanges()
      return
    }

    // Directly create the entity with default 'interval' type
    const newEntity = {
      start: start,
      end: end,
      text: selectedText,
      type: 'interval', // Default to interval
      id: Date.now() // Simple ID generation
    }

    onEntitiesChange([...entities, newEntity])
    selection.removeAllRanges()
  }, [entities, onEntitiesChange])

  const updateEntityType = (entityId, newType) => {
    const updatedEntities = entities.map(entity =>
      entity.id === entityId ? { ...entity, type: newType } : entity
    )
    onEntitiesChange(updatedEntities)
    setShowTypeDropdown(null)
  }

  const deleteEntity = (entityId) => {
    const updatedEntities = entities.filter(entity => entity.id !== entityId)
    onEntitiesChange(updatedEntities)
    setHoveredEntity(null)
  }

  const handleEntityClick = (entity, e) => {
    e.stopPropagation()
    
    // Get the position of the clicked element
    const rect = e.currentTarget.getBoundingClientRect()
    setDropdownPosition({
      top: rect.bottom + window.scrollY + 5,
      left: rect.left + window.scrollX
    })
    
    setShowTypeDropdown(entity.id)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowTypeDropdown(null)
    }
    
    if (showTypeDropdown) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showTypeDropdown])

  const renderTextWithEntities = () => {
    if (sortedEntities.length === 0) {
      return <span>{text}</span>
    }

    const segments = []
    let currentIndex = 0

    sortedEntities.forEach((entity, idx) => {
      // Add text before entity
      if (currentIndex < entity.start) {
        segments.push(
          <span key={`text-${idx}`}>
            {text.substring(currentIndex, entity.start)}
          </span>
        )
      }

      // Add highlighted entity
      const entityText = entity.text || text.substring(entity.start, entity.end)
      const isHovered = hoveredEntity === entity.id

      // Determine entity styling based on type and use consistent colors
      // Use the position in the sorted array for color assignment
      const entityId = `e${idx}`;
      
      const entityBgColor = generateEntityColor(entityId)
      const entityBorderColor = getDarkerEntityColor(entityId)
      
      let entityClass = 'relative inline-block px-1 rounded cursor-pointer transition-all '
      entityClass += 'border-b-2'
      
      if (isHovered) {
        entityClass += ' shadow-lg scale-105'
      }

      const entityStyle = {
        backgroundColor: entityBgColor,
        borderColor: entityBorderColor
      }

      segments.push(
        <span
          key={`entity-${entity.id || idx}`}
          className={entityClass}
          onMouseEnter={() => setHoveredEntity(entity.id)}
          onMouseLeave={() => setHoveredEntity(null)}
          onClick={(e) => handleEntityClick(entity, e)}
          style={entityStyle}
        >
          {entityText}
          
          {/* Entity tooltip */}
          {isHovered && (
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
              {entity.type} ({entity.start}-{entity.end})
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
            </div>
          )}

          {/* Delete button on hover */}
          {isHovered && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                deleteEntity(entity.id)
              }}
              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600 transition-colors"
            >
              ×
            </button>
          )}
        </span>
      )

      currentIndex = entity.end
    })

    // Add remaining text
    if (currentIndex < text.length) {
      segments.push(
        <span key="text-end">
          {text.substring(currentIndex)}
        </span>
      )
    }

    return segments
  }

  return (
    <div className="space-y-4">
      {/* Text Display Area */}
      <div className="bg-white border rounded-lg p-6 relative">
        {/* Info button */}
        <div className="absolute top-4 right-4 group">
          <button className="w-6 h-6 text-blue-600 rounded-full flex items-center justify-center text-sm hover:text-blue-800 transition-colors">
            ⓘ
          </button>
          {/* Tooltip */}
          <div className="absolute right-0 top-8 w-64 p-3 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
            Select text with your mouse to automatically create entities (defaults to 'interval'). Click on highlighted entities to change their type (interval or instant).
            <div className="absolute -top-1 right-3 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-800"></div>
          </div>
        </div>

        <div
          ref={textRef}
          className="text-gray-800 leading-relaxed select-text cursor-text whitespace-pre-wrap"
          onMouseUp={handleMouseUp}
          style={{ userSelect: 'text' }}
        >
          {renderTextWithEntities()}
        </div>
      </div>

      {/* Type Dropdown */}
      {showTypeDropdown && (
        <div
          className="fixed bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 min-w-32"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => updateEntityType(showTypeDropdown, 'interval')}
            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
          >
            Interval
          </button>
          <button
            onClick={() => updateEntityType(showTypeDropdown, 'instant')}
            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
          >
            Instant
          </button>
        </div>
      )}
    </div>
  )
}

export default TextHighlighter 