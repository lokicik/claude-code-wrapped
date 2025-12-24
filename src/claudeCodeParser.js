const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Parser for Claude Code session JSONL files
 * Extracts real usage statistics from ~/.claude/projects/
 */

class ClaudeCodeParser {
  constructor() {
    this.claudeDir = path.join(os.homedir(), '.claude');
    this.projectsDir = path.join(this.claudeDir, 'projects');
  }

  /**
   * Find all session JSONL files
   */
  findSessionFiles() {
    const files = [];

    if (!fs.existsSync(this.projectsDir)) {
      return files;
    }

    const projectDirs = fs.readdirSync(this.projectsDir);

    for (const projectDir of projectDirs) {
      const projectPath = path.join(this.projectsDir, projectDir);
      const stat = fs.statSync(projectPath);

      if (stat.isDirectory()) {
        const jsonlFiles = fs.readdirSync(projectPath)
          .filter(f => f.endsWith('.jsonl'))
          .map(f => ({
            path: path.join(projectPath, f),
            project: projectDir.replace(/-/g, '/').substring(1), // Convert back to path
            sessionId: f.replace('.jsonl', '')
          }));

        files.push(...jsonlFiles);
      }
    }

    return files;
  }

  /**
   * Parse a JSONL file and extract events
   */
  parseSessionFile(filePath) {
    const events = [];
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.trim().split('\n');

    for (const line of lines) {
      if (line.trim()) {
        try {
          events.push(JSON.parse(line));
        } catch (error) {
          console.error(`Error parsing line: ${error.message}`);
        }
      }
    }

    return events;
  }

  /**
   * Extract statistics from session events
   */
  analyzeSession(events) {
    const stats = {
      sessionId: null,
      project: null,
      startTime: null,
      endTime: null,
      duration: 0,
      messageCount: 0,
      userMessages: 0,
      assistantMessages: 0,
      toolCalls: [],
      toolUsage: {},
      filesAccessed: new Set(),
      filesModified: new Set(),
      filesCreated: new Set(),
      bashCommands: [],
      gitBranch: null,
      languages: new Set(),
      thinkingBlocks: 0
    };

    if (events.length === 0) return stats;

    stats.sessionId = events[0].sessionId;
    stats.project = events[0].cwd;
    stats.gitBranch = events[0].gitBranch;
    stats.startTime = events[0].timestamp;
    stats.endTime = events[events.length - 1].timestamp;

    const start = new Date(stats.startTime);
    const end = new Date(stats.endTime);
    stats.duration = Math.floor((end - start) / 1000 / 60); // minutes

    for (const event of events) {
      // Count messages
      if (event.type === 'user' && event.userType === 'external') {
        stats.userMessages++;
        stats.messageCount++;
      } else if (event.type === 'assistant') {
        stats.assistantMessages++;
        stats.messageCount++;
      }

      // Analyze message content for tool uses
      if (event.message && event.message.content && Array.isArray(event.message.content)) {
        for (const item of event.message.content) {
          // Track tool uses
          if (item.type === 'tool_use') {
            stats.toolCalls.push(item.name);
            stats.toolUsage[item.name] = (stats.toolUsage[item.name] || 0) + 1;

            // Extract file information
            if (item.input) {
              if (item.input.file_path) {
                stats.filesAccessed.add(item.input.file_path);

                // Determine language from extension
                const ext = path.extname(item.input.file_path).substring(1);
                const langMap = {
                  'js': 'JavaScript',
                  'ts': 'TypeScript',
                  'tsx': 'TypeScript',
                  'jsx': 'JavaScript',
                  'py': 'Python',
                  'go': 'Go',
                  'rs': 'Rust',
                  'java': 'Java',
                  'cpp': 'C++',
                  'c': 'C',
                  'rb': 'Ruby',
                  'php': 'PHP',
                  'swift': 'Swift',
                  'kt': 'Kotlin',
                  'cs': 'C#',
                  'html': 'HTML',
                  'css': 'CSS',
                  'sh': 'Shell',
                  'bash': 'Shell',
                  'sql': 'SQL',
                  'json': 'JSON',
                  'yaml': 'YAML',
                  'yml': 'YAML',
                  'md': 'Markdown'
                };

                if (langMap[ext]) {
                  stats.languages.add(langMap[ext]);
                }
              }

              if (item.name === 'Write' || item.name === 'Edit') {
                stats.filesModified.add(item.input.file_path);
              }

              if (item.name === 'Bash' && item.input.command) {
                stats.bashCommands.push(item.input.command);
              }
            }
          }

          // Count thinking blocks
          if (item.type === 'thinking') {
            stats.thinkingBlocks++;
          }
        }
      }

      // Analyze tool results for file operations
      if (event.toolUseResult && event.toolUseResult.type === 'write') {
        stats.filesCreated.add(event.toolUseResult.filePath);
      }
    }

    // Convert sets to arrays
    stats.filesAccessed = Array.from(stats.filesAccessed);
    stats.filesModified = Array.from(stats.filesModified);
    stats.filesCreated = Array.from(stats.filesCreated);
    stats.languages = Array.from(stats.languages);

    return stats;
  }

  /**
   * Parse all sessions and aggregate statistics
   */
  parseAllSessions(yearFilter = null) {
    const sessionFiles = this.findSessionFiles();
    const allSessions = [];

    for (const file of sessionFiles) {
      const events = this.parseSessionFile(file.path);

      if (events.length === 0) continue;

      // Filter by year if specified
      const sessionYear = new Date(events[0].timestamp).getFullYear();
      if (yearFilter && sessionYear !== yearFilter) continue;

      const sessionStats = this.analyzeSession(events);
      sessionStats.project = file.project;
      sessionStats.file = file.path;

      allSessions.push(sessionStats);
    }

    return allSessions;
  }

  /**
   * Aggregate statistics across all sessions
   */
  aggregateStats(sessions) {
    const aggregated = {
      totalSessions: sessions.length,
      totalMessages: 0,
      totalUserMessages: 0,
      totalAssistantMessages: 0,
      totalDuration: 0,
      totalFilesAccessed: new Set(),
      totalFilesModified: new Set(),
      totalFilesCreated: new Set(),
      toolUsage: {},
      languageStats: {},
      projectStats: {},
      dailyActivity: {},
      hourlyActivity: {},
      gitBranches: new Set(),
      totalThinkingBlocks: 0,
      sessions: sessions
    };

    for (const session of sessions) {
      aggregated.totalMessages += session.messageCount;
      aggregated.totalUserMessages += session.userMessages;
      aggregated.totalAssistantMessages += session.assistantMessages;
      aggregated.totalDuration += session.duration;
      aggregated.totalThinkingBlocks += session.thinkingBlocks;

      // Files
      session.filesAccessed.forEach(f => aggregated.totalFilesAccessed.add(f));
      session.filesModified.forEach(f => aggregated.totalFilesModified.add(f));
      session.filesCreated.forEach(f => aggregated.totalFilesCreated.add(f));

      // Tools
      for (const [tool, count] of Object.entries(session.toolUsage)) {
        aggregated.toolUsage[tool] = (aggregated.toolUsage[tool] || 0) + count;
      }

      // Languages
      session.languages.forEach(lang => {
        aggregated.languageStats[lang] = (aggregated.languageStats[lang] || 0) + 1;
      });

      // Projects
      if (session.project) {
        aggregated.projectStats[session.project] =
          (aggregated.projectStats[session.project] || 0) + 1;
      }

      // Git branches
      if (session.gitBranch) {
        aggregated.gitBranches.add(session.gitBranch);
      }

      // Time analysis
      if (session.startTime) {
        const date = new Date(session.startTime);
        const day = date.toISOString().split('T')[0];
        const hour = date.getHours();

        aggregated.dailyActivity[day] = (aggregated.dailyActivity[day] || 0) + 1;
        aggregated.hourlyActivity[hour] = (aggregated.hourlyActivity[hour] || 0) + 1;
      }
    }

    // Convert sets to counts
    aggregated.totalFilesAccessed = aggregated.totalFilesAccessed.size;
    aggregated.totalFilesModified = aggregated.totalFilesModified.size;
    aggregated.totalFilesCreated = aggregated.totalFilesCreated.size;
    aggregated.totalGitBranches = aggregated.gitBranches.size;

    return aggregated;
  }
}

module.exports = ClaudeCodeParser;
