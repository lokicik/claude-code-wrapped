const fs = require('fs');
const path = require('path');
const DataCollector = require('./collector');
const WrappedData = require('./models/WrappedData');

/**
 * Generator for Claude Code Wrapped statistics
 */
class WrappedGenerator {
  constructor(year = new Date().getFullYear()) {
    this.year = year;
    this.collector = new DataCollector();
  }

  /**
   * Generate wrapped data for the specified year
   */
  generate() {
    const sessions = this.collector.getSessionsByYear(this.year);

    if (sessions.length === 0) {
      throw new Error(`No data found for year ${this.year}`);
    }

    const wrapped = new WrappedData();
    wrapped.year = this.year;

    sessions.forEach(session => {
      wrapped.addSession(session);
    });

    wrapped.calculateDerivedStats();

    return wrapped;
  }

  /**
   * Generate and save wrapped data to file
   */
  generateAndSave(outputPath = './output') {
    const wrapped = this.generate();
    const data = wrapped.toJSON();

    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }

    const filename = path.join(outputPath, `wrapped_${this.year}.json`);
    fs.writeFileSync(filename, JSON.stringify(data, null, 2), 'utf8');

    return { wrapped, filename };
  }

  /**
   * Generate HTML wrapped visualization
   */
  generateHTML(outputPath = './output') {
    const { wrapped } = this.generateAndSave(outputPath);
    const data = wrapped.toJSON();

    const htmlContent = this.createHTMLTemplate(data);
    const htmlFile = path.join(outputPath, `wrapped_${this.year}.html`);

    fs.writeFileSync(htmlFile, htmlContent, 'utf8');

    return htmlFile;
  }

  /**
   * Create HTML template for wrapped visualization
   */
  createHTMLTemplate(data) {
    const stats = data.stats;
    const insights = data.insights;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Claude Code Wrapped ${data.year}</title>
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

        .language-list {
            list-style: none;
            width: 100%;
            max-width: 600px;
        }

        .language-item {
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

        .language-name {
            font-size: 1.3rem;
            font-weight: 600;
        }

        .language-count {
            font-size: 1.5rem;
            color: #ffd700;
            font-weight: 900;
        }

        .footer {
            margin-top: 40px;
            text-align: center;
            opacity: 0.7;
            font-size: 0.9rem;
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
            <h1>🎉 ${data.year}</h1>
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

        <!-- Code Changes -->
        <div class="slide">
            <div class="stat-card">
                <h2>You modified</h2>
                <div class="number">${(stats.totalLinesAdded + stats.totalLinesRemoved).toLocaleString()}</div>
                <div class="label">lines of code</div>
            </div>
        </div>

        <!-- Files -->
        <div class="slide">
            <h2 style="margin-bottom: 30px; font-size: 2.5rem;">Your Impact</h2>
            <div class="grid">
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
                <div class="mini-card">
                    <div class="label">Longest Streak</div>
                    <div class="number">${stats.longestStreak}</div>
                </div>
            </div>
        </div>

        ${stats.favoriteLanguage ? `
        <!-- Favorite Language -->
        <div class="slide">
            <div class="stat-card">
                <h2>Your favorite language</h2>
                <div class="number">${stats.favoriteLanguage.language}</div>
                <div class="label">Used ${stats.favoriteLanguage.count} times</div>
            </div>
        </div>` : ''}

        ${stats.topProjects && stats.topProjects.length > 0 ? `
        <!-- Top Projects -->
        <div class="slide">
            <h2 style="margin-bottom: 30px; font-size: 2.5rem;">Top Projects</h2>
            <ul class="language-list">
                ${stats.topProjects.map((project, i) => `
                    <li class="language-item">
                        <span class="language-name">${i + 1}. ${project.name}</span>
                        <span class="language-count">${project.sessions}</span>
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
            <p style="font-size: 2rem; margin-top: 20px;">Keep coding in ${data.year + 1}!</p>
            <div class="footer">
                <p>Generated on ${new Date(data.generatedAt).toLocaleDateString()}</p>
                <p>Claude Code Wrapped</p>
            </div>
        </div>
    </div>

    <script>
        // Add scroll animations
        const slides = document.querySelectorAll('.slide');
        let currentSlide = 0;

        slides.forEach((slide, index) => {
            slide.style.animationDelay = \`\${index * 0.1}s\`;
        });

        // Smooth scroll
        document.addEventListener('wheel', (e) => {
            if (Math.abs(e.deltaY) > 50) {
                e.preventDefault();
                if (e.deltaY > 0 && currentSlide < slides.length - 1) {
                    currentSlide++;
                } else if (e.deltaY < 0 && currentSlide > 0) {
                    currentSlide--;
                }
                slides[currentSlide].scrollIntoView({ behavior: 'smooth' });
            }
        }, { passive: false });

        // Arrow key navigation
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
}

module.exports = WrappedGenerator;
