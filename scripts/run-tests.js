
#!/usr/bin/env node

import { spawn } from 'child_process';
import { existsSync } from 'fs';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    child.on('error', reject);
  });
}

async function checkPrerequisites() {
  log('🔍 Checking prerequisites...', colors.blue);
  
  if (!process.env.DATABASE_URL && !process.env.TEST_DATABASE_URL) {
    log('❌ DATABASE_URL or TEST_DATABASE_URL must be set', colors.red);
    process.exit(1);
  }

  if (!existsSync('node_modules')) {
    log('📦 Installing dependencies...', colors.yellow);
    await runCommand('npm', ['install']);
  }

  log('✅ Prerequisites check passed', colors.green);
}

async function runMigrations() {
  log('🚀 Running database migrations...', colors.blue);
  try {
    await runCommand('npm', ['run', 'db:migrate']);
    log('✅ Database migrations completed', colors.green);
  } catch (error) {
    log(`❌ Migration failed: ${error.message}`, colors.red);
    throw error;
  }
}

async function runTests() {
  log('🧪 Running comprehensive test suite...', colors.blue);
  
  const testSuites = [
    { name: 'Unit Tests', command: 'npm', args: ['run', 'test:unit'] },
    { name: 'Integration Tests', command: 'npm', args: ['run', 'test:integration'] },
  ];

  let allPassed = true;

  for (const suite of testSuites) {
    try {
      log(`\n${colors.bold}Running ${suite.name}...${colors.reset}`, colors.blue);
      await runCommand(suite.command, suite.args);
      log(`✅ ${suite.name} passed`, colors.green);
    } catch (error) {
      log(`❌ ${suite.name} failed`, colors.red);
      allPassed = false;
    }
  }

  return allPassed;
}

async function generateCoverageReport() {
  log('\n📊 Generating coverage report...', colors.blue);
  try {
    await runCommand('npm', ['run', 'test:coverage']);
    log('✅ Coverage report generated', colors.green);
  } catch (error) {
    log(`⚠️  Coverage report generation failed: ${error.message}`, colors.yellow);
  }
}

async function main() {
  try {
    log(`${colors.bold}🛡️  Privacy Guard - Test Suite Runner${colors.reset}`, colors.blue);
    log('==========================================\n');

    await checkPrerequisites();
    await runMigrations();
    
    const testsPassed = await runTests();
    
    if (testsPassed) {
      await generateCoverageReport();
      log(`\n${colors.bold}🎉 All tests passed successfully!${colors.reset}`, colors.green);
      process.exit(0);
    } else {
      log(`\n${colors.bold}❌ Some tests failed. Please review the output above.${colors.reset}`, colors.red);
      process.exit(1);
    }
    
  } catch (error) {
    log(`\n${colors.bold}💥 Test execution failed: ${error.message}${colors.reset}`, colors.red);
    process.exit(1);
  }
}

main();
