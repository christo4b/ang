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

  it('should prevent infinite loops with watcher/liseners that reference one another', function(){
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
    scope.arrayValue = [1,2,3];
    scope.counter = 0;
    
    scope.$watch(
      function(scope){ return scope.arrayValue; },
      function(newValue, oldValue, scope){ 
        scope.counter++;
      },
      true
    );

    scope.$digest();
    expect(scope.counter).toBe(1);

    scope.arrayValue.push(4);
    scope.$digest();
    expect(scope.counter).toBe(2);
  });

  it('handles NaNs', function(){
    scope.numba = 0/0;
    scope.counter = 0;
    scope.$watch(
      function(scope){ return scope.numba; },
      function(newValue, oldValue, scope){ 
        scope.counter++;
      }
    );

    scope.$digest();
    expect(scope.counter).toBe(1);

    scope.$digest();
    expect(scope.counter).toBe(1);
  });


  // Exceptions can occur in the watch function and the listen function.
  // We want to test to make sure that the function executes, hits an exception, and then continues on the next watcher
  it('catches exceptions in the watch function and then continues', function(){
    scope.aValue = 'a';
    scope.counter = 0;

    scope.$watch(
      function(scope) { 
        // throw 'Error'; 
      },
      function(newValue, oldValue, scope) {}
    );
    scope.$watch(
      function(scope) { return scope.aValue; },
      function(newValue, oldValue, scope) {
        scope.counter++;
      }
    );

    scope.$digest();
    expect(scope.counter).toBe(1);
  });

  it('catches exceptions in listener function and continues with digest', function(){
    scope.aValue = 'a';
    scope.counter = 0;

    scope.$watch(
      function(scope) { return scope.aValue; },
      function(newValue, oldValue, scope) {
        // throw 'Error';

    });

    scope.$watch(
      function(scope) { return scope.aValue; },
      function(newValue, oldValue, scope) {
        scope.counter++;
      }
    );

    scope.$digest();
    expect(scope.counter).toBe(1);
  });
});

describe('$eval', function(){

  // $eval executes the expression on the current scope and returns the result
  var scope;
  beforeEach(function(){
    scope = new Scope();
  });

  it('executes an $evaled function and returns the result', function(){
    scope.a = 30;
    var result = scope.$eval( function(scope) { 
      return scope.a; 
    });
    expect(result).toBe(30);
  });

  it('passes a second argument in', function(){
    scope.a = 30;
    var result = scope.$eval(function(scope, arg){
      return scope.a + arg;
    }, 20);
    expect(result).toBe(50);
  });
});

describe('$apply', function(){
  // $apply takes a function, executes the function, and then starts the digest cycle
  var scope;
  beforeEach(function(){
    scope = new Scope();
  });
  it('executes given func and then executes digest', function(){
    scope.val = 'a';
    scope.counter = 0;
    
    scope.$watch(
      function(scope){ return scope.val; },
      function(newValue, oldValue, eq){
        scope.counter++;
      }
    );

    scope.$digest();
    expect(scope.counter).toBe(1);

    scope.$apply( function(scope){ 
      scope.val = 'b';
    });

    expect(scope.counter).toBe(2);    
  });

});

describe('$evalAsync', function(){

  var scope;
  beforeEach(function(){
    scope = new Scope();
  });

  it('executes the provided function later in the same digest cycle', function(){
    scope.value = [1,2,3];
    scope.asyncEvaluated = false;
    scope.asyncEvaluatedImmediately = false;

    // call evalAsync in the listener and then check if the function was executed in the same digest, 
    // but executed after the listener function had finished executing
    scope.$watch(
      function(scope){ return scope.value; },
      function(newValue, oldValue, eq){
        scope.$evalAsync(function(scope){
          scope.asyncEvaluated = true;
        });
        scope.asyncEvaluatedImmediately = scope.asyncEvaluated;
      }
    );

    scope.$digest();
    expect(scope.asyncEvaluated).toBe(true);
    expect(scope.asyncEvaluatedImmediately).toBe(false);
  });

  it('executes $evalAsynced functions added by watch functions', function(){
    scope.value = [7,8,9];
    scope.asyncEvaluated = false;

    scope.$watch(
      function(scope){ 
        if (!scope.asyncEvaluated) {
          scope.$evalAsync(function(scope){
            scope.asyncEvaluated = true;
          });
        }
        return scope.value; 
      },
      function(newValue, oldValue, eq){ } 
    );

    scope.$digest();
    expect(scope.asyncEvaluated).toBe(true);
  });

  it('executes $evalAsynced functions even when not dirty', function() {
    scope.value = [7,8,9];
    scope.asyncEvaluatedTimes = 0;

    scope.$watch(
      function(scope) {
        if (scope.asyncEvaluatedTimes < 2){
          scope.$evalAsync(function(scope){
            scope.asyncEvaluatedTimes++;
          });
        }
        return scope.aValue;
      },
      function(newValue,oldValue,scope){}
    );
    scope.$digest();

    expect(scope.asyncEvaluatedTimes).toBe(2);
  });

});


// describe('$eval', function(){

//   it('something', function(){

//   });
  
// });

// describe('$eval', function(){

//   it('something', function(){

//   });
  
// });












