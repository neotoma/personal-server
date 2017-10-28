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