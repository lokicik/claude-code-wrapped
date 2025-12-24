const fs = require('fs');
const path = require('path');

/**
 * Data collector for Claude Code sessions
 * This module helps track and collect usage data
 */

class DataCollector {
  constructor(dataPath = './data') {
    this.dataPath = dataPath;
    this.sessionsFile = path.join(dataPath, 'sessions.json');
    this.ensureDataDirectory();
  }

  ensureDataDirectory() {
    if (!fs.existsSync(this.dataPath)) {
      fs.mkdirSync(this.dataPath, { recursive: true });
    }
  }

  /**
   * Record a new coding session
   */
  recordSession(sessionData) {
    const sessions = this.loadSessions();

    const session = {
      id: this.generateSessionId(),
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
      ...sessionData
    };

    sessions.push(session);
    this.saveSessions(sessions);

    return session;
  }

  /**
   * Load all sessions
   */
  loadSessions() {
    if (!fs.existsSync(this.sessionsFile)) {
      return [];
    }

    try {
      const data = fs.readFileSync(this.sessionsFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading sessions:', error);
      return [];
    }
  }

  /**
   * Save sessions to file
   */
  saveSessions(sessions) {
    try {
      fs.writeFileSync(
        this.sessionsFile,
        JSON.stringify(sessions, null, 2),
        'utf8'
      );
    } catch (error) {
      console.error('Error saving sessions:', error);
    }
  }

  /**
   * Generate a unique session ID
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get sessions for a specific year
   */
  getSessionsByYear(year) {
    const sessions = this.loadSessions();
    return sessions.filter(session => {
      const sessionYear = new Date(session.timestamp).getFullYear();
      return sessionYear === year;
    });
  }

  /**
   * Delete all sessions (use with caution!)
   */
  clearSessions() {
    if (fs.existsSync(this.sessionsFile)) {
      fs.unlinkSync(this.sessionsFile);
    }
  }
}

module.exports = DataCollector;
