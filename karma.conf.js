module.exports = function(config){
  config.set({
    frameworks: ['jasmine'],
    files: ['src/**/*.js', 'test/**/*_spec.js',],
    preprocessors: {'src/**/*.js': ['jshint'], 'test/**/*.js': ['jshint']},
    browsers: ['PhantomJS']
  }); 
};