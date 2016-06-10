module.exports = function(grunt) {
  'use strict';

  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    express: {
      dev: {
        options: {
          script: './app.js'
        }
      }
    },
    watch: {
      express: {
        files: ['**/*.js'],
        tasks: ['express:dev'],
        options: {
          spawn: false
        }
      }
    }
  });

  grunt.registerTask('default', [
    'express:dev',
    'watch'
  ]);
};