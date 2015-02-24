var globbingPlugin = require('../');
var should = require('should');
var File = require('vinyl');
var es = require('event-stream');

var fs = require('fs');
var path = require('path');

var createFile = function(filePath, type) {
  var contents;
  var filePath = path.join(__filename, '..', 'fixtures', filePath);

  if (type == 'stream') {
    contents = fs.createReadStream(filePath);
  } else {
    contents = fs.readFileSync(filePath);
  }

  return new File({
    path: filePath,
    cwd: 'test/',
    base: 'test/fixtures',
    contents: contents
  });
};

describe('gulp-css-globbing', function() {

  describe('in buffer mode', function() {
    it('should leave non-glob @imports alone', function() {
      var file = createFile('example.css');
      var globber = globbingPlugin();

      globber.write(file);
      globber.end();

      globber.once('data', function(file) {
        file.isBuffer().should.be.true;

        String(file.contents).should.containEql("@import url('non-glob.css');");
      });
    });

    it('should replace a url-style @import with single quotes', function() {
      var file = createFile('example.css');
      var globber = globbingPlugin();

      globber.write(file);
      globber.end();

      globber.once('data', function(file) {
        file.isBuffer().should.be.true;

        String(file.contents).should.containEql("@import url('single-quotes/1.css');");
        String(file.contents).should.containEql("@import url('single-quotes/2.css');");
      });
    });

    it('should replace a url-style @import with double quotes', function() {
      var file = createFile('example.css');
      var globber = globbingPlugin();

      globber.write(file);
      globber.end();

      globber.once('data', function(file) {
        file.isBuffer().should.be.true;

        String(file.contents).should.containEql('@import url("double-quotes/1.css");');
        String(file.contents).should.containEql('@import url("double-quotes/2.css");');
      });
    });

    it('should replace a url-style @import without quotes', function() {
      var file = createFile('example.css');
      var globber = globbingPlugin();

      globber.write(file);
      globber.end();

      globber.once('data', function(file) {
        file.isBuffer().should.be.true;

        String(file.contents).should.containEql("@import url(without-quotes/1.css);");
        String(file.contents).should.containEql("@import url(without-quotes/2.css);");
      });
    });

    it('should only look for specified file extensions', function() {
      var file = createFile('example.css');
      var globberWithoutTextFiles = globbingPlugin();

      globberWithoutTextFiles.write(file);
      globberWithoutTextFiles.end();

      globberWithoutTextFiles.once('data', function(file) {
        file.isBuffer().should.be.true;

        String(file.contents).should.not.containEql("@import url('misc/textfile.txt');");
      });

      var globberWithTextFiles = globbingPlugin({ extensions: '.txt' });

      globberWithTextFiles.write(file);
      globberWithTextFiles.end();

      globberWithTextFiles.once('data', function(file) {
        file.isBuffer().should.be.true;

        String(file.contents).should.containEql("@import url('misc/textfile.txt');");
        String(file.contents).should.not.containEql("@import url('single-quotes/1.css');");
      });
    });

    it('should ignore specified folders', function(){
      var file = createFile('example-ignore.scss');
      var globberWithoutIgnoredFolders = globbingPlugin();

      globberWithoutIgnoredFolders.write(file);
      globberWithoutIgnoredFolders.end();

      globberWithoutIgnoredFolders.once('data', function(file) {
        file.isBuffer().should.be.true;

        String(file.contents).should.containEql("@import 'ignore-me/1.css';");
      });

      var globberWithIgnoredFolders = globbingPlugin({ ignoreFolders: 'ignore-me' });

      globberWithIgnoredFolders.write(file);
      globberWithIgnoredFolders.end();

      globberWithIgnoredFolders.once('data', function(file) {
        file.isBuffer().should.be.true;

        String(file.contents).should.not.containEql("@import 'ignore-me/1.css';");
      });
    });

    it('should not remove file extensions or prefix-underscores by default', function() {
      var file = createFile('example-import-path.scss');
      var options = {};
      options.extensions = ['.scss'];
      var globber = globbingPlugin(options);

      globber.write(file);
      globber.end();

      globber.once('data', function(file) {
        file.isBuffer().should.be.true;

        String(file.contents).should.containEql("@import url('scss-import-path/_example.scss');");
        String(file.contents).should.containEql("@import url('scss-import-path/_example_2.scss');");
        String(file.contents).should.containEql("@import url('scss-import-path/__example_3.test.scss');");
        String(file.contents).should.containEql("@import url('scss-import-path/example_4_.test.css.scss');");
      });
    });

    it('should remove file extensions', function() {
      var file = createFile('example-import-path.scss');
      var options = {};
      options.scssImportPath = {
        filename_extension: false
      };
      options.extensions = ['.scss'];
      var globber = globbingPlugin(options);

      globber.write(file);
      globber.end();

      globber.once('data', function(file) {
        file.isBuffer().should.be.true;

        String(file.contents).should.containEql("@import url('scss-import-path/_example');");
        String(file.contents).should.containEql("@import url('scss-import-path/_example_2');");
        String(file.contents).should.containEql("@import url('scss-import-path/__example_3.test');");
        String(file.contents).should.containEql("@import url('scss-import-path/example_4_.test.css');");
      });
    });

    it('should remove prefix-underscores', function() {
      var file = createFile('example-import-path.scss');
      var options = {};
      options.scssImportPath = {
        leading_underscore: false
      };
      options.extensions = ['.scss'];
      var globber = globbingPlugin(options);

      globber.write(file);
      globber.end();

      globber.once('data', function(file) {
        file.isBuffer().should.be.true;

        String(file.contents).should.containEql("@import url('scss-import-path/example.scss');");
        String(file.contents).should.containEql("@import url('scss-import-path/example_2.scss');");
        String(file.contents).should.containEql("@import url('scss-import-path/_example_3.test.scss');");
        String(file.contents).should.containEql("@import url('scss-import-path/example_4_.test.css.scss');");
      });
    });

    it('should remove prefix-underscores and remove file extensions', function() {
      var file = createFile('example-import-path.scss');
      var options = {};
      options.scssImportPath = {
        leading_underscore: false,
        filename_extension: false
      };
      options.extensions = ['.scss'];
      var globber = globbingPlugin(options);

      globber.write(file);
      globber.end();

      globber.once('data', function(file) {
        file.isBuffer().should.be.true;

        String(file.contents).should.containEql("@import url('scss-import-path/example');");
        String(file.contents).should.containEql("@import url('scss-import-path/example_2');");
        String(file.contents).should.containEql("@import url('scss-import-path/_example_3.test');");
        String(file.contents).should.containEql("@import url('scss-import-path/example_4_.test.css');");
      });
    });

    it('should not run auto-replace unless it is turned on ', function(){
      var file = createFile('example-auto-replace.scss');
      var globberWithoutAutoReplace = globbingPlugin();

      globberWithoutAutoReplace.write(file);
      globberWithoutAutoReplace.end();

      globberWithoutAutoReplace.once('data', function(file) {
        file.isBuffer().should.be.true;

        String(file.contents).should.containEql("// on/off test text");
      });

    });

    it('should be able to find the auto-replace block in the specified file', function(){
      var file = createFile('example-auto-replace.scss');
      var globberWithAutoReplace = globbingPlugin({autoReplaceBlock:true});

      globberWithAutoReplace.write(file);
      globberWithAutoReplace.end();

      globberWithAutoReplace.once('data', function(file) {
        file.isBuffer().should.be.true;

        String(file.contents).should.containEql("// cssGlobbingBegin");
        String(file.contents).should.containEql("// cssGlobbingEnd");
      });

    });

    it('should be able to replace the auto-replace block in the specified file', function(){
      var file = createFile('example-auto-replace.scss');
      var options = {}

      options.autoReplaceBlock = {
          onOff:true,
          globBlockContents: '**/*.scss'
      };
      options.extensions = ['.scss','.css'];
      var globberReplaceAutoReplace = globbingPlugin(options);

      globberReplaceAutoReplace.write(file);
      globberReplaceAutoReplace.end();

      globberReplaceAutoReplace.once('data', function(file) {
        file.isBuffer().should.be.true;
        //NATH: you are here, the test is no worky. can't get correct url parameters into test
        String(file.contents).should.not.containEql("// on/off test text");
        String(file.contents).should.not.containEql("../**/*.scss");
        String(file.contents).should.containEql("@import 'example.scss';")
      });

    });

    it('should be able to use different parameters', function(){
      var file = createFile('example-auto-replace.scss');
      var options = {}

      options.autoReplaceBlock = {
          onOff:true,
          globBlockContents: 'scss-sequence/*.scss',
          globBlockBegin: 'cssGlobbingBeginTest',
          globBlockEnd: 'cssGlobbingEndTest'
      };
      options.extensions = ['.scss','.css'];
      var globberReplaceAutoReplace = globbingPlugin(options);

      globberReplaceAutoReplace.write(file);
      globberReplaceAutoReplace.end();

      globberReplaceAutoReplace.once('data', function(file) {
        file.isBuffer().should.be.true;
        //NATH: you are here, the test is no worky. can't get correct url parameters into test
        String(file.contents).should.not.containEql("// parameters-test");
        String(file.contents).should.not.containEql("../**/*.scss");
        String(file.contents).should.containEql("@import 'scss-sequence/1.scss';")
      });

    });

    it('should replace a url-less @import in an scss file', function() {
      var file = createFile('example.scss');
      var globber = globbingPlugin({ extensions: '.scss' });

      globber.write(file);
      globber.end();

      globber.once('data', function(file) {
        file.isBuffer().should.be.true;

        String(file.contents).should.containEql("@import 'scss-single-quotes/1.scss';");
        String(file.contents).should.containEql("@import 'scss-single-quotes/2.scss';");
        String(file.contents).should.containEql('@import "scss-double-quotes/1.scss";');
        String(file.contents).should.containEql('@import "scss-double-quotes/2.scss";');
      });
    });

    it('should replace with a comment when no files are found', function() {
      var file = createFile('example.css');
      var globber = globbingPlugin();

      globber.write(file);
      globber.end();

      globber.once('data', function(file) {
        file.isBuffer().should.be.true;

        String(file.contents).should.containEql("/* No files to import found in non-existent//**//*.css */");
      });
    });

    it('should import if only one file matches the glob', function() {
      var file = createFile('example-one.scss');
      var globber = globbingPlugin({ extensions: '.scss' });

      globber.write(file);
      globber.end();

      globber.once('data', function(file) {
        file.isBuffer().should.be.true;

        String(file.contents).should.eql("@import 'scss-one/1.scss';\n");
      });
    });
    
    it('should import all files in sequence', function() {
      var file = createFile('example-sequence.scss');
      var globber = globbingPlugin({ extensions: '.scss' });

      globber.write(file);
      globber.end();

      globber.once('data', function(file) {
        file.isBuffer().should.be.true;

        String(file.contents).should.eql("@import 'scss-sequence/1.scss';\n@import 'scss-sequence/2.scss';\n@import 'scss-sequence/3.scss';\n@import 'scss-sequence/4.scss';\n@import 'scss-sequence/5.scss';\n");
      });
    });

    it('should support sass syntax', function() {
      var file = createFile('example.sass');
      var globber = globbingPlugin({ extensions: '.sass' });

      globber.write(file);
      globber.end();

      globber.once('data', function(file) {
        file.isBuffer().should.be.true;

        String(file.contents).should.eql("@import \"sass/1.sass\"\n");
      });
    });
  });

  describe('in streaming mode', function() {
    it('should be supported', function() {
      var file = createFile('example.css', 'stream');
      var globber = globbingPlugin();

      globber.write(file);
      globber.end();

      globber.once('data', function(file) {
        file.isStream().should.be.true;

        file.contents.pipe(es.wait(function(err, data) {
          should.not.exist(err);

          String(data).should.containEql("@import url('single-quotes/1.css');");
          String(data).should.containEql("@import url('single-quotes/2.css');");
          String(data).should.containEql('@import url("double-quotes/1.css");');
          String(data).should.containEql('@import url("double-quotes/2.css");');
          String(data).should.containEql("@import url(without-quotes/1.css);");
          String(data).should.containEql("@import url(without-quotes/2.css);");
        }));
      });
    });
  });

});
