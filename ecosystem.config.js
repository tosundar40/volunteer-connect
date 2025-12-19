module.exports = {
  apps: [
    {
      name: 'volunteer-backend',
      cwd: './backend',
      script: 'npm',
      args: 'start',
      watch: false,
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'volunteer-frontend',
      cwd: './frontend',
      script: 'npm',
      args: 'run preview',
      watch: false,
      env_production: {
        NODE_ENV: 'production',
        PORT: 5173
      }
    }
  ]
};
