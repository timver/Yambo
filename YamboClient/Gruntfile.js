/// <binding />
module.exports = function (grunt) {

    'use strict';

    // Load tasks
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-compass');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-modernizr');

    // Project configuration.
    grunt.initConfig({

        clean: {
            files: {
                src: ['js/lib/**']
            },
            options: {
                force: true
            }
        },

        modernizr: {
            dist: {
                dest: 'bower_components/modernizr/build/modernizr.custom.js',
                uglify: false,
                options: [
                  'setClasses',
                  'addTest'
                ],
                files: {
                    src: ['public/js/app/**/*.js']
                }
            }
        },

        copy: {
            js: {
                files: [
                    {
                        expand: true,
                        cwd: 'bower_components',
                        src: [
                            'modernizr/build/modernizr.custom.js',
                            'jquery/dist/jquery.js',
                            'jquery-uniform/jquery.uniform.js',
                            'dragula/dist/dragula.js'
                        ],
                        dest: 'public/js/lib'
                    }
                ]
            },
            css: {
                files: [
                    {
                        expand: true,
                        cwd: 'bower_components',
                        src: [
                            'jquery-uniform/css/uniform.default.css',
                            'jquery-uniform/img/*.*',
                            'dragula/dist/dragula.css'
                        ],
                        dest: 'public/css/lib'
                    }
                ]
            }
        },

        compass: {
            options: {
                basePath: 'public/',
                sassDir: 'scss',
                cssDir: 'css/app'
            },
            watch: {
                src: ['*.scss'],
                tasks: ['compass'],
                options: {
                    spawn: false,
                    watch: true
                }
            }
        }
    });

    // Default task.
    grunt.registerTask('default', ['clean', 'modernizr:dist', 'copy:js', 'copy:css']);
    grunt.registerTask('watch', ['compass']);
};
