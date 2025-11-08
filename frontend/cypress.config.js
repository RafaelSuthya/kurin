const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL || 'http://localhost:3013',
    supportFile: false,
    video: false,
    screenshotOnRunFailure: true,
    retries: 1,
    defaultCommandTimeout: 8000,
  },
})