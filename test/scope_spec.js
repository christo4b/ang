'use strict';

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

    scope.$watch(
      function(scope){ return scope.name; },
      function(newValue, oldValue, scope){ 
        if (newValue) {
          scope.nameUpper = newValue.toUpperCase();
        }
      }
    );

    scope.$watch(
      function(scope) { return scope.nameUpper; },
      function(newValue, oldValue, scope) {
        if (newValue) {
          scope.initial = newValue.substring(0,1) + '.';
        }
      }
    );

    scope.$digest();
    expect(scope.initial).toBe('J.');

    scope.name = 'Chris';
    scope.$digest();
    expect(scope.initial).toBe('C.');

  });

});