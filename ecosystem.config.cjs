module.exports = {
  apps: [
    {
      name: "enjoyfreedeals-api",
      script: "src/server.js",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        APP_ENV: "production",
        PORT: process.env.PORT || 5000
      }
    }
  ]
};
