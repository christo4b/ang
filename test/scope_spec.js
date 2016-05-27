/* jshint globalstrict: true */
/* global Scope: false */

'use strict';

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

  it("calls the listener function of a watch on first $digest", function(){
    var watchFn = function() { return 'wat' ;};
    var listenerFn = jasmine.createSpy();
    
    // Invoke $watch to register a watcher on the scope.
    // Pass a jasmine Spy as the listener function
    scope.$watch(watchFn, listenerFn);
    scope.$digest();
    expect(listenerFn).toHaveBeenCalled();
  });

});