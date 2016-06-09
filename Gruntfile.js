module.exports = function(grunt) {
  'use strict';

  grunt.loadNpmTasks('grunt-express');

  grunt.initConfig({
    express: {
      main: {
        options: {
          hostname: 'localhost',
          port: 4202,
          server: 'app.js'
        }
      }
    }
  });

  grunt.registerTask('serve', [
    'express',
    'express-keepalive'
  ]);
};