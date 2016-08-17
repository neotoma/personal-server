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
    }
  });

  grunt.registerTask('dev', [
    'express:main',
    'watch'
  ]);

  grunt.registerTask('deploy-app', [
    'rsync:app'
  ]);

  grunt.registerTask('deploy-data', [
    'rsync:data'
  ]);

  grunt.registerTask('serve', [
    'express:main'
  ]);
};