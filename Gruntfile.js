/*!
 * Grunt file
 *
 * @package LL
 */

/* eslint-env node, es6 */

module.exports = function ( grunt ) {
	var veModules, llModules, modules, k, buildFiles, testFiles,
		prependPaths = require( './build/prependPaths' ),
		moduleUtils = require( './build/moduleUtils' );
	llModules = grunt.file.readJSON( 'build/modules.json' );
	veModules = prependPaths(
		'lib/ve/',
		grunt.file.readJSON( 'lib/ve/build/modules.json' )
	);
	modules = {};
	for ( k in veModules ) {
		modules[ k ] = veModules[ k ];
	}
	for ( k in llModules ) {
		modules[ k ] = llModules[ k ];
	}
	buildFiles = moduleUtils.makeBuildList( modules, [ 'll.build' ] );
	testFiles = moduleUtils.makeBuildList( modules, [ 'll.test' ] ).scripts;

	grunt.loadNpmTasks( 'grunt-banana-checker' );
	grunt.loadNpmTasks( 'grunt-contrib-clean' );
	grunt.loadNpmTasks( 'grunt-contrib-concat' );
	grunt.loadNpmTasks( 'grunt-contrib-watch' );
	grunt.loadNpmTasks( 'grunt-eslint' );
	grunt.loadNpmTasks( 'grunt-karma' );
	grunt.loadNpmTasks( 'grunt-stylelint' );
	grunt.loadNpmTasks( 'grunt-svgmin' );
	grunt.loadNpmTasks( 'grunt-tyops' );
	grunt.loadTasks( 'build/tasks' );

	// We want to use `grunt watch` to start this and karma watch together.
	grunt.renameTask( 'watch', 'runwatch' );

	function coverAll( pc ) {
		return {
			functions: pc,
			branches: pc,
			statements: pc,
			lines: pc
		};
	}

	grunt.initConfig( {
		pkg: grunt.file.readJSON( 'package.json' ),
		clean: {
			dist: [ 'dist/*', 'coverage/*' ]
		},
		concat: {
			ll: {
				options: {
					banner: grunt.file.read( 'build/banner.txt' ),
					sourceMap: true
				},
				dest: 'dist/ll-dist.js',
				src: buildFiles.scripts
			}
		},
		buildloader: {
			desktopDemoApex: {
				targetFile: 'demo/LL.html',
				template: 'demo/LL.html.template',
				modules: modules,
				load: [ 'll.build' ],
				run: [ 'll.build' ],
				env: { debug: false },
				dir: 'ltr',
				pathPrefix: '../',
				i18n: [ 'i18n/', 'lib/ve/i18n/', 'lib/ve/lib/oojs-ui/i18n/' ],
				indent: '\t\t'
			},
			test: {
				targetFile: 'tests/index.html',
				template: 'tests/index.html.template',
				modules: modules,
				env: {
					test: true
				},
				load: [ 'll.test.browser' ],
				pathPrefix: '../',
				indent: '\t\t'
			}
		},
		tyops: {
			options: {
				typos: 'build/typos.json'
			},
			src: [
				'**/*.{js,json,less,css,txt}',
				'!package-lock.json',
				'!build/typos.json',
				'!lib/**',
				'!i18n/**',
				'!{coverage,dist,docs,node_modules,rebaser/node_modules}/**',
				'!.git/**'
			]
		},
		eslint: {
			options: {
				reportUnusedDisableDirectives: true,
				extensions: [ '.js', '.json' ],
				cache: true
			},
			main: [
				'**/*.js{on,}',
				'!coverage/**',
				'!dist/**',
				'!docs/**',
				'!lib/**',
				'!node_modules/**'
			],
			html: {
				options: {
					// TODO: reportUnusedDisableDirectives doesn't work with plugin-html
					// (https://github.com/BenoitZugmeyer/eslint-plugin-html/issues/111)
					// Once that is fixed, merge main and html
					reportUnusedDisableDirectives: false
				},
				src: [
					'*.html',
					'{build,demo,src}/**/*.html'
				]
			}
		},
		stylelint: {
			all: [
				'**/*.css',
				'!coverage/**',
				'!dist/**',
				'!lib/**',
				'!node_modules/**'
			]
		},
		banana: {
			all: 'i18n/'
		},
		karma: {
			options: {
				files: testFiles,
				frameworks: [ 'qunit' ],
				reporters: [ 'dots' ],
				singleRun: true,
				browserDisconnectTimeout: 5000,
				browserDisconnectTolerance: 2,
				browserNoActivityTimeout: 30000,
				customLaunchers: {
					ChromeCustom: {
						base: 'ChromeHeadless',
						// Chrome requires --no-sandbox in Docker/CI.
						flags: ( process.env.CHROMIUM_FLAGS || '' ).split( ' ' )
					}
				},
				autoWatch: false
			},
			main: {
				browsers: [ 'ChromeCustom' ], // T200347: Temporarily disabled `, 'Firefox'*/ ],`
				preprocessors: {
					'src/**/*.js': [ 'coverage' ]
				},
				reporters: [ 'mocha', 'coverage' ],
				coverageReporter: {
					dir: 'coverage/',
					subdir: '.',
					reporters: [
						{ type: 'clover' },
						{ type: 'html' },
						{ type: 'text-summary' }
					],
					// https://github.com/karma-runner/karma-coverage/blob/v1.1.2/docs/configuration.md#check
					check: {
						global: coverAll( 60 ),
						each: {
							functions: 20,
							branches: 20,
							statements: 20,
							lines: 20,
							excludes: [
							],
							overrides: {
								'src/ve.ui.LLClearDirtyTool.js': { functions: 0 },
								'src/ll.init.LLTarget.js': { functions: 0 }
							}
						}
					}
				}
			},
			bg: {
				browsers: [ 'Chrome', 'Firefox' ],
				singleRun: false,
				background: true
			}
		},
		runwatch: {
			files: [
				'.{stylelintrc,eslintrc}.json',
				'**/*.js',
				'!coverage/**',
				'!dist/**',
				'!docs/**',
				'!node_modules/**',
				'<%= stylelint.all %>'
			],
			tasks: [ 'test', 'karma:bg:run' ]
		}
	} );

	grunt.registerTask( 'git-status', function () {
		var done = this.async();
		// Are there unstaged changes?
		require( 'child_process' ).exec( 'git ls-files --modified', function ( err, stdout, stderr ) {
			var ret = err || stderr || stdout;
			if ( ret ) {
				grunt.log.error( 'Unstaged changes in these files:' );
				grunt.log.error( ret );
				// Show a condensed diff
				require( 'child_process' ).exec( 'git diff -U1 | tail -n +3', function ( err, stdout, stderr ) {
					grunt.log.write( err || stderr || stdout );
					done( false );
				} );
			} else {
				grunt.log.ok( 'No unstaged changes.' );
				done();
			}
		} );
	} );

	grunt.registerTask( 'build', [ 'clean', 'concat', 'buildloader' ] );
	grunt.registerTask( 'lint', [ 'tyops', 'eslint', 'stylelint', 'banana' ] );
	grunt.registerTask( 'unit', [ 'karma:main' ] );
	grunt.registerTask( '_test', [ 'lint', 'git-build', 'build', 'unit' ] );
	grunt.registerTask( 'ci', [ '_test', 'svgmin', 'git-status' ] );
	grunt.registerTask( 'watch', [ 'karma:bg:start', 'runwatch' ] );

	if ( process.env.JENKINS_HOME ) {
		grunt.registerTask( 'test', 'ci' );
	} else {
		grunt.registerTask( 'test', '_test' );
	}

	grunt.registerTask( 'default', 'test' );
};
