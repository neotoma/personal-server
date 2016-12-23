require('./lib/env');

module.exports = function(grunt) {
  'use strict';

  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    express: {
      main: {
        options: {
          script: './app.js'
        }
      }
    },
    watch: {
      express: {
        files: ['**/*.js'],
        tasks: ['express:main'],
        options: {
          spawn: false
        }
      }
    },
    rsync: {
      options: {
        host: process.env.PERSONAL_SERVER_DEPLOY_USERNAME + '@' + process.env.PERSONAL_SERVER_DEPLOY_HOST,
        recursive: true
      },
      env: {
        options: {
          args: ['--rsync-path="mkdir -p ' + process.env.PERSONAL_SERVER_DEPLOY_DIR + ' && rsync"'],
          src: '.env-deploy',
          dest: process.env.PERSONAL_SERVER_DEPLOY_DIR + '/.env',
        }
      },
      app: {
        options: {
          exclude: [
            ".env*",
            ".DS_Store",
            ".git*",
            "data",
            "node_modules",
            "*.sublime*"
          ],
          args: ['--rsync-path="mkdir -p ' + process.env.PERSONAL_SERVER_DEPLOY_DIR + ' && rsync"'],
          src: './',
          dest: process.env.PERSONAL_SERVER_DEPLOY_DIR
        }
      },
      data: {
        options: {
          args: ['-v --rsync-path="mkdir -p ' + process.env.PERSONAL_SERVER_DEPLOY_DATA_DIR + ' && rsync"'],
          src: process.env.PERSONAL_SERVER_DATA_DIR + '/',
          dest: process.env.PERSONAL_SERVER_DEPLOY_DATA_DIR
        }
      }
    },
    sshexec: {
      options: {
        host: process.env.PERSONAL_SERVER_DEPLOY_HOST,
        port: 22,
        username: process.env.PERSONAL_SERVER_DEPLOY_USERNAME,
        agent: process.env.SSH_AUTH_SOCK
      },
      npmInstall: {
        command: 'cd ' + process.env.PERSONAL_SERVER_DEPLOY_DIR + ' && npm install --production'
      },
      deleteData: {
        command: 'rm -rf ' + process.env.PERSONAL_SERVER_DEPLOY_DATA_DIR
      },
      forever: {
        command: 'cd ' + process.env.PERSONAL_SERVER_DEPLOY_DIR + ' && forever restart app.js || forever start app.js'
      },
      systemd: {
        command: 'sudo systemctl restart personalserver || sudo systemctl start personalserver'
      }
    }
  });

  grunt.registerTask('dev', 'Run app locally and reload upon changes', [
    'express:main',
    'watch'
  ]);

  grunt.registerTask('deploy', 'Deploy dependencies and app', [
    'deploy-dependencies',
    'deploy-app'
  ]);

  grunt.registerTask('deploy-dependencies', 'Deploy dependencies', [
    'rsync:env'
  ]);

  grunt.registerTask('deploy-app', 'Deploy app and install packages remotely', [
    'rsync:app',
    'sshexec:npmInstall'
  ]);

  grunt.registerTask('deploy-data', [
    'sshexec:deleteData',
    'rsync:data'
  ]);

  grunt.registerTask('forever', 'Start or restart remotely with forever', [
    'sshexec:forever'
  ]);

  grunt.registerTask('systemd', 'Start or restart remotely with systemd', [
    'sshexec:systemd'
  ]);
};