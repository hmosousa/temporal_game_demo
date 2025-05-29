'use client'

import styles from './RelationSelector.module.css'

export default function RelationSelector({ onSelect }) {
  const relations = [
    { value: '<', label: 'Before (<)' },
    { value: '>', label: 'After (>)' },
    { value: '=', label: 'Equal (=)' },
    { value: '-', label: 'Unknown (-)' }
  ]

  return (
    <div className={styles.selectorContainer}>
      <h3>Select Relation</h3>
      <div className={styles.relationButtons}>
        {relations.map(relation => (
          <button
            key={relation.value}
            className={styles.relationBtn}
            onClick={() => onSelect(relation.value)}
          >
            {relation.label}
          </button>
        ))}
      </div>
    </div>
  )
}
