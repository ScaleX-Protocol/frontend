#!/bin/bash

# ScaleX Deposit Functionality Test Runner
# This script runs the Playwright tests for the deposit functionality

set -e

echo "🚀 Starting ScaleX Deposit Functionality Tests"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Check if Playwright is installed
if ! npx playwright --version &> /dev/null; then
    echo "📦 Installing Playwright..."
    npx playwright install
    npx playwright install-deps
fi

# Check if the development server is running
echo "🔍 Checking if development server is running..."
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ Development server is not running on http://localhost:3000"
    echo "Please start the development server with:"
    echo "  npm run dev"
    echo ""
    echo "Then run this test script again."
    exit 1
fi

echo "✅ Development server is running"

# Create test results directory
mkdir -p test-results

# Run the deposit tests
echo "🧪 Running deposit functionality tests..."
npx playwright test tests/deposit-playwright.spec.ts --reporter=list

# Check test results
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ All deposit tests passed!"
    echo "📊 Test results available in test-results/"
    echo ""
    echo "To view detailed HTML report:"
    echo "  npx playwright show-report test-results/html-report"
else
    echo ""
    echo "❌ Some deposit tests failed!"
    echo "📊 Check the test results in test-results/ for details"
    echo ""
    echo "To view detailed HTML report:"
    echo "  npx playwright show-report test-results/html-report"
    exit 1
fi