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
        host: process.env.SERVER_DEPLOY_HOST_USERNAME + '@' + process.env.SERVER_DEPLOY_HOST,
        recursive: true
      },
      app: {
        options: {
          exclude: [
            ".DS_Store",
            ".git*",
            "data",
            "node_modules",
            "*.sublime*"
          ],
          src: './',
          dest: process.env.SERVER_DEPLOY_HOST_DIR
        }
      },
      data: {
        options: {
          src: '"' + process.env.SERVER_DATA_DIR + '"',
          dest: '"' + process.env.SERVER_DEPLOY_HOST_DIR + '"'
        }
      }
    },
    sshexec: {
      options: {
        host: process.env.SERVER_DEPLOY_HOST,
        port: 22,
        username: process.env.SERVER_DEPLOY_HOST_USERNAME,
        agent: process.env.SSH_AUTH_SOCK
      },
      npmInstall: {
        command: 'cd ' + process.env.SERVER_DEPLOY_HOST_DIR + ' && npm install --production'
      },
      foreverRestartAll: {
        command: 'cd ' + process.env.SERVER_DEPLOY_HOST_DIR + ' && forever restartall'
      },
      deleteData: {
        command: 'cd ' + process.env.SERVER_DEPLOY_HOST_DIR + ' && rm -Rf data'
      }
    }
  });

  grunt.registerTask('dev', [
    'express:main',
    'watch'
  ]);

  grunt.registerTask('deploy', [
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