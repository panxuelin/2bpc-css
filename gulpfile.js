// require
var fs = require('fs');
var path = require('path');
var gulp = require('gulp');
var gutil = require('gulp-util');
var plumber = require('gulp-plumber');
var rubySass = require('gulp-ruby-sass');
var nodeSass = require('gulp-sass-china');
var through = require('through2');
var optimist = require('optimist');
var qdoc = require('q-doc');
var combineScss = require('./gulp/combineScss.js');
var versions = require('./gulp/versions.js');
var hanlders = require('./gulp/hanlders.js');
var browserSync = require('browser-sync').create();

// style path，由业务自己配置
var scssPath = './scss/bussiness';
var cssPath = './css';

// 编译器
var compilers = {
    'node-sass': function(scssPath, cssPath) {
        return gulp.src(scssPath + '/*.scss')
            .pipe(plumber({
                errorHandler: hanlders.error
            }))
            .pipe(through.obj(combineScss))
            .pipe(nodeSass({
                outputStyle: 'expanded'
            }))
            .pipe(gulp.dest(cssPath))
            .on('end', hanlders.end);
    },
    'sass': function(scssPath, cssPath) {
        return rubySass(scssPath + '/*.scss', {
                style: 'expanded'
            })
            .pipe(plumber({
                errorHandler: hanlders.error
            }))
            .pipe(gulp.dest(cssPath))
            .on('end', hanlders.end);
    }
};

// 命令: gulp compile, 进行node-sass编译 [-c node-sass/sass]
gulp.task('compile', function() {
    var argv = optimist.argv,
        compiler = argv.c || argv.compiler || require('./package.json').compiler;

    if (compilers[compiler]) {
        gutil.log(gutil.colors.yellow('使用编译器 ' + compiler + ' 编译...'));
        gutil.log(gutil.colors.green('版本为 ' + versions[compiler]));
        return compilers[compiler](scssPath, cssPath);
    } else {
        gutil.log(gutil.colors.red('找不到编译器 ' + compiler));
    }
});

// 命令: gulp watch, 监听工程中scss文件变化时，执行compile操作 [-c node-sass/sass]
gulp.task('watch', function() {
    gulp.watch('./scss/**/*.scss', ['compile']);
});

// 命令: gulp clear, 清理 ruby sass 编译时产生的缓存
gulp.task('clear', function() {
    rubySass.clearCache();
});

// 命令: gulp version, 获取Yo、Sass和Node-sass的版本信息
gulp.task('version', function() {
    // gutil.log(gutil.colors.green('Yo: ' + versions.yo));
    gutil.log(gutil.colors.green('Sass: ' + versions.sass));
    gutil.log(gutil.colors.green('Node-sass: ' + versions['node-sass']));
});

// 命令: gulp doc, 生成文档
gulp.task('doc', function() {
    return gulp.src('./')
        .pipe(qdoc({
            dest: 'doc',
            template: './gulp/qdoc_template/'
        }));
});

// 命令: gulp uedoc, 生成UED文档
gulp.task('uedoc', function() {
    var conf = require('./gulp/uedocConfig.js');
    conf.dest = 'uedoc';
    return gulp.src('./')
        .pipe(qdoc(conf));
});

// 命令: gulp watch-doc, 监听改变生成文档
gulp.task('watch-doc', function() {
    gulp.watch(['./**/*.scss', './**/*.md'], ['doc']);
});

// 命令: gulp test, 测试任务
gulp.task('test', function() {
    return gulp.src('./scss/test/test.scss')
        .pipe(through.obj(combineScss))
        .pipe(nodeSass({
            outputStyle: 'expanded'
        }))
        .pipe(gulp.dest('./scss/test'));
});

//静态服务器
gulp.task('browser-sync', function () {
    browserSync.init({
        server: {
            baseDir: "./"
        }
    });
    gulp.watch('./html/*/*.html').on('change', browserSync.reload);
    gulp.watch('./css/*.css').on('change', browserSync.reload);
});

gulp.task('default', function() {
    gutil.log('可以使用的命令如下: ');
    fs.readFileSync('./gulpfile.js', 'UTF-8').replace(/\/\/\s命令\:\sgulp\s(\w+)\,\s([^\n]+)/g, function(a, b, c) {
        gutil.log(gutil.colors.green(b), gutil.colors.blue(c));
    });
});
