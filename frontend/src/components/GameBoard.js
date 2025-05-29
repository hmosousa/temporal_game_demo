'use client'

import { useState, useMemo } from 'react'
import styles from './GameBoard.module.css'
import PropTypes from 'prop-types'
import { generateEntityColor, getDarkerEntityColor, extractEntityId } from '../utils/entityColors'

const RELATION_SYMBOLS = {
  0: '>',  // RELATIONS2ID mapping from backend
  1: '<',
  2: '=',
  3: '-'
}

const RELATION_NAMES = {
  0: 'After',
  1: 'Before', 
  2: 'Equal',
  3: 'Unknown'
}

const UNCLASSIFIED_POSITION = -1
const MASKED_POSITION = -2

export default function GameBoard({ board, endpoints, onMakeMove, onUndo, disabled = false, hasTemporalIncoherence = false }) {
  const [selectedCell, setSelectedCell] = useState(null)
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 })

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
    if (!board || !endpoints || board.length === 0 || endpoints.length === 0) {
      return { visibleRows: [], visibleColumns: [], visibleEndpoints: [] }
    }

    // Find which rows and columns should be visible (not all MASKED)
    const visibleRowIndices = []
    const visibleColumnIndices = []

    // Check rows - a row is visible if it has at least one non-MASKED cell
    for (let rowIdx = 0; rowIdx < board.length; rowIdx++) {
      const hasVisibleCell = board[rowIdx].some(cellValue => cellValue !== MASKED_POSITION)
      if (hasVisibleCell) {
        visibleRowIndices.push(rowIdx)
      }
    }

    // Check columns - a column is visible if it has at least one non-MASKED cell
    for (let colIdx = 0; colIdx < (board[0]?.length || 0); colIdx++) {
      const hasVisibleCell = board.some(row => row[colIdx] !== MASKED_POSITION)
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
        value: board[rowIdx][colIdx],
        isMasked: board[rowIdx][colIdx] === MASKED_POSITION
      }))
    }))

    const visibleEndpoints = visibleColumnIndices.map(colIdx => endpoints[colIdx])

    return { visibleRows, visibleColumnIndices, visibleEndpoints }
  }, [board, endpoints])

  // Add temporal incoherence styling
  const getContainerClasses = () => {
    let classes = styles.boardContainer
    if (hasTemporalIncoherence) {
      classes += ` ${styles.temporalIncoherence}`
    }
    return classes
  }

  // Check if board is empty (no moves made)
  const isBoardEmpty = useMemo(() => {
    if (!board || board.length === 0) return true
    
    // Check if any cell has a relation (value other than UNCLASSIFIED_POSITION or MASKED_POSITION)
    for (let row of board) {
      for (let cell of row) {
        if (cell !== UNCLASSIFIED_POSITION && cell !== MASKED_POSITION) {
          return false
        }
      }
    }
    return true
  }, [board])

  // Handle cell click to show relation options
  const handleCellClick = (originalRowIdx, originalColIdx, isMasked, e) => {
    if (disabled || isMasked) return // Don't allow interaction when disabled or with masked cells
    
    if (e) {
      const rect = e.currentTarget.getBoundingClientRect()
      setPopupPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + rect.width / 2 + window.scrollX,
      })
    }

    const isAlreadySelected = selectedCell && 
                             selectedCell.rowIdx === originalRowIdx && 
                             selectedCell.colIdx === originalColIdx

    setSelectedCell(isAlreadySelected ? null : { rowIdx: originalRowIdx, colIdx: originalColIdx })
  }

  // Handle relation selection
  const handleRelationSelect = (relationId) => {
    if (!selectedCell) return

    const position = [selectedCell.rowIdx, selectedCell.colIdx]
    const relation = RELATION_SYMBOLS[relationId]
    
    onMakeMove(position, relation)
    setSelectedCell(null)
  }

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

  // Get the cell value to display
  const getCellDisplay = (value) => {
    if (value === UNCLASSIFIED_POSITION) return ''
    if (value === MASKED_POSITION) return ''
    return RELATION_SYMBOLS[value] || ''
  }

  // Get cell CSS classes
  const getCellClasses = (originalRowIdx, originalColIdx, value, isMasked) => {
    const isSelected = selectedCell && 
                      selectedCell.rowIdx === originalRowIdx && 
                      selectedCell.colIdx === originalColIdx
    
    const classes = [styles.gridCell]
    
    if (isMasked) {
      classes.push(styles.disabled)
      return classes.join(' ')
    }
    
    if (disabled) {
      classes.push(styles.readonly)
    }
    
    if (value !== UNCLASSIFIED_POSITION) {
      classes.push(styles.active)
    }
    
    if (isSelected && !disabled) {
      classes.push(styles.selected)
    }
    
    return classes.join(' ')
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

  // Get cell-specific styles that blend row and column entity colors
  const getCellStyle = (rowEndpoint, colEndpoint, value, isMasked) => {
    if (isMasked || value === UNCLASSIFIED_POSITION) return {}
    
    // Apply relation-specific colors matching the popup
    const relationColors = {
      1: '#cfe1f2', // Before - same as beforeOption
      0: '#93c4de', // After - same as afterOption  
      2: '#4b97ca', // Equal - same as equalOption
      3: '#6b7280'  // Unknown - same as unknownOption
    }
    
    return {
      backgroundColor: relationColors[value] || 'rgba(0, 0, 0, 0.05)',
      color: '#000000',
      fontWeight: 'bold'
    }
  }

  if (!board || !endpoints || board.length === 0 || endpoints.length === 0) {
    return (
      <div className={styles.boardContainer}>
        <div className="text-center p-8">
          <p className="text-gray-500">Loading game board...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={getContainerClasses()}>
      <div className={styles.boardHeader}>
        <button 
          onClick={onUndo}
          className={styles.undoButton}
          disabled={disabled || isBoardEmpty}
          title={isBoardEmpty ? "No moves to undo" : "Undo last move"}
        >
          ↶ Undo
        </button>
      </div>
      
      {hasTemporalIncoherence && (
        <div className={styles.incoherenceAlert}>
          <span className={styles.alertIcon}>⚠️</span>
          <span>Temporal Incoherence Detected! The timeline contains contradictory relations.</span>
        </div>
      )}
      
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
                    className={getCellClasses(row.originalRowIdx, cell.originalColIdx, cell.value, cell.isMasked)}
                    style={getCellStyle(row.endpoint, endpoints[cell.originalColIdx], cell.value, cell.isMasked)}
                    onClick={(e) => handleCellClick(row.originalRowIdx, cell.originalColIdx, cell.isMasked, e)}
                    title={`${row.endpoint} → ${endpoints[cell.originalColIdx]}: ${getCellDisplay(cell.value) || 'No relation'}`}
                    data-relation={getCellDisplay(cell.value)}
                  >
                    {getCellDisplay(cell.value)}
                  </td>
                ))}
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
              onClick={() => handleRelationSelect(1)}
              title="Before (<)"
            >
              &lt;
            </button>
            <button
              className={`${styles.popupOption} ${styles.afterOption}`}
              onClick={() => handleRelationSelect(0)}
              title="After (>)"
            >
              &gt;
            </button>
            <button
              className={`${styles.popupOption} ${styles.equalOption}`}
              onClick={() => handleRelationSelect(2)}
              title="Equal (=)"
            >
              =
            </button>
            <button
              className={`${styles.popupOption} ${styles.unknownOption}`}
              onClick={() => handleRelationSelect(3)}
              title="Unknown (-)"
            >
              -
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// PropTypes
GameBoard.propTypes = {
  board: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)).isRequired,
  endpoints: PropTypes.arrayOf(PropTypes.string).isRequired,
  onMakeMove: PropTypes.func.isRequired,
  onUndo: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  hasTemporalIncoherence: PropTypes.bool,
}