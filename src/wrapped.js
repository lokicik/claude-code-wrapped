#!/usr/bin/env node

const WrappedGenerator = require('./generator');
const TerminalDisplay = require('./terminal-display');

/**
 * Main CLI for Claude Code Wrapped
 */

function printUsage() {
  console.log(`
Claude Code Wrapped - Your Year in Code

Usage:
  node src/wrapped.js [year] [options]

Options:
  --terminal     Display in terminal only
  --html         Generate HTML only
  --output PATH  Specify output directory (default: ./output)
  --help         Show this help message

Examples:
  node src/wrapped.js                    # Generate for current year
  node src/wrapped.js 2024               # Generate for specific year
  node src/wrapped.js --terminal         # Display in terminal only
  node src/wrapped.js --html --output ./my-wrapped
  `);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    year: new Date().getFullYear(),
    terminal: false,
    html: false,
    output: './output',
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      config.help = true;
    } else if (arg === '--terminal') {
      config.terminal = true;
    } else if (arg === '--html') {
      config.html = true;
    } else if (arg === '--output') {
      config.output = args[++i];
    } else if (!isNaN(arg)) {
      config.year = parseInt(arg);
    }
  }

  // If neither terminal nor html specified, do both
  if (!config.terminal && !config.html) {
    config.terminal = true;
    config.html = true;
  }

  return config;
}

function main() {
  const config = parseArgs();

  if (config.help) {
    printUsage();
    process.exit(0);
  }

  try {
    console.log(`\n🎉 Generating Claude Code Wrapped for ${config.year}...\n`);

    const generator = new WrappedGenerator(config.year);

    if (config.terminal) {
      const wrapped = generator.generate();
      const display = new TerminalDisplay();
      display.display(wrapped);
    }

    if (config.html) {
      const htmlFile = generator.generateHTML(config.output);
      console.log(`\n✅ HTML wrapped saved to: ${htmlFile}`);
      console.log('💡 Open the HTML file in your browser to see the full visualization!\n');
    }

  } catch (error) {
    console.error(`\n❌ Error: ${error.message}\n`);

    if (error.message.includes('No data found')) {
      console.log('💡 Tip: Run "npm run demo" to generate sample data first!\n');
    }

    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main, parseArgs };
