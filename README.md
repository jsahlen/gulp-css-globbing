# gulp-css-globbing
> A Gulp plugin for globbing CSS `@import` statements

Expands CSS `@import` statements containing globs with the full paths. Useful with pre-processors like Sass.

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
      extensions: ['.css', '.scss']
    }))
    .pipe(gulp.dest('build/styles.css'));
});
```

### extensions
Type: `String` or `Array`

The file extensions to treat as valid imported files. If files are found that match the glob, but its extensions don't match this option, they will not be added to the resulting file.

Default: `['.css']`
