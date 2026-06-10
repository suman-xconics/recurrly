const baseConfig = require('./app.json')

module.exports = {
  ...baseConfig,
  expo: {
    ...baseConfig.expo,
    extra: {
      posthogProjectToken: process.env.POSTHOG_PROJECT_TOKEN,
      posthogHost: process.env.POSTHOG_HOST,
      "eas": {
        "projectId": "442f377d-b5f1-4397-a8de-9009039a3f7b"
      }
    },
  },
}
