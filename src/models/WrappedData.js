/**
 * Data model for Claude Code Wrapped statistics
 */

class WrappedData {
  constructor() {
    this.year = new Date().getFullYear();
    this.sessions = [];
    this.stats = {
      totalSessions: 0,
      totalMessages: 0,
      totalFilesModified: 0,
      totalFilesCreated: 0,
      totalLinesAdded: 0,
      totalLinesRemoved: 0,
      totalToolCalls: 0,
      toolUsage: {},
      languageStats: {},
      projectStats: {},
      dailyActivity: {},
      hourlyActivity: {},
      longestStreak: 0,
      currentStreak: 0,
      topFiles: [],
      topProjects: [],
      mostProductiveDay: null,
      mostProductiveHour: null,
      favoriteLanguage: null
    };
  }

  /**
   * Add a session to the wrapped data
   */
  addSession(session) {
    this.sessions.push(session);
    this.updateStats(session);
  }

  /**
   * Update aggregate statistics based on a new session
   */
  updateStats(session) {
    this.stats.totalSessions++;
    this.stats.totalMessages += session.messageCount || 0;
    this.stats.totalFilesModified += session.filesModified?.length || 0;
    this.stats.totalFilesCreated += session.filesCreated?.length || 0;
    this.stats.totalLinesAdded += session.linesAdded || 0;
    this.stats.totalLinesRemoved += session.linesRemoved || 0;
    this.stats.totalToolCalls += session.toolCalls?.length || 0;

    // Update tool usage
    if (session.toolCalls) {
      session.toolCalls.forEach(tool => {
        this.stats.toolUsage[tool] = (this.stats.toolUsage[tool] || 0) + 1;
      });
    }

    // Update language stats
    if (session.languages) {
      session.languages.forEach(lang => {
        this.stats.languageStats[lang] = (this.stats.languageStats[lang] || 0) + 1;
      });
    }

    // Update project stats
    if (session.project) {
      this.stats.projectStats[session.project] =
        (this.stats.projectStats[session.project] || 0) + 1;
    }

    // Update daily activity
    if (session.date) {
      const day = session.date.split('T')[0];
      this.stats.dailyActivity[day] = (this.stats.dailyActivity[day] || 0) + 1;
    }

    // Update hourly activity
    if (session.timestamp) {
      const hour = new Date(session.timestamp).getHours();
      this.stats.hourlyActivity[hour] = (this.stats.hourlyActivity[hour] || 0) + 1;
    }
  }

  /**
   * Calculate derived statistics
   */
  calculateDerivedStats() {
    // Find most productive day
    let maxActivity = 0;
    for (const [day, count] of Object.entries(this.stats.dailyActivity)) {
      if (count > maxActivity) {
        maxActivity = count;
        this.stats.mostProductiveDay = { date: day, sessions: count };
      }
    }

    // Find most productive hour
    let maxHourActivity = 0;
    for (const [hour, count] of Object.entries(this.stats.hourlyActivity)) {
      if (count > maxHourActivity) {
        maxHourActivity = count;
        this.stats.mostProductiveHour = { hour: parseInt(hour), sessions: count };
      }
    }

    // Find favorite language
    let maxLangCount = 0;
    for (const [lang, count] of Object.entries(this.stats.languageStats)) {
      if (count > maxLangCount) {
        maxLangCount = count;
        this.stats.favoriteLanguage = { language: lang, count };
      }
    }

    // Calculate streaks
    this.calculateStreaks();

    // Get top projects
    this.stats.topProjects = Object.entries(this.stats.projectStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, sessions: count }));
  }

  /**
   * Calculate coding streaks
   */
  calculateStreaks() {
    const dates = Object.keys(this.stats.dailyActivity).sort();
    if (dates.length === 0) return;

    let currentStreak = 1;
    let longestStreak = 1;
    let tempStreak = 1;

    for (let i = 1; i < dates.length; i++) {
      const prevDate = new Date(dates[i - 1]);
      const currDate = new Date(dates[i]);
      const diffDays = Math.floor((currDate - prevDate) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }

    longestStreak = Math.max(longestStreak, tempStreak);

    // Check if current streak is active
    const lastDate = new Date(dates[dates.length - 1]);
    const today = new Date();
    const daysSinceLastActivity = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));

    if (daysSinceLastActivity <= 1) {
      currentStreak = tempStreak;
    }

    this.stats.longestStreak = longestStreak;
    this.stats.currentStreak = currentStreak;
  }

  /**
   * Get fun insights and achievements
   */
  getInsights() {
    const insights = [];

    // Lines of code insights
    const totalLines = this.stats.totalLinesAdded + this.stats.totalLinesRemoved;
    if (totalLines > 10000) {
      insights.push({
        type: 'achievement',
        title: '🏆 Code Maestro',
        description: `You modified over ${totalLines.toLocaleString()} lines of code!`
      });
    }

    // Session insights
    if (this.stats.totalSessions > 100) {
      insights.push({
        type: 'achievement',
        title: '🔥 Power User',
        description: `You had ${this.stats.totalSessions} coding sessions this year!`
      });
    }

    // Streak insights
    if (this.stats.longestStreak >= 7) {
      insights.push({
        type: 'achievement',
        title: '⚡ On Fire',
        description: `Your longest streak was ${this.stats.longestStreak} days!`
      });
    }

    // Late night coder
    if ((this.stats.hourlyActivity[23] || 0) + (this.stats.hourlyActivity[0] || 0) > 10) {
      insights.push({
        type: 'badge',
        title: '🌙 Night Owl',
        description: 'You love coding after midnight!'
      });
    }

    // Early bird
    if ((this.stats.hourlyActivity[6] || 0) + (this.stats.hourlyActivity[7] || 0) > 10) {
      insights.push({
        type: 'badge',
        title: '🌅 Early Bird',
        description: 'You start coding with the sunrise!'
      });
    }

    // Tool master
    const toolCount = Object.keys(this.stats.toolUsage).length;
    if (toolCount > 10) {
      insights.push({
        type: 'achievement',
        title: '🛠️ Tool Master',
        description: `You used ${toolCount} different tools!`
      });
    }

    return insights;
  }

  /**
   * Export data as JSON
   */
  toJSON() {
    return {
      year: this.year,
      stats: this.stats,
      insights: this.getInsights(),
      generatedAt: new Date().toISOString()
    };
  }
}

module.exports = WrappedData;
