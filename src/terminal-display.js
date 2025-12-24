/**
 * Terminal-based display for Claude Code Wrapped
 * Beautiful CLI visualization of your coding stats
 */

class TerminalDisplay {
  constructor() {
    this.colors = {
      reset: '\x1b[0m',
      bright: '\x1b[1m',
      dim: '\x1b[2m',
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      magenta: '\x1b[35m',
      cyan: '\x1b[36m',
      white: '\x1b[37m',
      bgBlue: '\x1b[44m',
      bgMagenta: '\x1b[45m',
    };
  }

  /**
   * Display the complete wrapped summary
   */
  display(wrappedData) {
    const data = wrappedData.toJSON();
    const stats = data.stats;

    console.clear();
    this.printHeader(data.year);
    this.wait(1000);

    this.printSection('📊 Your Year in Code');
    this.printStat('Total Sessions', stats.totalSessions, '🎯');
    this.printStat('Messages Sent', stats.totalMessages, '💬');
    this.printStat('Files Modified', stats.totalFilesModified, '📝');
    this.printStat('Files Created', stats.totalFilesCreated, '✨');
    this.wait(500);

    this.printSection('💻 Code Changes');
    this.printStat('Lines Added', stats.totalLinesAdded, '➕');
    this.printStat('Lines Removed', stats.totalLinesRemoved, '➖');
    this.printStat('Total Lines Changed', stats.totalLinesAdded + stats.totalLinesRemoved, '📈');
    this.wait(500);

    if (stats.favoriteLanguage) {
      this.printSection('🌟 Favorite Language');
      this.printHighlight(
        stats.favoriteLanguage.language,
        `Used ${stats.favoriteLanguage.count} times`
      );
      this.wait(500);
    }

    if (stats.topProjects && stats.topProjects.length > 0) {
      this.printSection('🚀 Top Projects');
      stats.topProjects.forEach((project, i) => {
        this.printListItem(`${i + 1}. ${project.name}`, `${project.sessions} sessions`);
      });
      this.wait(500);
    }

    this.printSection('🔥 Streaks');
    this.printStat('Longest Streak', `${stats.longestStreak} days`, '⚡');
    if (stats.currentStreak > 0) {
      this.printStat('Current Streak', `${stats.currentStreak} days`, '🔥');
    }
    this.wait(500);

    if (stats.mostProductiveHour) {
      this.printSection('⏰ Most Productive Hour');
      this.printHighlight(
        this.formatHour(stats.mostProductiveHour.hour),
        `${stats.mostProductiveHour.sessions} sessions`
      );
      this.wait(500);
    }

    const insights = data.insights;
    if (insights && insights.length > 0) {
      this.printSection('🏆 Achievements');
      insights.forEach(insight => {
        this.printAchievement(insight.title, insight.description);
      });
    }

    this.printFooter(data.year);
  }

  /**
   * Print the header
   */
  printHeader(year) {
    const { bright, cyan, yellow, reset } = this.colors;
    console.log('\n');
    console.log(bright + cyan + '╔════════════════════════════════════════════════════════╗' + reset);
    console.log(bright + cyan + '║' + reset + yellow + '              🎉 CLAUDE CODE WRAPPED 🎉              ' + cyan + '║' + reset);
    console.log(bright + cyan + '║' + reset + yellow + '                       ' + year + '                        ' + cyan + '║' + reset);
    console.log(bright + cyan + '╚════════════════════════════════════════════════════════╝' + reset);
    console.log('\n');
  }

  /**
   * Print a section header
   */
  printSection(title) {
    const { bright, magenta, reset } = this.colors;
    console.log('\n' + bright + magenta + title + reset);
    console.log(bright + magenta + '─'.repeat(title.length) + reset + '\n');
  }

  /**
   * Print a statistic
   */
  printStat(label, value, emoji = '') {
    const { bright, yellow, cyan, reset } = this.colors;
    const formattedValue = typeof value === 'number' ? value.toLocaleString() : value;
    console.log(
      `${emoji} ${cyan}${label}:${reset} ${bright}${yellow}${formattedValue}${reset}`
    );
  }

  /**
   * Print a highlighted item
   */
  printHighlight(main, sub) {
    const { bright, yellow, cyan, reset, dim } = this.colors;
    console.log(`  ${bright}${yellow}${main}${reset}`);
    console.log(`  ${dim}${cyan}${sub}${reset}\n`);
  }

  /**
   * Print a list item
   */
  printListItem(main, sub) {
    const { yellow, cyan, reset, dim } = this.colors;
    console.log(`  ${yellow}${main}${reset} ${dim}${cyan}(${sub})${reset}`);
  }

  /**
   * Print an achievement
   */
  printAchievement(title, description) {
    const { bright, green, reset, dim } = this.colors;
    console.log(`  ${bright}${green}${title}${reset}`);
    console.log(`  ${dim}${description}${reset}\n`);
  }

  /**
   * Print the footer
   */
  printFooter(year) {
    const { bright, cyan, reset, dim } = this.colors;
    console.log('\n');
    console.log(bright + cyan + '═'.repeat(56) + reset);
    console.log(bright + cyan + `  🚀 Keep coding in ${year + 1}!` + reset);
    console.log(bright + cyan + '═'.repeat(56) + reset);
    console.log(dim + '\n  Generated by Claude Code Wrapped' + reset);
    console.log('\n');
  }

  /**
   * Format hour in 12-hour format
   */
  formatHour(hour) {
    if (hour === 0) return '12:00 AM';
    if (hour === 12) return '12:00 PM';
    if (hour < 12) return `${hour}:00 AM`;
    return `${hour - 12}:00 PM`;
  }

  /**
   * Wait for a specified duration
   */
  wait(ms) {
    // In real implementation, this would be async
    // For demo purposes, we'll skip the actual wait
  }
}

module.exports = TerminalDisplay;
