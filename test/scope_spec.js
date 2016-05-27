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

  it('calls the listener function when the watched value changes', function(){
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
  

});