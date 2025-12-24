#!/usr/bin/env node

const ClaudeCodeParser = require('./claudeCodeParser');
const TerminalDisplay = require('./terminal-display');
const fs = require('fs');
const path = require('path');

/**
 * Generate wrapped from real Claude Code data
 */

class RealWrappedGenerator {
  constructor(year = new Date().getFullYear()) {
    this.year = year;
    this.parser = new ClaudeCodeParser();
  }

  /**
   * Convert aggregated stats to WrappedData format
   */
  toWrappedFormat(aggregated) {
    const wrapped = {
      year: this.year,
      stats: {
        totalSessions: aggregated.totalSessions,
        totalMessages: aggregated.totalMessages,
        totalFilesModified: aggregated.totalFilesModified,
        totalFilesCreated: aggregated.totalFilesCreated,
        totalFilesAccessed: aggregated.totalFilesAccessed,
        totalToolCalls: Object.values(aggregated.toolUsage).reduce((sum, count) => sum + count, 0),
        toolUsage: aggregated.toolUsage,
        languageStats: aggregated.languageStats,
        projectStats: aggregated.projectStats,
        dailyActivity: aggregated.dailyActivity,
        hourlyActivity: aggregated.hourlyActivity,
        totalDuration: aggregated.totalDuration,
        totalThinkingBlocks: aggregated.totalThinkingBlocks,
        totalGitBranches: aggregated.totalGitBranches,
        longestStreak: 0,
        currentStreak: 0,
        topProjects: [],
        mostProductiveDay: null,
        mostProductiveHour: null,
        favoriteLanguage: null,
        mostUsedTool: null
      }
    };

    // Calculate derived stats
    this.calculateDerivedStats(wrapped.stats);

    return wrapped;
  }

  /**
   * Calculate derived statistics
   */
  calculateDerivedStats(stats) {
    // Most productive day
    let maxDayActivity = 0;
    for (const [day, count] of Object.entries(stats.dailyActivity)) {
      if (count > maxDayActivity) {
        maxDayActivity = count;
        stats.mostProductiveDay = { date: day, sessions: count };
      }
    }

    // Most productive hour
    let maxHourActivity = 0;
    for (const [hour, count] of Object.entries(stats.hourlyActivity)) {
      if (count > maxHourActivity) {
        maxHourActivity = count;
        stats.mostProductiveHour = { hour: parseInt(hour), sessions: count };
      }
    }

    // Favorite language
    let maxLangCount = 0;
    for (const [lang, count] of Object.entries(stats.languageStats)) {
      if (count > maxLangCount) {
        maxLangCount = count;
        stats.favoriteLanguage = { language: lang, count };
      }
    }

    // Most used tool
    let maxToolCount = 0;
    for (const [tool, count] of Object.entries(stats.toolUsage)) {
      if (count > maxToolCount) {
        maxToolCount = count;
        stats.mostUsedTool = { tool, count };
      }
    }

    // Top projects
    stats.topProjects = Object.entries(stats.projectStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, sessions]) => ({ name, sessions }));

    // Calculate streaks
    this.calculateStreaks(stats);
  }

  /**
   * Calculate coding streaks
   */
  calculateStreaks(stats) {
    const dates = Object.keys(stats.dailyActivity).sort();
    if (dates.length === 0) return;

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

    let currentStreak = 0;
    if (daysSinceLastActivity <= 1) {
      currentStreak = tempStreak;
    }

    stats.longestStreak = longestStreak;
    stats.currentStreak = currentStreak;
  }

  /**
   * Get insights and achievements
   */
  getInsights(stats) {
    const insights = [];

    // Session insights
    if (stats.totalSessions > 50) {
      insights.push({
        type: 'achievement',
        title: '🔥 Power User',
        description: `You had ${stats.totalSessions} coding sessions this year!`
      });
    }

    // Messages
    if (stats.totalMessages > 100) {
      insights.push({
        type: 'achievement',
        title: '💬 Conversationalist',
        description: `You sent ${stats.totalMessages} messages to Claude!`
      });
    }

    // Files
    if (stats.totalFilesModified > 50) {
      insights.push({
        type: 'achievement',
        title: '📝 File Wizard',
        description: `You modified ${stats.totalFilesModified} files!`
      });
    }

    // Duration
    if (stats.totalDuration > 60) {
      const hours = Math.floor(stats.totalDuration / 60);
      insights.push({
        type: 'achievement',
        title: '⏱️ Time Master',
        description: `You spent ${hours} hours coding with Claude!`
      });
    }

    // Streak insights
    if (stats.longestStreak >= 3) {
      insights.push({
        type: 'achievement',
        title: '⚡ On Fire',
        description: `Your longest streak was ${stats.longestStreak} days!`
      });
    }

    // Late night coder
    if ((stats.hourlyActivity[23] || 0) + (stats.hourlyActivity[0] || 0) > 5) {
      insights.push({
        type: 'badge',
        title: '🌙 Night Owl',
        description: 'You love coding after midnight!'
      });
    }

    // Early bird
    if ((stats.hourlyActivity[6] || 0) + (stats.hourlyActivity[7] || 0) > 5) {
      insights.push({
        type: 'badge',
        title: '🌅 Early Bird',
        description: 'You start coding with the sunrise!'
      });
    }

    // Tool master
    const toolCount = Object.keys(stats.toolUsage).length;
    if (toolCount > 5) {
      insights.push({
        type: 'achievement',
        title: '🛠️ Tool Master',
        description: `You used ${toolCount} different tools!`
      });
    }

    // Thinking
    if (stats.totalThinkingBlocks > 20) {
      insights.push({
        type: 'achievement',
        title: '🧠 Deep Thinker',
        description: `Claude had ${stats.totalThinkingBlocks} thinking sessions for you!`
      });
    }

    return insights;
  }

  /**
   * Generate HTML wrapped
   */
  generateHTML(wrapped, outputPath = './output') {
    const stats = wrapped.stats;
    const insights = wrapped.insights;

    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }

    const htmlContent = this.createHTMLTemplate(wrapped.year, stats, insights);
    const htmlFile = path.join(outputPath, `wrapped_${wrapped.year}.html`);

    fs.writeFileSync(htmlFile, htmlContent, 'utf8');

    return htmlFile;
  }

  createHTMLTemplate(year, stats, insights) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Claude Code Wrapped ${year}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #fff;
            overflow-x: hidden;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }

        .slide {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 60px 20px;
            opacity: 0;
            animation: fadeIn 1s ease-in forwards;
        }

        @keyframes fadeIn {
            to { opacity: 1; }
        }

        .hero {
            text-align: center;
        }

        .hero h1 {
            font-size: 5rem;
            font-weight: 900;
            margin-bottom: 20px;
            background: linear-gradient(45deg, #fff, #ffd700);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .hero p {
            font-size: 1.5rem;
            opacity: 0.9;
        }

        .stat-card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 40px;
            margin: 20px 0;
            width: 100%;
            max-width: 600px;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .stat-card h2 {
            font-size: 2.5rem;
            margin-bottom: 10px;
        }

        .stat-card .number {
            font-size: 4rem;
            font-weight: 900;
            color: #ffd700;
            margin: 20px 0;
        }

        .stat-card .label {
            font-size: 1.3rem;
            opacity: 0.8;
        }

        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            width: 100%;
            max-width: 900px;
        }

        .mini-card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 30px;
            text-align: center;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .mini-card .number {
            font-size: 2.5rem;
            font-weight: 900;
            color: #ffd700;
            margin: 10px 0;
        }

        .mini-card .label {
            font-size: 1rem;
            opacity: 0.8;
        }

        .achievement {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            border-radius: 15px;
            padding: 30px;
            margin: 15px 0;
            width: 100%;
            max-width: 600px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }

        .achievement h3 {
            font-size: 1.8rem;
            margin-bottom: 10px;
        }

        .achievement p {
            font-size: 1.1rem;
            opacity: 0.9;
        }

        .list {
            list-style: none;
            width: 100%;
            max-width: 600px;
        }

        .list-item {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 10px;
            padding: 15px 25px;
            margin: 10px 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .list-name {
            font-size: 1.3rem;
            font-weight: 600;
        }

        .list-count {
            font-size: 1.5rem;
            color: #ffd700;
            font-weight: 900;
        }

        @media (max-width: 768px) {
            .hero h1 { font-size: 3rem; }
            .stat-card .number { font-size: 3rem; }
            .grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Hero Slide -->
        <div class="slide hero">
            <h1>🎉 ${year}</h1>
            <p>Your Claude Code Wrapped</p>
        </div>

        <!-- Total Sessions -->
        <div class="slide">
            <div class="stat-card">
                <h2>You had</h2>
                <div class="number">${stats.totalSessions.toLocaleString()}</div>
                <div class="label">coding sessions this year</div>
            </div>
        </div>

        <!-- Messages -->
        <div class="slide">
            <div class="stat-card">
                <h2>You sent</h2>
                <div class="number">${stats.totalMessages.toLocaleString()}</div>
                <div class="label">messages to Claude</div>
            </div>
        </div>

        <!-- Files -->
        <div class="slide">
            <h2 style="margin-bottom: 30px; font-size: 2.5rem;">Your Impact</h2>
            <div class="grid">
                <div class="mini-card">
                    <div class="label">Files Accessed</div>
                    <div class="number">${stats.totalFilesAccessed.toLocaleString()}</div>
                </div>
                <div class="mini-card">
                    <div class="label">Files Modified</div>
                    <div class="number">${stats.totalFilesModified.toLocaleString()}</div>
                </div>
                <div class="mini-card">
                    <div class="label">Files Created</div>
                    <div class="number">${stats.totalFilesCreated.toLocaleString()}</div>
                </div>
                <div class="mini-card">
                    <div class="label">Tool Calls</div>
                    <div class="number">${stats.totalToolCalls.toLocaleString()}</div>
                </div>
            </div>
        </div>

        ${stats.favoriteLanguage ? `
        <!-- Favorite Language -->
        <div class="slide">
            <div class="stat-card">
                <h2>Your favorite language</h2>
                <div class="number">${stats.favoriteLanguage.language}</div>
                <div class="label">Used in ${stats.favoriteLanguage.count} sessions</div>
            </div>
        </div>` : ''}

        ${stats.mostUsedTool ? `
        <!-- Most Used Tool -->
        <div class="slide">
            <div class="stat-card">
                <h2>Your favorite tool</h2>
                <div class="number">${stats.mostUsedTool.tool}</div>
                <div class="label">Used ${stats.mostUsedTool.count} times</div>
            </div>
        </div>` : ''}

        ${stats.topProjects && stats.topProjects.length > 0 ? `
        <!-- Top Projects -->
        <div class="slide">
            <h2 style="margin-bottom: 30px; font-size: 2.5rem;">Top Projects</h2>
            <ul class="list">
                ${stats.topProjects.map((project, i) => `
                    <li class="list-item">
                        <span class="list-name">${i + 1}. ${project.name}</span>
                        <span class="list-count">${project.sessions}</span>
                    </li>
                `).join('')}
            </ul>
        </div>` : ''}

        ${stats.mostProductiveHour ? `
        <!-- Most Productive Hour -->
        <div class="slide">
            <div class="stat-card">
                <h2>You code most at</h2>
                <div class="number">${this.formatHour(stats.mostProductiveHour.hour)}</div>
                <div class="label">${stats.mostProductiveHour.sessions} sessions at this hour</div>
            </div>
        </div>` : ''}

        ${stats.totalDuration > 0 ? `
        <!-- Time Spent -->
        <div class="slide">
            <div class="stat-card">
                <h2>You spent</h2>
                <div class="number">${Math.floor(stats.totalDuration / 60)}</div>
                <div class="label">hours coding with Claude</div>
            </div>
        </div>` : ''}

        <!-- Achievements -->
        ${insights && insights.length > 0 ? `
        <div class="slide">
            <h2 style="margin-bottom: 30px; font-size: 2.5rem;">Achievements</h2>
            ${insights.map(insight => `
                <div class="achievement">
                    <h3>${insight.title}</h3>
                    <p>${insight.description}</p>
                </div>
            `).join('')}
        </div>` : ''}

        <!-- Final Slide -->
        <div class="slide hero">
            <h1>🚀</h1>
            <p style="font-size: 2rem; margin-top: 20px;">Keep coding in ${year + 1}!</p>
        </div>
    </div>

    <script>
        const slides = document.querySelectorAll('.slide');
        let currentSlide = 0;

        slides.forEach((slide, index) => {
            slide.style.animationDelay = \`\${index * 0.1}s\`;
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown' && currentSlide < slides.length - 1) {
                currentSlide++;
                slides[currentSlide].scrollIntoView({ behavior: 'smooth' });
            } else if (e.key === 'ArrowUp' && currentSlide > 0) {
                currentSlide--;
                slides[currentSlide].scrollIntoView({ behavior: 'smooth' });
            }
        });
    </script>
</body>
</html>`;
  }

  formatHour(hour) {
    if (hour === 0) return '12:00 AM';
    if (hour === 12) return '12:00 PM';
    if (hour < 12) return `${hour}:00 AM`;
    return `${hour - 12}:00 PM`;
  }

  /**
   * Generate wrapped from real data
   */
  generate() {
    console.log(`\n📊 Analyzing Claude Code sessions for ${this.year}...\n`);

    // Parse all sessions
    const sessions = this.parser.parseAllSessions(this.year);

    if (sessions.length === 0) {
      console.error(`\n❌ No Claude Code sessions found for ${this.year}\n`);
      console.log('💡 Tip: Make sure you have used Claude Code this year!\n');
      process.exit(1);
    }

    console.log(`✅ Found ${sessions.length} sessions\n`);

    // Aggregate statistics
    const aggregated = this.parser.aggregateStats(sessions);

    // Convert to wrapped format
    const wrapped = this.toWrappedFormat(aggregated);
    wrapped.insights = this.getInsights(wrapped.stats);

    return wrapped;
  }

  /**
   * Display in terminal
   */
  displayTerminal(wrapped) {
    const display = new TerminalDisplay();
    const mockWrapped = {
      toJSON: () => wrapped
    };
    display.display(mockWrapped);
  }
}

// Main function
function main() {
  const args = process.argv.slice(2);
  const year = args[0] ? parseInt(args[0]) : new Date().getFullYear();

  const generator = new RealWrappedGenerator(year);
  const wrapped = generator.generate();

  // Display in terminal
  generator.displayTerminal(wrapped);

  // Generate HTML
  const htmlFile = generator.generateHTML(wrapped);
  console.log(`\n✅ HTML wrapped saved to: ${htmlFile}`);
  console.log('💡 Open the HTML file in your browser to see the full visualization!\n');
}

if (require.main === module) {
  main();
}

module.exports = RealWrappedGenerator;
