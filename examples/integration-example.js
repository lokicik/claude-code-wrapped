#!/usr/bin/env node

/**
 * Example: How to integrate Claude Code Wrapped into your workflow
 *
 * This script shows different ways to track your coding sessions
 */

const DataCollector = require('../src/collector');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Initialize collector
const collector = new DataCollector();

/**
 * Example 1: Simple manual logging
 */
function logSimpleSession() {
  collector.recordSession({
    messageCount: 15,
    filesModified: ['src/app.js'],
    filesCreated: [],
    linesAdded: 50,
    linesRemoved: 20,
    toolCalls: ['Read', 'Edit', 'Bash'],
    languages: ['JavaScript'],
    project: 'my-project'
  });

  console.log('✅ Simple session logged!');
}

/**
 * Example 2: Extract data from git
 */
function logFromGit() {
  try {
    // Get recent commits
    const commits = execSync('git log --since="1 day ago" --oneline')
      .toString()
      .trim()
      .split('\n')
      .filter(line => line.length > 0);

    // Get changed files
    const changedFiles = execSync('git diff --name-only HEAD~1')
      .toString()
      .trim()
      .split('\n')
      .filter(line => line.length > 0);

    // Get stats
    const stats = execSync('git diff --stat HEAD~1')
      .toString()
      .match(/(\d+) insertion.*?(\d+) deletion/);

    const linesAdded = stats ? parseInt(stats[1]) : 0;
    const linesRemoved = stats ? parseInt(stats[2]) : 0;

    // Detect languages from file extensions
    const languages = new Set();
    changedFiles.forEach(file => {
      const ext = path.extname(file).slice(1);
      const langMap = {
        js: 'JavaScript',
        ts: 'TypeScript',
        py: 'Python',
        go: 'Go',
        rs: 'Rust',
        java: 'Java'
      };
      if (langMap[ext]) languages.add(langMap[ext]);
    });

    collector.recordSession({
      messageCount: commits.length * 5, // Estimate
      filesModified: changedFiles,
      filesCreated: [],
      linesAdded,
      linesRemoved,
      toolCalls: ['Edit', 'Bash', 'Write'],
      languages: Array.from(languages),
      project: path.basename(process.cwd())
    });

    console.log('✅ Session logged from git history!');
  } catch (error) {
    console.error('❌ Error reading git data:', error.message);
  }
}

/**
 * Example 3: Interactive logging
 */
function logInteractive() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const session = {};

  rl.question('How many messages did you send? ', (answer) => {
    session.messageCount = parseInt(answer) || 0;

    rl.question('How many files did you modify? ', (answer) => {
      session.filesModified = Array(parseInt(answer) || 0).fill('file.js');

      rl.question('Approximate lines added? ', (answer) => {
        session.linesAdded = parseInt(answer) || 0;

        rl.question('Approximate lines removed? ', (answer) => {
          session.linesRemoved = parseInt(answer) || 0;

          rl.question('Primary language? ', (answer) => {
            session.languages = [answer || 'JavaScript'];
            session.toolCalls = ['Read', 'Edit', 'Write'];
            session.project = path.basename(process.cwd());
            session.filesCreated = [];

            collector.recordSession(session);
            console.log('\n✅ Session logged successfully!');
            rl.close();
          });
        });
      });
    });
  });
}

/**
 * Example 4: Watch file system changes
 */
function watchAndLog() {
  const watchPath = process.cwd();
  let filesChanged = new Set();
  let sessionActive = true;

  console.log(`👀 Watching ${watchPath} for changes...`);
  console.log('Press Ctrl+C to stop and log session.\n');

  fs.watch(watchPath, { recursive: true }, (eventType, filename) => {
    if (filename && !filename.includes('node_modules') && !filename.includes('.git')) {
      filesChanged.add(filename);
      console.log(`📝 Modified: ${filename}`);
    }
  });

  process.on('SIGINT', () => {
    if (sessionActive) {
      sessionActive = false;

      const languages = new Set();
      Array.from(filesChanged).forEach(file => {
        const ext = path.extname(file).slice(1);
        const langMap = {
          js: 'JavaScript',
          ts: 'TypeScript',
          py: 'Python',
          go: 'Go',
          rs: 'Rust'
        };
        if (langMap[ext]) languages.add(langMap[ext]);
      });

      collector.recordSession({
        messageCount: Math.floor(filesChanged.size * 2),
        filesModified: Array.from(filesChanged),
        filesCreated: [],
        linesAdded: filesChanged.size * 10, // Estimate
        linesRemoved: filesChanged.size * 5, // Estimate
        toolCalls: ['Edit', 'Write', 'Read'],
        languages: Array.from(languages),
        project: path.basename(process.cwd())
      });

      console.log('\n✅ Session logged with', filesChanged.size, 'file changes!');
      process.exit(0);
    }
  });
}

// CLI
const command = process.argv[2];

switch (command) {
  case 'simple':
    logSimpleSession();
    break;
  case 'git':
    logFromGit();
    break;
  case 'interactive':
    logInteractive();
    break;
  case 'watch':
    watchAndLog();
    break;
  default:
    console.log(`
Claude Code Wrapped - Integration Examples

Usage:
  node examples/integration-example.js <command>

Commands:
  simple       Log a simple session manually
  git          Extract and log data from git history
  interactive  Interactively log a session
  watch        Watch file changes and log on exit

Examples:
  node examples/integration-example.js simple
  node examples/integration-example.js git
  node examples/integration-example.js interactive
  node examples/integration-example.js watch
    `);
}
