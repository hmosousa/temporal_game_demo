'use client'

import { useMemo } from 'react'
import styles from './ComparisonBoard.module.css'
import { generateEntityColor, getDarkerEntityColor, extractEntityId } from '../utils/entityColors'

const RELATION_SYMBOLS = {
  0: '>',  // RELATIONS2ID mapping from backend
  1: '<',
  2: '=',
  3: '-'
}

const UNCLASSIFIED_POSITION = -1
const MASKED_POSITION = -2

export default function ComparisonBoard({ userBoard, trueBoard, endpoints }) {
  // Create entity to color mapping
  const entityColorMap = useMemo(() => {
    const colors = [
      { bg: '#FFE4E1', border: '#FF6B6B' }, // Light pink / Pink
      { bg: '#E1F5FE', border: '#4FC3F7' }, // Light blue / Blue
      { bg: '#E8F5E8', border: '#81C784' }, // Light green / Green
      { bg: '#FFF3E0', border: '#FFB74D' }, // Light orange / Orange
      { bg: '#F3E5F5', border: '#BA68C8' }, // Light purple / Purple
    ]
    
    const map = {}
    const seenEntities = []
    
    // Process endpoints in order to preserve entity order from the original entities list
    endpoints.forEach(endpoint => {
      const entityId = extractEntityId(endpoint)
      if (entityId && !seenEntities.includes(entityId)) {
        seenEntities.push(entityId)
      }
    })
    
    // Assign colors based on order of first appearance
    seenEntities.forEach((entityId, index) => {
      map[entityId] = colors[index % colors.length]
    })
    
    return map
  }, [endpoints])

  // Filter out masked rows and columns
  const filteredData = useMemo(() => {
    if (!userBoard || !endpoints || userBoard.length === 0 || endpoints.length === 0) {
      return { visibleRows: [], visibleColumns: [], visibleEndpoints: [] }
    }

    // Find which rows and columns should be visible (not all MASKED)
    const visibleRowIndices = []
    const visibleColumnIndices = []

    // Check rows - a row is visible if it has at least one non-MASKED cell
    for (let rowIdx = 0; rowIdx < userBoard.length; rowIdx++) {
      const hasVisibleCell = userBoard[rowIdx].some(cellValue => cellValue !== MASKED_POSITION)
      if (hasVisibleCell) {
        visibleRowIndices.push(rowIdx)
      }
    }

    // Check columns - a column is visible if it has at least one non-MASKED cell
    for (let colIdx = 0; colIdx < (userBoard[0]?.length || 0); colIdx++) {
      const hasVisibleCell = userBoard.some(row => row[colIdx] !== MASKED_POSITION)
      if (hasVisibleCell) {
        visibleColumnIndices.push(colIdx)
      }
    }

    // Create filtered data structure - maintain grid positions
    const visibleRows = visibleRowIndices.map(rowIdx => ({
      originalRowIdx: rowIdx,
      endpoint: endpoints[rowIdx],
      cells: visibleColumnIndices.map(colIdx => ({
        originalColIdx: colIdx,
        userValue: userBoard[rowIdx][colIdx],
        trueValue: trueBoard[rowIdx][colIdx],
        isMasked: userBoard[rowIdx][colIdx] === MASKED_POSITION
      }))
    }))

    const visibleEndpoints = visibleColumnIndices.map(colIdx => endpoints[colIdx])

    return { visibleRows, visibleColumnIndices, visibleEndpoints }
  }, [userBoard, trueBoard, endpoints])

  // Format endpoint display text
  const formatEndpointDisplay = (endpoint) => {
    // endpoint format is like "start e0" or "end e1"
    const [type, entityId] = endpoint.split(' ')
    const subscript = type === 'start' ? 's' : 'e'
    
    return (
      <div className={styles.endpointDisplay}>
        <sub className={styles.endpointType}>{subscript}</sub>
        <span className={styles.entityTextDisplay}>{entityId}</span>
      </div>
    )
  }

  // Get the display value for a relation
  const getRelationDisplay = (value) => {
    if (value === UNCLASSIFIED_POSITION) return ''
    if (value === MASKED_POSITION) return ''
    return RELATION_SYMBOLS[value] || ''
  }

  // Check if there's a mismatch between user and true values
  const isMismatch = (userValue, trueValue) => {
    // Both need to be classified (not UNCLASSIFIED or MASKED)
    const userClassified = userValue !== UNCLASSIFIED_POSITION && userValue !== MASKED_POSITION
    const trueClassified = trueValue !== UNCLASSIFIED_POSITION && trueValue !== MASKED_POSITION
    
    // If both are classified and different, it's a mismatch
    return userClassified && trueClassified && userValue !== trueValue
  }

  // Get entity-specific styles for row and column headers
  const getEntityHeaderStyle = (endpoint) => {
    const entityId = extractEntityId(endpoint)
    if (!entityId || !entityColorMap[entityId]) return {}
    
    const colors = entityColorMap[entityId]
    
    return {
      backgroundColor: colors.bg,
      border: `2px solid ${colors.border}`,
      color: '#000000'
    }
  }

  // Get cell-specific styles
  const getCellStyle = (userValue, trueValue, isMasked) => {
    if (isMasked) return {}
    
    const baseStyle = {
      backgroundColor: 'white',
      fontWeight: 'bold'
    }
    
    // Add red border for mismatches
    if (isMismatch(userValue, trueValue)) {
      baseStyle.border = '2px solid #ef4444'
      baseStyle.backgroundColor = '#fee2e2'
    }
    
    return baseStyle
  }

  if (!userBoard || !endpoints || userBoard.length === 0 || endpoints.length === 0) {
    return (
      <div className={styles.boardContainer}>
        <div className="text-center p-8">
          <p className="text-gray-500">Loading comparison...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.boardContainer}>
      <div className={styles.gridContainer}>
        <table className={styles.gridTable}>
          <thead>
            <tr>
              <th className={styles.topLeftCell}></th>
              {filteredData.visibleEndpoints.map((endpoint, index) => (
                <th key={index} className={styles.columnEntityLabel} title={endpoint} style={getEntityHeaderStyle(endpoint)}>
                  {formatEndpointDisplay(endpoint)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.visibleRows.map((row, displayRowIdx) => (
              <tr key={displayRowIdx}>
                <td className={styles.rowEntityLabel} title={row.endpoint} style={getEntityHeaderStyle(row.endpoint)}>
                  {formatEndpointDisplay(row.endpoint)}
                </td>
                {row.cells.map((cell, displayColIdx) => (
                  <td
                    key={displayColIdx}
                    className={`${styles.gridCell} ${cell.isMasked ? styles.disabled : ''}`}
                    style={getCellStyle(cell.userValue, cell.trueValue, cell.isMasked)}
                    title={`${row.endpoint} → ${endpoints[cell.originalColIdx]}: User: ${getRelationDisplay(cell.userValue) || 'None'}, True: ${getRelationDisplay(cell.trueValue) || 'None'}`}
                  >
                    {!cell.isMasked && (
                      <>
                        <div className={styles.cellContent}>
                          <span className={styles.userPrediction}>
                            {getRelationDisplay(cell.userValue)}
                          </span>
                        </div>
                        {cell.trueValue !== UNCLASSIFIED_POSITION && cell.trueValue !== MASKED_POSITION && (
                          <span className={styles.trueAnnotation}>
                            {getRelationDisplay(cell.trueValue)}
                          </span>
                        )}
                      </>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
} 