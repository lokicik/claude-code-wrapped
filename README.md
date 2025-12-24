# 🎉 Claude Code Wrapped

Your year in code with Claude! Get beautiful, Spotify Wrapped-style statistics about your Claude Code usage, complete with insights, achievements, and stunning visualizations.

## ✨ Features

- 📊 **Comprehensive Statistics**: Track sessions, messages, files modified, lines of code, and more
- 🎨 **Beautiful HTML Visualization**: Scroll through your stats with a gorgeous web interface
- 💻 **Terminal Display**: View your wrapped directly in your terminal with colorful output
- 🏆 **Achievements & Insights**: Earn badges and discover interesting patterns in your coding habits
- 📈 **Language & Project Analytics**: See your most-used languages and top projects
- 🔥 **Streak Tracking**: Monitor your coding consistency with daily streaks
- ⏰ **Activity Patterns**: Discover when you're most productive

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/claude-code-wrapped.git
cd claude-code-wrapped

# Install dependencies
npm install
```

### Generate YOUR Real Wrapped

Generate wrapped from your actual Claude Code usage:

```bash
npm run real
```

This will:
1. Parse your Claude Code session logs from `~/.claude/projects/`
2. Extract real usage statistics
3. Display your wrapped in the terminal
4. Create an HTML visualization in `./output/wrapped_2025.html`

Open the HTML file in your browser to see the full interactive experience!

### Try the Demo

Want to see what it looks like with sample data first?

```bash
npm run demo
```

This will generate 50-150 random coding sessions and show you a demo wrapped.

## 📖 Usage

### Using Real Claude Code Data (Recommended!)

The easiest way to get your wrapped is to use your actual Claude Code session data:

```bash
# Generate wrapped for current year
npm run real

# Generate for specific year
node src/realWrapped.js 2024
```

This automatically parses your Claude Code logs stored in `~/.claude/projects/` and generates statistics from your actual usage!

### Using Manual Data Collection (Alternative)

To manually track sessions and customize data collection, integrate the data collector into your workflow:

```javascript
const DataCollector = require('./src/collector');

const collector = new DataCollector();

// Record a coding session
collector.recordSession({
  messageCount: 25,
  filesModified: ['src/app.js', 'src/utils.js'],
  filesCreated: ['src/newFeature.js'],
  linesAdded: 150,
  linesRemoved: 45,
  toolCalls: ['Read', 'Write', 'Edit', 'Bash'],
  languages: ['JavaScript', 'TypeScript'],
  project: 'my-awesome-project'
});
```

### Generating Your Wrapped

Once you have data collected, generate your wrapped:

```bash
# Generate for current year (both terminal and HTML)
npm run wrapped

# Or use the CLI directly
node src/wrapped.js

# Generate for specific year
node src/wrapped.js 2024

# Terminal only
node src/wrapped.js --terminal

# HTML only
node src/wrapped.js --html

# Custom output directory
node src/wrapped.js --html --output ./my-wrapped
```

## 📊 Statistics Tracked

- **Total Sessions**: Number of coding sessions
- **Messages Sent**: Total messages sent to Claude
- **Files Modified**: Number of files you edited
- **Files Created**: Number of new files created
- **Lines Added/Removed**: Total code changes
- **Tool Usage**: Which tools you used most (Read, Write, Edit, etc.)
- **Language Statistics**: Your programming language usage
- **Project Statistics**: Time spent on different projects
- **Activity Patterns**: When you code most (daily and hourly)
- **Streaks**: Your longest and current coding streaks

## 🏆 Achievements

Unlock achievements based on your activity:

- **🏆 Code Maestro**: Modify over 10,000 lines of code
- **🔥 Power User**: Complete 100+ coding sessions
- **⚡ On Fire**: Achieve a 7+ day streak
- **🌙 Night Owl**: Code frequently after midnight
- **🌅 Early Bird**: Code in the early morning hours
- **🛠️ Tool Master**: Use 10+ different tools

## 🎨 Visualization Examples

### Terminal Display
Beautiful, colorful statistics right in your terminal with:
- Color-coded statistics
- Achievement badges
- Progress indicators
- Emoji highlights

### HTML Visualization
Stunning, scrollable web experience featuring:
- Gradient backgrounds
- Smooth animations
- Full-screen slides
- Interactive navigation (scroll or arrow keys)
- Mobile responsive design

## 🔧 Integration with Claude Code

### Option 1: Manual Tracking

Create a helper script that you run after each coding session:

```javascript
// log-session.js
const DataCollector = require('./src/collector');
const collector = new DataCollector();

// Customize with your actual stats
collector.recordSession({
  messageCount: process.argv[2] || 10,
  filesModified: ['file1.js', 'file2.js'],
  languages: ['JavaScript'],
  project: process.cwd().split('/').pop()
});

console.log('✅ Session logged!');
```

Run it after coding:
```bash
node log-session.js 25
```

### Option 2: Automated Tracking

Integrate with your development tools:
- Git hooks to track commits
- Editor plugins to track file changes
- CI/CD integration for deployment tracking

### Option 3: Parse Claude Code Logs

If Claude Code keeps logs, you can parse them:

```javascript
// parse-logs.js
const fs = require('fs');
const DataCollector = require('./src/collector');

// Read and parse your Claude Code logs
// Extract relevant statistics
// Record sessions automatically
```

## 📁 Project Structure

```
claude-code-wrapped/
├── src/
│   ├── models/
│   │   └── WrappedData.js      # Data model for statistics
│   ├── collector.js             # Session data collection
│   ├── generator.js             # Wrapped generation logic
│   ├── terminal-display.js      # Terminal visualization
│   ├── wrapped.js               # Main CLI
│   └── demo.js                  # Demo with sample data
├── data/                        # Stored session data (gitignored)
├── output/                      # Generated wrapped files (gitignored)
├── package.json
└── README.md
```

## 🛠️ API Reference

### DataCollector

```javascript
const collector = new DataCollector(dataPath);

// Record a session
collector.recordSession({
  messageCount: number,
  filesModified: string[],
  filesCreated: string[],
  linesAdded: number,
  linesRemoved: number,
  toolCalls: string[],
  languages: string[],
  project: string
});

// Get sessions by year
collector.getSessionsByYear(2024);

// Clear all data
collector.clearSessions();
```

### WrappedGenerator

```javascript
const generator = new WrappedGenerator(year);

// Generate wrapped data
const wrapped = generator.generate();

// Generate and save JSON
const { wrapped, filename } = generator.generateAndSave('./output');

// Generate HTML visualization
const htmlFile = generator.generateHTML('./output');
```

### TerminalDisplay

```javascript
const display = new TerminalDisplay();

// Display wrapped in terminal
display.display(wrappedData);
```

## 🤝 Contributing

Contributions are welcome! Feel free to:

- Add new statistics tracking
- Improve visualizations
- Add new achievement types
- Enhance the UI/UX
- Fix bugs

## 📝 License

MIT License - see LICENSE file for details

## 💡 Tips

1. **Regular Tracking**: Record sessions regularly for accurate statistics
2. **Consistent Format**: Use consistent project names and language identifiers
3. **Multiple Years**: Track data across years to see your growth
4. **Share**: Export your wrapped HTML and share your coding journey!

## 🎯 Future Enhancements

- [ ] PDF export
- [ ] Social media sharing cards
- [ ] Year-over-year comparisons
- [ ] Team/collaboration statistics
- [ ] Integration with GitHub/GitLab
- [ ] Real-time dashboard
- [ ] Custom themes for HTML visualization
- [ ] More detailed language analytics
- [ ] Code complexity metrics

## 📧 Support

Having issues? Found a bug? Have a suggestion?

- Open an issue on GitHub
- Check existing documentation
- Run the demo to test functionality

---

Made with ❤️ for Claude Code users

**Happy Coding! 🚀**
