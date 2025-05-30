// API utility functions for annotation endpoints

const API_BASE_URL = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000'

export const annotationAPI = {
  async createSession(text, entities, dct) {
    const response = await fetch(`${API_BASE_URL}/api/new_annotation_session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        entities,
        dct
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to create annotation session')
    }

    return response.json()
  },

  async makeAnnotation(sessionId, action) {
    const response = await fetch(`${API_BASE_URL}/api/annotation_step`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        session_id: sessionId,
        action
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to make annotation')
    }

    return response.json()
  },

  async undoAnnotation(sessionId) {
    const response = await fetch(`${API_BASE_URL}/api/annotation_undo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        session_id: sessionId
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'No actions to undo')
    }

    return response.json()
  },

  async getResults(sessionId) {
    const response = await fetch(`${API_BASE_URL}/api/get_annotation_results`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        session_id: sessionId
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to get annotation results')
    }

    return response.json()
  }
} 