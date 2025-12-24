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
            font-family: 'CircularStd', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #000;
            color: #fff;
            overflow-x: hidden;
            overflow-y: scroll;
            scroll-behavior: smooth;
        }

        .slide-container {
            scroll-snap-type: y mandatory;
            height: 100vh;
            overflow-y: scroll;
        }

        .slide {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 60px 20px;
            scroll-snap-align: start;
            position: relative;
            overflow: hidden;
        }

        /* Animated gradient backgrounds */
        .bg-gradient-1 {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            animation: gradientShift 10s ease infinite;
        }

        .bg-gradient-2 {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            animation: gradientShift 10s ease infinite;
        }

        .bg-gradient-3 {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            animation: gradientShift 10s ease infinite;
        }

        .bg-gradient-4 {
            background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
            animation: gradientShift 10s ease infinite;
        }

        .bg-gradient-5 {
            background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
            animation: gradientShift 10s ease infinite;
        }

        .bg-dark {
            background: #121212;
        }

        @keyframes gradientShift {
            0%, 100% { filter: hue-rotate(0deg); }
            50% { filter: hue-rotate(45deg); }
        }

        /* Particles background */
        .particles {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1;
        }

        .particle {
            position: absolute;
            width: 4px;
            height: 4px;
            background: rgba(255, 255, 255, 0.6);
            border-radius: 50%;
            animation: float 15s infinite ease-in-out;
        }

        @keyframes float {
            0%, 100% { transform: translateY(0) translateX(0); opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { transform: translateY(-100vh) translateX(50px); opacity: 0; }
        }

        /* Content */
        .content {
            position: relative;
            z-index: 10;
            text-align: center;
            max-width: 800px;
            width: 100%;
        }

        /* Hero animations */
        .hero-title {
            font-size: 8rem;
            font-weight: 900;
            margin-bottom: 20px;
            background: linear-gradient(45deg, #fff, #ffd700, #fff);
            background-size: 200% auto;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            animation: shimmer 3s linear infinite, scaleIn 1s ease-out;
        }

        @keyframes shimmer {
            to { background-position: 200% center; }
        }

        @keyframes scaleIn {
            from { transform: scale(0.5); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
        }

        .hero-subtitle {
            font-size: 2rem;
            opacity: 0;
            animation: fadeInUp 1s ease-out 0.5s forwards;
        }

        @keyframes fadeInUp {
            from { transform: translateY(30px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }

        /* Number counter animation */
        .stat-number {
            font-size: 7rem;
            font-weight: 900;
            background: linear-gradient(135deg, #ffd700, #ffed4e);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin: 30px 0;
            line-height: 1;
            animation: popIn 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        @keyframes popIn {
            0% { transform: scale(0); opacity: 0; }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); opacity: 1; }
        }

        .stat-label {
            font-size: 2rem;
            font-weight: 300;
            opacity: 0.9;
            animation: fadeInUp 0.8s ease-out 0.3s forwards;
            opacity: 0;
        }

        .stat-prefix {
            font-size: 3rem;
            font-weight: 600;
            margin-bottom: 20px;
            animation: fadeInUp 0.8s ease-out 0.1s forwards;
            opacity: 0;
        }

        /* Grid animations */
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 30px;
            width: 100%;
            margin-top: 50px;
        }

        .grid-item {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(20px);
            border-radius: 20px;
            padding: 40px 30px;
            border: 2px solid rgba(255, 255, 255, 0.2);
            transform: translateY(50px);
            opacity: 0;
            animation: slideUpFade 0.8s ease-out forwards;
        }

        .grid-item:nth-child(1) { animation-delay: 0.1s; }
        .grid-item:nth-child(2) { animation-delay: 0.2s; }
        .grid-item:nth-child(3) { animation-delay: 0.3s; }
        .grid-item:nth-child(4) { animation-delay: 0.4s; }

        @keyframes slideUpFade {
            to { transform: translateY(0); opacity: 1; }
        }

        .grid-number {
            font-size: 3.5rem;
            font-weight: 900;
            color: #ffd700;
            margin: 15px 0;
        }

        .grid-label {
            font-size: 1.1rem;
            opacity: 0.8;
            font-weight: 500;
        }

        /* Language/Tool card */
        .feature-card {
            background: rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(30px);
            border-radius: 30px;
            padding: 60px;
            border: 3px solid rgba(255, 255, 255, 0.3);
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            transform: scale(0.8);
            opacity: 0;
            animation: scaleInBounce 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
        }

        @keyframes scaleInBounce {
            0% { transform: scale(0.5) rotate(-5deg); opacity: 0; }
            50% { transform: scale(1.05) rotate(2deg); }
            100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }

        /* List animations */
        .rank-list {
            list-style: none;
            width: 100%;
            max-width: 600px;
            margin-top: 40px;
        }

        .rank-item {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(20px);
            border-radius: 15px;
            padding: 20px 30px;
            margin: 15px 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border: 2px solid rgba(255, 255, 255, 0.2);
            transform: translateX(-100%);
            opacity: 0;
            animation: slideInRight 0.6s ease-out forwards;
        }

        .rank-item:nth-child(1) { animation-delay: 0.1s; }
        .rank-item:nth-child(2) { animation-delay: 0.2s; }
        .rank-item:nth-child(3) { animation-delay: 0.3s; }
        .rank-item:nth-child(4) { animation-delay: 0.4s; }
        .rank-item:nth-child(5) { animation-delay: 0.5s; }

        @keyframes slideInRight {
            to { transform: translateX(0); opacity: 1; }
        }

        .rank-name {
            font-size: 1.5rem;
            font-weight: 700;
        }

        .rank-badge {
            font-size: 2rem;
            margin-right: 15px;
        }

        .rank-count {
            font-size: 2rem;
            color: #ffd700;
            font-weight: 900;
        }

        /* Achievement cards */
        .achievement-card {
            background: linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.05));
            backdrop-filter: blur(20px);
            border-radius: 25px;
            padding: 40px;
            margin: 20px 0;
            max-width: 600px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            box-shadow: 0 15px 40px rgba(0, 0, 0, 0.4);
            transform: rotateX(90deg);
            opacity: 0;
            animation: flipIn 0.8s ease-out forwards;
        }

        .achievement-card:nth-child(1) { animation-delay: 0.1s; }
        .achievement-card:nth-child(2) { animation-delay: 0.3s; }
        .achievement-card:nth-child(3) { animation-delay: 0.5s; }
        .achievement-card:nth-child(4) { animation-delay: 0.7s; }

        @keyframes flipIn {
            to { transform: rotateX(0); opacity: 1; }
        }

        .achievement-title {
            font-size: 2.2rem;
            font-weight: 800;
            margin-bottom: 15px;
        }

        .achievement-desc {
            font-size: 1.3rem;
            opacity: 0.9;
            font-weight: 400;
        }

        /* Section title */
        .section-title {
            font-size: 3.5rem;
            font-weight: 900;
            margin-bottom: 50px;
            background: linear-gradient(135deg, #fff, #ffd700);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            animation: fadeInDown 0.8s ease-out;
        }

        @keyframes fadeInDown {
            from { transform: translateY(-30px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }

        /* Final slide */
        .final-emoji {
            font-size: 12rem;
            animation: bounce 2s ease-in-out infinite;
        }

        @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-30px); }
        }

        .final-text {
            font-size: 3rem;
            font-weight: 800;
            margin-top: 40px;
            animation: fadeInUp 1s ease-out 0.5s forwards;
            opacity: 0;
        }

        /* Progress indicator */
        .progress-indicator {
            position: fixed;
            right: 30px;
            top: 50%;
            transform: translateY(-50%);
            z-index: 1000;
        }

        .progress-dot {
            width: 12px;
            height: 12px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            margin: 10px 0;
            transition: all 0.3s;
        }

        .progress-dot.active {
            background: #ffd700;
            transform: scale(1.5);
        }

        /* Navigation hint */
        .nav-hint {
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 1rem;
            opacity: 0.6;
            animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 0.8; }
        }

        /* Confetti */
        .confetti {
            position: absolute;
            width: 10px;
            height: 10px;
            background: #ffd700;
            animation: confettiFall 3s linear infinite;
        }

        @keyframes confettiFall {
            to { transform: translateY(100vh) rotate(360deg); opacity: 0; }
        }

        /* Mobile responsive */
        @media (max-width: 768px) {
            .hero-title { font-size: 4rem; }
            .stat-number { font-size: 4rem; }
            .section-title { font-size: 2.5rem; }
            .grid { grid-template-columns: 1fr; }
            .feature-card { padding: 40px 30px; }
        }
    </style>
</head>
<body>
    <div class="slide-container" id="slideContainer">
        <!-- Hero Slide -->
        <div class="slide bg-gradient-1">
            <div class="particles" id="particles1"></div>
            <div class="content">
                <div class="hero-title">${year}</div>
                <div class="hero-subtitle">Your Claude Code Wrapped</div>
            </div>
        </div>

        <!-- Total Sessions -->
        <div class="slide bg-gradient-2">
            <div class="particles" id="particles2"></div>
            <div class="content">
                <div class="stat-prefix">You had</div>
                <div class="stat-number" data-target="${stats.totalSessions}">0</div>
                <div class="stat-label">coding sessions this year</div>
            </div>
        </div>

        <!-- Messages -->
        <div class="slide bg-gradient-3">
            <div class="particles" id="particles3"></div>
            <div class="content">
                <div class="stat-prefix">You sent</div>
                <div class="stat-number" data-target="${stats.totalMessages}">0</div>
                <div class="stat-label">messages to Claude</div>
            </div>
        </div>

        <!-- Files Grid -->
        <div class="slide bg-gradient-4">
            <div class="content">
                <div class="section-title">Your Impact</div>
                <div class="grid">
                    <div class="grid-item">
                        <div class="grid-label">Files Accessed</div>
                        <div class="grid-number" data-target="${stats.totalFilesAccessed}">0</div>
                    </div>
                    <div class="grid-item">
                        <div class="grid-label">Files Modified</div>
                        <div class="grid-number" data-target="${stats.totalFilesModified}">0</div>
                    </div>
                    <div class="grid-item">
                        <div class="grid-label">Files Created</div>
                        <div class="grid-number" data-target="${stats.totalFilesCreated}">0</div>
                    </div>
                    <div class="grid-item">
                        <div class="grid-label">Tool Calls</div>
                        <div class="grid-number" data-target="${stats.totalToolCalls}">0</div>
                    </div>
                </div>
            </div>
        </div>

        ${stats.favoriteLanguage ? `
        <!-- Favorite Language -->
        <div class="slide bg-gradient-5">
            <div class="content">
                <div class="stat-prefix">Your favorite language</div>
                <div class="feature-card">
                    <div class="stat-number">${stats.favoriteLanguage.language}</div>
                    <div class="stat-label">Used in ${stats.favoriteLanguage.count} sessions</div>
                </div>
            </div>
        </div>` : ''}

        ${stats.mostUsedTool ? `
        <!-- Most Used Tool -->
        <div class="slide bg-gradient-1">
            <div class="content">
                <div class="stat-prefix">Your favorite tool</div>
                <div class="feature-card">
                    <div class="stat-number">${stats.mostUsedTool.tool}</div>
                    <div class="stat-label">Used ${stats.mostUsedTool.count} times</div>
                </div>
            </div>
        </div>` : ''}

        ${stats.topProjects && stats.topProjects.length > 0 ? `
        <!-- Top Projects -->
        <div class="slide bg-gradient-2">
            <div class="content">
                <div class="section-title">Top Projects</div>
                <ul class="rank-list">
                    ${stats.topProjects.map((project, i) => `
                        <li class="rank-item">
                            <span><span class="rank-badge">${['🥇','🥈','🥉','4️⃣','5️⃣'][i]}</span><span class="rank-name">${project.name}</span></span>
                            <span class="rank-count">${project.sessions}</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
        </div>` : ''}

        ${stats.mostProductiveHour ? `
        <!-- Most Productive Hour -->
        <div class="slide bg-gradient-3">
            <div class="content">
                <div class="stat-prefix">You code most at</div>
                <div class="feature-card">
                    <div class="stat-number">${this.formatHour(stats.mostProductiveHour.hour)}</div>
                    <div class="stat-label">${stats.mostProductiveHour.sessions} sessions at this hour</div>
                </div>
            </div>
        </div>` : ''}

        ${stats.totalDuration > 0 ? `
        <!-- Time Spent -->
        <div class="slide bg-gradient-4">
            <div class="content">
                <div class="stat-prefix">You spent</div>
                <div class="stat-number" data-target="${Math.floor(stats.totalDuration / 60)}">0</div>
                <div class="stat-label">hours coding with Claude</div>
            </div>
        </div>` : ''}

        ${insights && insights.length > 0 ? `
        <!-- Achievements -->
        <div class="slide bg-gradient-5">
            <div class="particles" id="particles4"></div>
            <div class="content">
                <div class="section-title">Achievements Unlocked</div>
                ${insights.map(insight => `
                    <div class="achievement-card">
                        <div class="achievement-title">${insight.title}</div>
                        <div class="achievement-desc">${insight.description}</div>
                    </div>
                `).join('')}
            </div>
        </div>` : ''}

        <!-- Final Slide -->
        <div class="slide bg-dark">
            <div class="particles" id="particles5"></div>
            <div class="content">
                <div class="final-emoji">🚀</div>
                <div class="final-text">Keep coding in ${year + 1}!</div>
            </div>
        </div>
    </div>

    <!-- Progress Indicator -->
    <div class="progress-indicator" id="progressIndicator"></div>

    <!-- Navigation Hint -->
    <div class="nav-hint">↓ Scroll or use arrow keys ↓</div>

    <script>
        // Number counter animation
        function animateNumber(element, start, end, duration) {
            const range = end - start;
            const increment = range / (duration / 16);
            let current = start;

            const timer = setInterval(() => {
                current += increment;
                if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
                    current = end;
                    clearInterval(timer);
                }
                element.textContent = Math.floor(current).toLocaleString();
            }, 16);
        }

        // Intersection Observer for animations
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Animate numbers
                    const numbers = entry.target.querySelectorAll('[data-target]');
                    numbers.forEach(num => {
                        const target = parseInt(num.getAttribute('data-target'));
                        animateNumber(num, 0, target, 2000);
                        num.removeAttribute('data-target');
                    });
                }
            });
        }, { threshold: 0.5 });

        // Observe all slides
        document.querySelectorAll('.slide').forEach(slide => observer.observe(slide));

        // Create particles
        function createParticles(containerId, count = 30) {
            const container = document.getElementById(containerId);
            if (!container) return;

            for (let i = 0; i < count; i++) {
                const particle = document.createElement('div');
                particle.className = 'particle';
                particle.style.left = Math.random() * 100 + '%';
                particle.style.animationDelay = Math.random() * 15 + 's';
                particle.style.animationDuration = (10 + Math.random() * 10) + 's';
                container.appendChild(particle);
            }
        }

        // Initialize particles
        ['particles1', 'particles2', 'particles3', 'particles4', 'particles5'].forEach(id => {
            createParticles(id, 25);
        });

        // Progress indicator
        const slides = document.querySelectorAll('.slide');
        const progressIndicator = document.getElementById('progressIndicator');

        slides.forEach((slide, index) => {
            const dot = document.createElement('div');
            dot.className = 'progress-dot';
            if (index === 0) dot.classList.add('active');
            progressIndicator.appendChild(dot);
        });

        // Update progress on scroll
        const container = document.getElementById('slideContainer');
        container.addEventListener('scroll', () => {
            const scrollPosition = container.scrollTop;
            const slideHeight = window.innerHeight;
            const currentSlide = Math.round(scrollPosition / slideHeight);

            document.querySelectorAll('.progress-dot').forEach((dot, index) => {
                dot.classList.toggle('active', index === currentSlide);
            });
        });

        // Keyboard navigation
        let currentSlideIndex = 0;
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown' || e.key === ' ') {
                e.preventDefault();
                if (currentSlideIndex < slides.length - 1) {
                    currentSlideIndex++;
                    slides[currentSlideIndex].scrollIntoView({ behavior: 'smooth' });
                }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (currentSlideIndex > 0) {
                    currentSlideIndex--;
                    slides[currentSlideIndex].scrollIntoView({ behavior: 'smooth' });
                }
            }
        });

        // Touch swipe support
        let touchStartY = 0;
        container.addEventListener('touchstart', (e) => {
            touchStartY = e.touches[0].clientY;
        });

        container.addEventListener('touchend', (e) => {
            const touchEndY = e.changedTouches[0].clientY;
            const diff = touchStartY - touchEndY;

            if (Math.abs(diff) > 50) {
                if (diff > 0 && currentSlideIndex < slides.length - 1) {
                    currentSlideIndex++;
                    slides[currentSlideIndex].scrollIntoView({ behavior: 'smooth' });
                } else if (diff < 0 && currentSlideIndex > 0) {
                    currentSlideIndex--;
                    slides[currentSlideIndex].scrollIntoView({ behavior: 'smooth' });
                }
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
  console.log('💡 Open the HTML file in your browser to see the full Spotify-style visualization!\n');
}

if (require.main === module) {
  main();
}

module.exports = RealWrappedGenerator;
