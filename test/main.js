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

        String(file.contents).should.containEql("/* No files to import found in non-existent/**/*.css */");
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
