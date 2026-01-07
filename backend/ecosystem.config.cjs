module.exports = {
    apps: [
        {
            name: 'setukpa-api',
            script: 'dist/server.js',

            // Cluster mode - uses all available CPU cores
            instances: 'max',  // or specify number: 4
            exec_mode: 'cluster',

            // Environment
            env: {
                NODE_ENV: 'development',
                PORT: 3001,
            },
            env_production: {
                NODE_ENV: 'production',
                PORT: 3001,
            },

            // Restart behavior
            max_memory_restart: '500M',
            restart_delay: 3000,
            max_restarts: 10,

            // Logging
            log_file: './logs/pm2-combined.log',
            error_file: './logs/pm2-error.log',
            out_file: './logs/pm2-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            merge_logs: true,

            // Monitoring
            watch: false,  // Disable in production
            ignore_watch: ['node_modules', 'logs', 'uploads'],

            // Graceful shutdown
            kill_timeout: 5000,
            wait_ready: true,
            listen_timeout: 10000,
        }
    ],

    // Deployment configuration (optional)
    deploy: {
        production: {
            user: 'deploy',
            host: 'your-server.com',
            ref: 'origin/main',
            repo: 'git@github.com:your-repo/setukpa.git',
            path: '/var/www/setukpa',
            'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.cjs --env production',
        }
    }
};
