'use strict';

var gutil = require('gulp-util');
var glob = require('glob');
var map = require('vinyl-map');

var path = require('path');

// Constants
var PLUGIN_NAME = 'gulp-css-globbing';

var cssGlobbingPlugin = function(options) {
  if (!options) options = {};
  if (!options.extensions) options.extensions = ['.css'];
  if (!options.ignoreFolders) options.ignoreFolders = [''];

  if (typeof options.extensions == 'string') options.extensions = [options.extensions];

  if (!(options.extensions instanceof Array)) {
    throw new gutil.PluginError(PLUGIN_NAME, 'extensions needs to be a string or an array');
  }

  if (typeof options.ignoreFolders == 'string') options.ignoreFolders = [options.ignoreFolders];

  if (!(options.ignoreFolders instanceof Array)) {
    throw new gutil.PluginError(PLUGIN_NAME, 'ignore-folders needs to be a string or an array');
  }

  return map(function(code, filename) {
    var content = code.toString();
    var importRegExp = /^\s*@import\s+((?:url\()?["']?)?([^"'\)]+)(['"]?(?:\))?)?;\s*$/gm;
    var globRegExp = /\/\*/;
    var files;

    content = content.replace(importRegExp, function(result, prefix, filePattern, suffix) {
      files = [];

      if (globRegExp.exec(filePattern)) {
        glob.sync(filePattern, { cwd: path.dirname(filename) }).forEach(function(foundFilename) {
          if ((options.extensions.indexOf(path.extname(foundFilename)) !== -1)&&(options.ignoreFolders.indexOf(path.dirname(foundFilename)))) {
            files.push(foundFilename);
          }
        });

        if (files.length) {
          result = '';

          files.forEach(function(foundFilename) {
            result += '@import ' + prefix + foundFilename + suffix + ';\n';
          });
        } else {
          result = '/* No files to import found in ' + filePattern + ' */';
        }
      }

      return result;
    });

    return content;
  });
};

module.exports = cssGlobbingPlugin;
