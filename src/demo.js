#!/usr/bin/env node

const DataCollector = require('./collector');
const WrappedGenerator = require('./generator');
const TerminalDisplay = require('./terminal-display');

/**
 * Demo script to generate sample data and display wrapped
 */

function generateSampleData() {
  console.log('🎲 Generating sample data...\n');

  const collector = new DataCollector();

  // Clear existing data
  collector.clearSessions();

  const languages = ['JavaScript', 'Python', 'TypeScript', 'Go', 'Rust', 'Java'];
  const projects = ['web-app', 'api-server', 'mobile-app', 'cli-tool', 'data-pipeline'];
  const tools = ['Read', 'Write', 'Edit', 'Bash', 'Grep', 'Glob', 'Task'];

  const year = new Date().getFullYear();

  // Generate sessions throughout the year
  const numSessions = 50 + Math.floor(Math.random() * 100); // 50-150 sessions

  for (let i = 0; i < numSessions; i++) {
    // Random date throughout the year
    const month = Math.floor(Math.random() * 12);
    const day = Math.floor(Math.random() * 28) + 1;
    const hour = Math.floor(Math.random() * 24);

    const date = new Date(year, month, day, hour);

    // Random session data
    const session = {
      timestamp: date.toISOString(),
      date: date.toISOString().split('T')[0],
      messageCount: 5 + Math.floor(Math.random() * 50),
      filesModified: generateRandomArray(3, 15, 'file'),
      filesCreated: generateRandomArray(0, 5, 'newfile'),
      linesAdded: Math.floor(Math.random() * 500),
      linesRemoved: Math.floor(Math.random() * 300),
      toolCalls: generateRandomTools(tools, 5, 20),
      languages: generateRandomLanguages(languages, 1, 3),
      project: projects[Math.floor(Math.random() * projects.length)]
    };

    collector.recordSession(session);
  }

  console.log(`✅ Generated ${numSessions} sample sessions for ${year}\n`);
}

function generateRandomArray(min, max, prefix) {
  const count = min + Math.floor(Math.random() * (max - min));
  return Array.from({ length: count }, (_, i) => `${prefix}_${i}.js`);
}

function generateRandomTools(tools, min, max) {
  const count = min + Math.floor(Math.random() * (max - min));
  return Array.from({ length: count }, () =>
    tools[Math.floor(Math.random() * tools.length)]
  );
}

function generateRandomLanguages(languages, min, max) {
  const count = min + Math.floor(Math.random() * (max - min));
  const selected = new Set();
  while (selected.size < count) {
    selected.add(languages[Math.floor(Math.random() * languages.length)]);
  }
  return Array.from(selected);
}

// Main demo function
function runDemo() {
  try {
    // Generate sample data
    generateSampleData();

    // Generate wrapped
    console.log('📊 Generating wrapped statistics...\n');
    const generator = new WrappedGenerator();
    const wrapped = generator.generate();

    // Display in terminal
    const display = new TerminalDisplay();
    display.display(wrapped);

    // Generate HTML
    console.log('\n🌐 Generating HTML visualization...\n');
    const htmlFile = generator.generateHTML();
    console.log(`✅ HTML wrapped saved to: ${htmlFile}`);

    console.log('\n💡 Open the HTML file in your browser to see the full visualization!\n');
  } catch (error) {
    console.error('❌ Error running demo:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runDemo();
}

module.exports = { generateSampleData, runDemo };
