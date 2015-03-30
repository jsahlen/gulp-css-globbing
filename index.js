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

  var autoReplaceBlockDefaults = {
    onOff: false,
    globBlockBegin: 'cssGlobbingBegin',
    globBlockEnd: 'cssGlobbingEnd',
    globBlockContents: '../**/*.scss'
  };

  var scssImportPathDefaults = {
    leading_underscore: true,
    filename_extension: true
  };

  if (!options.autoReplaceBlock) options.autoReplaceBlock = autoReplaceBlockDefaults;

  if (!options.scssImportPath) options.scssImportPath = scssImportPathDefaults;

  if (typeof options.extensions == 'string') options.extensions = [options.extensions];

  if (!(options.extensions instanceof Array)) {
    throw new gutil.PluginError(PLUGIN_NAME, 'extensions needs to be a string or an array');
  }

  if (typeof options.ignoreFolders == 'string') options.ignoreFolders = [options.ignoreFolders];

  if (!(options.ignoreFolders instanceof Array)) {
    throw new gutil.PluginError(PLUGIN_NAME, 'ignore-folders needs to be a string or an array');
  }
  if (options.autoReplaceBlock === true){
    options.autoReplaceBlock = autoReplaceBlockDefaults;
    options.autoReplaceBlock.onOff = true
  }

  if (!(options.autoReplaceBlock instanceof Object)) {
    throw new gutil.PluginError(PLUGIN_NAME, 'auto-replace block needs to be an object');
  } else {
    if (!options.autoReplaceBlock.globBlockBegin) options.autoReplaceBlock.globBlockBegin = autoReplaceBlockDefaults.globBlockBegin;
    if (!options.autoReplaceBlock.globBlockEnd) options.autoReplaceBlock.globBlockEnd = autoReplaceBlockDefaults.globBlockEnd;
    if (!options.autoReplaceBlock.globBlockContents) options.autoReplaceBlock.globBlockContents = autoReplaceBlockDefaults.globBlockContents;
  }

  if (!(options.scssImportPath instanceof Object)) {
    throw new gutil.PluginError(PLUGIN_NAME, 'scss import path needs to be an object');
  } else {
    if (typeof options.scssImportPath.leading_underscore === 'undefined') options.scssImportPath.leading_underscore = scssImportPathDefaults.leading_underscore;
    if (typeof options.scssImportPath.filename_extension === 'undefined') options.scssImportPath.filename_extension = scssImportPathDefaults.filename_extension;
  }

  return map(function(code, filename) {

    var content = code.toString();
    var semicolon = path.extname(filename).indexOf('.sass') !== -1 ? '' : ';';
    var importRegExp = /^\s*@import\s+((?:url\()?["']?)?([^"'\)]+)(['"]?(?:\))?)?;?\s*$/gm;
    var globRegExp = /\/\*/;
    var files;

    if (options.autoReplaceBlock.onOff){
      var regexstring = '\/\/ '+options.autoReplaceBlock.globBlockBegin+'[\\s\\S]*?'+options.autoReplaceBlock.globBlockEnd;
      var regexp = new RegExp(regexstring,'gm');

      content = content.replace(regexp, function(result, prefix, filePattern, suffix) {
        result = '// '+options.autoReplaceBlock.globBlockBegin+'\n';
        result += '@import \''+options.autoReplaceBlock.globBlockContents+'\'' + semicolon + '\n';
        result += '// '+options.autoReplaceBlock.globBlockEnd
        return result;
      });

    }

    content = content.replace(importRegExp, function(result, prefix, filePattern, suffix) {
      files = [];

      if (globRegExp.exec(filePattern)) {
        glob.sync(filePattern, { cwd: path.dirname(filename) }).forEach(function(foundFilePath) {
          if ((options.extensions.indexOf(path.extname(foundFilePath)) !== -1)&&(options.ignoreFolders.indexOf(path.dirname(foundFilePath))) == -1) {

            var foundFilename = path.basename(foundFilePath);
            var foundFileDirname = path.dirname(foundFilePath);

            if (!options.scssImportPath.filename_extension) {
              foundFilename = path.basename(foundFilename,path.extname(foundFilename));
            }

            if (!options.scssImportPath.leading_underscore) {
              foundFilename = foundFilename.replace(/^_/,'');
            }

            foundFilePath = path.join(foundFileDirname,foundFilename).replace(new RegExp('\\' + path.sep, 'g'), '/');

            files.push(foundFilePath);
          }
        });

        if (files.length) {
          result = '';

          files.forEach(function(foundFilePath) {
            result += '@import ' + prefix + foundFilePath + suffix + semicolon + '\n';
          });
        } else {
          result = '/* No files to import found in ' + filePattern.replace(/\//g,'\//') + ' */';
        }
      }

      return result;
    });

    return content;
  });
};

module.exports = cssGlobbingPlugin;
