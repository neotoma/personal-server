require('dotenv').config();

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
      appEnv: {
        options: {
          src: 'deploy.env',
          dest: process.env.PERSONAL_SERVER_DEPLOY_DIR + '/.env',
        }
      },
      app: {
        options: {
          exclude: [
            "*.env",
            ".DS_Store",
            ".git*",
            "data",
            "node_modules",
            "*.sublime*"
          ],
          src: './',
          dest: process.env.PERSONAL_SERVER_DEPLOY_DIR
        }
      },
      data: {
        options: {
          src: '"' + process.env.PERSONAL_SERVER_DATA_DIR + '"',
          dest: '"' + process.env.PERSONAL_SERVER_DEPLOY_DIR + '"'
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
      foreverRestartAll: {
        command: 'cd ' + process.env.PERSONAL_SERVER_DEPLOY_DIR + ' && forever restart app.js || forever start app.js'
      },
      deleteData: {
        command: 'cd ' + process.env.PERSONAL_SERVER_DEPLOY_DIR + ' && rm -Rf data'
      }
    }
  });

  grunt.registerTask('dev', [
    'express:main',
    'watch'
  ]);

  grunt.registerTask('deploy', [
    'rsync:appEnv',
    'rsync:app',
    'sshexec:npmInstall',
    'sshexec:foreverRestartAll'
  ]);

  grunt.registerTask('deploy-data', [
    'sshexec:deleteData',
    'rsync:data',
    'sshexec:foreverRestartAll'
  ]);
};