/*jshint browserify: true */
'use strict';

var _ = require('lodash');
var Scope = require('../src/scope');

describe("Scope", function(){

  it("can be constructed and used as an object", function(){
    var scope = new Scope();
    scope.aProperty = 1;

    expect(scope.aProperty).toBe(1);
  });

});

// Digest will iterate over all of the watchers and run their watch and listen functions
describe("digest", function(){

  var scope;

  beforeEach(function(){
    scope = new Scope();
  }); 

  it("calls the watch function with the scope as the argument", function(){
    var watchFn = jasmine.createSpy();
    var listenerFn = function() {};
    
    // Invoke $watch to register a watcher on the scope. 
    // Pass a jasmine Spy as the listener function
    scope.$watch(watchFn, listenerFn);
    scope.$digest();

    expect(watchFn).toHaveBeenCalledWith(scope);
  });

  it('calls listener with the new value as the old value the first time', function(){
    scope.someValue = 123;
    var oldValueGiven;

    scope.$watch(
      function(scope) { return scope.someValue; },
      function(newValue, oldValue, scope){ oldValueGiven = oldValue; }
    );

    scope.$digest();
    expect(oldValueGiven).toBe(123);
  });
  // We'll set some properties on the scope, and set a watcher on one of the properties

  it('calls the listener function when the watched value changes', function(){
    // If $digest sees a change in the scope.someValue, it will then invoke the listener
    // which will increment some.counter
    scope.someValue = 'a';
    scope.counter = 0;

    scope.$watch(
      function(scope){ return scope.someValue; },
      function(newValue, oldValue, scope) { scope.counter++; }
    );

    expect(scope.counter).toBe(0);
    scope.$digest();
    expect(scope.counter).toBe(1);
    scope.$digest();
    expect(scope.counter).toBe(1);

    scope.someValue = 'b';
    expect(scope.counter).toBe(1);
    scope.$digest();
    expect(scope.counter).toBe(2);

  });

  it('may have watchers that omit the listener function', function(){
    var watchFn = jasmine.createSpy().and.returnValue('something');
    scope.$watch(watchFn);
    scope.$digest();
    expect(watchFn).toHaveBeenCalled();
  });

  it('triggers chained watchers in the same digest', function(){
    scope.name = "Jane";

    // The first watcher sets the scope.initial property
    scope.$watch(
      function(scope) { return scope.nameUpper; },
      function(newValue, oldValue, scope) {
        if (newValue) {
          scope.initial = newValue.substring(0,1) + '.';
        }
      }
    );
    
    // The second watcher sets the scope.nameUpper property
    scope.$watch(
      function(scope){ return scope.name; },
      function(newValue, oldValue, scope){ 
        if (newValue) {
          scope.nameUpper = newValue.toUpperCase();
        }
      }
    );

    scope.$digest();
    expect(scope.initial).toBe('J.');

    scope.name = 'Chris';
    scope.$digest();
    expect(scope.initial).toBe('C.');

  });

  it('should prevent infinite loops', function(){
    scope.counterA = 0;
    scope.counterB = 0;
 
    scope.$watch(
      function(scope){ return scope.counterA; },
      function(newValue, oldValue, scope){ 
        scope.counterB++;
      }
    );

    scope.$watch(
      function(scope){ return scope.counterB; },
      function(newValue, oldValue, scope){ 
        scope.counterA++;
      }
    );

    expect( (function() { scope.digest(); }) ).toThrow();
  });

  // create an array with 100 numbers and attach a watcher to each one
  it('should short circuit and end digest when last watch is clean', function(){
    scope.array = _.range(100);
    var watchExecutions = 0;

    _.times(100, function(i){
      scope.$watch(
        function(scope){
          watchExecutions++;
          return scope.array[i];
        },
        function(newValue, oldValue, scope){}
      );
    });
    
    // Why is each watcher function run twice?
    scope.$digest();
    expect(watchExecutions).toBe(200);

    scope.array[0] = 420;
    scope.$digest();
    expect(watchExecutions).toBe(301);

  });

  it('should deal with a listener adding a watcher', function(){
    scope.aValue = 'xyz';
    scope.counter = 0;

    scope.$watch(
      function(scope){ return scope.aValue; },
      function(newValue, oldValue, scope){ 
        scope.$watch(
          function(scope){ return scope.aValue; },
          function(newValue, oldValue, scope){ 
            scope.counter++;
          }
        );
      }
    );

    scope.$digest();
    expect(scope.counter).toBe(1);

  });

  it('should check for internal equality with comparing arrays/objects', function(){

    scope.array = [1,2,3];
    scope.counter = 0;

    scope.$watch(
      function(scope){ return scope.array; },
      function(newValue, oldValue, scope){ 
        scope.counter++
      }
    );

    scope.$digest();
    expect(scope.counter).toBe(1);

    scope.array.push(4);
    scope.$digest();
    expect(scope.counter).toBe(2);
    
  })

});

















