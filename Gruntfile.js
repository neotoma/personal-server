/**
 * Configure Grunt scripts
 * @module
 */

require('park-ranger')();
var loadGruntTasks = require('load-grunt-tasks');

module.exports = function(grunt) {
  'use strict';

  grunt.initConfig({
    nodemon: {
      main: {
        script: 'index.js'
      }
    },
    symlink: {
      modules: {
        files: [{
          expand: true,
          cwd: './',
          src: ['app'],
          dest: 'node_modules'
        }]
      }
    }
  });

  loadGruntTasks(grunt);
};