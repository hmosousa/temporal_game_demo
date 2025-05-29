'use client'

import { useState, useMemo, useEffect } from 'react'
import styles from './GameBoard.module.css'
import PropTypes from 'prop-types'

const ENDPOINTS = ['start', 'end']
const MAX_TEXT_LENGTH = 12

const truncateText = (text, maxLength = MAX_TEXT_LENGTH) => {
  if (!text) return ''
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text
}

// Custom hook to handle grid creation
function useGameGrid(candidates, timeline, entities, entityOrder) {
  return useMemo(() => {
    const entityMap = entities.reduce((map, entity) => {
      map[entity.id] = entity.text || entity.id
      return map
    }, {})

    const endpointMap = candidates.reduce((map, [source, target]) => {
      const [sourceEndpoint, sourceId] = source.split(' ')
      const [targetEndpoint, targetId] = target.split(' ')

      map[sourceId] = { ...map[sourceId], [sourceEndpoint]: true }
      map[targetId] = { ...map[targetId], [targetEndpoint]: true }
      return map
    }, {})

    // Create grid structure
    const allRows = []

    // Use the stored entity order instead of recalculating it
    const entityIds = entityOrder.length > 0 ? entityOrder : Object.keys(endpointMap)

    // Headers row
    const headers = []
    entityIds.forEach(entityId => {
      ENDPOINTS.forEach(endpoint => {
        if (endpointMap[entityId]?.[endpoint]) {
          headers.push(`${endpoint} ${entityId}`)
        }
      })
    })

    // Filter the headers to remove the first two
    const filteredHeaders = headers.slice(2)

    // Create rows for the grid
    entityIds.forEach(rowEntityId => {
      ENDPOINTS.forEach(rowEndpoint => {
        if (endpointMap[rowEntityId]?.[rowEndpoint]) {
          const rowKey = `${rowEndpoint} ${rowEntityId}`
          const row = {
            key: rowKey,
            // Create display key with entity text and endpoint
            displayKey: `${rowEndpoint} (${entityMap[rowEntityId] || rowEntityId})`,
            cells: []
          }

          // Add cells for each column
          entityIds.forEach(colEntityId => {
            ENDPOINTS.forEach(colEndpoint => {
              if (endpointMap[colEntityId]?.[colEndpoint]) {
                const colKey = `${colEndpoint} ${colEntityId}`
                const sourcePoint = rowKey
                const targetPoint = colKey

                // Check if this pair exists
                const pairInCandidates = candidatesContainsPair(candidates, sourcePoint, targetPoint)

                // Disable the cells that are not in the candidates
                const isDisabled = !pairInCandidates

                // Check if the cell already has a relation
                const hasRelation = getRelationFromTimeline(timeline, sourcePoint, targetPoint)

                row.cells.push({
                  source: sourcePoint,
                  target: targetPoint,
                  // Create display target with entity text and endpoint
                  displayTarget: `${colEndpoint} (${entityMap[colEntityId] || colEntityId})`,
                  relation: hasRelation || '',
                  disabled: isDisabled
                })
              }
            })
          })

          // Only keep the cells that correspond to columns we want (remove first two)
          row.cells = row.cells.slice(2)
          allRows.push(row)
        }
      })
    })

    // Remove the last two rows
    const grid = allRows.slice(0, -2)

    return { entityMap, endpointMap, grid, headers: filteredHeaders }
  }, [candidates, timeline, entities, entityOrder])
}

export default function GameBoard({ candidates, timeline, onMakeMove, entities = [] }) {
  // Group related state
  const [selectedCell, setSelectedCell] = useState(null)
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 })
  const [entityOrder, setEntityOrder] = useState([])

  // Use custom hook for grid creation
  const { entityMap, endpointMap, grid } = useGameGrid(candidates, timeline, entities, entityOrder)

  // Entity order effect
  useEffect(() => {
    if (entities.length > 0) {
      // Remove the sorting, just use the entities as they come
      setEntityOrder(entities.map(entity => entity.id))
    }
  }, [JSON.stringify(entities)])

  // Handlers
  const handleCellClick = (cell, e) => {
    if (cell.disabled) return

    if (e) {
      const rect = e.currentTarget.getBoundingClientRect()
      setPopupPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + rect.width / 2 + window.scrollX,
      })
    }

    setSelectedCell(selectedCell?.source === cell.source &&
                   selectedCell?.target === cell.target ? null : cell)
  }

  const handleRelationSelect = (relation) => {
    if (!selectedCell) return
    onMakeMove(selectedCell.source, selectedCell.target, relation)
    setSelectedCell(null)
  }

  // Process a display key like "start (warning)" to extract parts
  const formatEndpointDisplay = (displayText) => {
    // The format is "endpoint (entityText)"
    const match = displayText.match(/^(\w+) \((.*)\)$/)
    if (match) {
      const [, endpoint, entityText] = match

      // Use subscript 's' for start and 'e' for end
      const subscript = endpoint === 'start' ? 's' : 'e'

      return (
        <div className={styles.endpointDisplay}>
          <sub className={styles.endpointType}>{subscript}</sub>
          <span className={styles.entityTextDisplay}>{truncateText(entityText)}</span>
        </div>
      )
    }
    return displayText
  }

  return (
    <div className={styles.boardContainer}>
      <div className={styles.gridContainer}>
        <table className={styles.gridTable}>
          <thead>
            <tr>
              <th></th>
              {grid[0]?.cells.map((cell, index) => (
                <th key={index} className={styles.columnEntityLabel} title={cell.displayTarget}>
                  {formatEndpointDisplay(cell.displayTarget)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.map((row, rowIndex) => (
              <tr key={rowIndex}>
                <td className={styles.rowEntityLabel} title={row.displayKey}>
                  {formatEndpointDisplay(row.displayKey)}
                </td>
                {row.cells.map((cell, cellIndex) => {
                  const isSelected = selectedCell &&
                    selectedCell.source === cell.source &&
                    selectedCell.target === cell.target;

                  return (
                    <td
                      key={cellIndex}
                      className={`
                        ${styles.gridCell}
                        ${cell.disabled ? styles.disabled : ''}
                        ${cell.relation ? styles.active : ''}
                        ${isSelected ? styles.selected : ''}
                      `}
                      onClick={(e) => handleCellClick(cell, e)}
                      title={`${row.displayKey} → ${cell.displayTarget}: ${cell.relation || 'No relation'}`}
                      data-relation={cell.relation || ''}
                    >
                      {cell.relation}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedCell && (
        <>
          <div
            className={styles.popupBackdrop}
            onClick={() => setSelectedCell(null)}
          ></div>
          <div
            className={styles.horizontalPopup}
            style={{
              position: 'absolute',
              top: `${popupPosition.top + 5}px`,
              left: `${popupPosition.left - 80}px`, // Center it (4 buttons x 40px width / 2)
            }}
          >
            <button
              className={`${styles.popupOption} ${styles.beforeOption}`}
              onClick={() => handleRelationSelect('<')}
            >
              &lt;
            </button>
            <button
              className={`${styles.popupOption} ${styles.afterOption}`}
              onClick={() => handleRelationSelect('>')}
            >
              &gt;
            </button>
            <button
              className={`${styles.popupOption} ${styles.equalOption}`}
              onClick={() => handleRelationSelect('=')}
            >
              =
            </button>
            <button
              className={`${styles.popupOption} ${styles.unknownOption}`}
              onClick={() => handleRelationSelect('-')}
            >
              -
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// PropTypes (if not using TypeScript)
GameBoard.propTypes = {
  candidates: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.string)).isRequired,
  timeline: PropTypes.arrayOf(PropTypes.shape({
    source: PropTypes.string.isRequired,
    target: PropTypes.string.isRequired,
    relation: PropTypes.string.isRequired
  })).isRequired,
  onMakeMove: PropTypes.func.isRequired,
  entities: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    text: PropTypes.string,
    offsets: PropTypes.arrayOf(PropTypes.number).isRequired
  }))
}

// Helper functions
function candidatesContainsPair(candidates, source, target) {
  const result = candidates.some(([s, t]) =>
    (s === source && t === target)
  );
  return result;
}

function getRelationFromTimeline(timeline, source, target) {
  for (const rel of timeline) {
    if (rel.source === source && rel.target === target) {
      return rel.relation;
    }
  }
  return null;
}
