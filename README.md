# gulp-css-globbing [![Build Status][travis-image]][travis-url] [![Dependency Status][depstat-image]][depstat-url]
> A Gulp plugin for globbing CSS `@import` statements

Expands CSS `@import` statements containing globs with the full paths. Useful with pre-processors like Sass.

Heavily inspired by [`sass-globbing`](https://github.com/chriseppstein/sass-globbing)

## Install

Install `gulp-css-globbing` as a development dependency using npm:

```shell
npm install --save-dev gulp-css-globbing
```

## Usage

```javascript
var cssGlobbing = require('gulp-css-globbing');

gulp.task('css', function(){
  gulp.src(['src/styles.css'])
    .pipe(cssGlobbing())
    .pipe(gulp.dest('build/styles.css'));
});
```

Given a CSS file that looks like this:

```css
@import url('components/*.css');

body {
  background: white;
}
```

The plugin would produce the following:

```css
@import url('components/flex-embed.css');
@import url('components/media.css');

body {
  background: white;
}
```

Globbing is relative to the source file's path.


## Options

`gulp-css-globbing` can be called with an options object:

```javascript
gulp.task('css', function(){
  gulp.src(['src/styles.css'])
    .pipe(cssGlobbing({
      extensions: ['.css', '.scss'],
      ignoreFolders: ['../styles'],
      autoReplaceBlock: {
        onOff: false,
        globBlockBegin: 'cssGlobbingBegin',
        globBlockEnd: 'cssGlobbingEnd',
        globBlockContents: '../**/*.scss'
      }
    }))
    .pipe(gulp.dest('build/styles.css'));
});
```

### extensions
Type: `String` or `Array`

The file extensions to treat as valid imported files. If files are found that match the glob, but its extensions don't match this option, they will not be added to the resulting file.

Default: `['.css']`

### ignoreFolders
Type: `String` or `Array`

Folders gulp-css-globbing should ignore. Each folder should be relative to the source file.

Default: `['']`

### autoReplaceBlock
Type: `String` or `Object`

Search for a block of text which is replaced with the path to the files we want to glob. Path can be re-replaced each time we call gulp-css-globbing.

Default: `{
        onOff: false,
        globBlockBegin: 'cssGlobbingBegin',
        globBlockEnd: 'cssGlobbingEnd',
        globBlockContents: '../**/*.scss'
      }`

With the above settings, inside of your main .scss file you would only need to have this:
```
// cssGlobbingBegin
// this line can be blank
// cssGlobbingEnd
```


[travis-url]: https://travis-ci.org/jsahlen/gulp-css-globbing
[travis-image]: https://travis-ci.org/jsahlen/gulp-css-globbing.svg?branch=master
[depstat-url]: https://david-dm.org/jsahlen/gulp-css-globbing
[depstat-image]: https://david-dm.org/jsahlen/gulp-css-globbing.svg
