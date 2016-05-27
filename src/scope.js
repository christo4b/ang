'use strict'; 

var _ = require('lodash');

function initWatchValue(){}

function Scope() {
  this.$$watchers = [];
}

// Takes a watcher fn and a listener function and adds them to the scope's $$watchers array
Scope.prototype.$watch = function(watchFn, listenerFn){

  var watcher = { 
    watchFn: watchFn,
    listenerFn: listenerFn || function(){},
    last: initWatchValue
  };

  this.$$watchers.push(watcher);
};

// Digest will invoke the watcher and compare its return value
// with the previous return value
Scope.prototype.$$digestOnce = function() {
  
  var self = this;
  var newValue, oldValue, dirty;
  _.forEach(this.$$watchers, function(watcher) {
    newValue = watcher.watchFn(self);
    oldValue = watcher.last;
    // If we've encountered a dirty watch:
    if (newValue !== oldValue) { 
      self.$$lastDirtyWatch = watcher;
      watcher.last = newValue;
      watcher.listenerFn(newValue, (oldValue === initWatchValue ? newValue : oldValue), self);
      dirty = true;
    // short circuit is possible because we're using Lodash forEach, not standard forEach
    } else if (self.$$lastDirtyWatch === watcher) {
      return false;
    }
  });
  return dirty;
};


Scope.prototype.$digest = function() {
  // Using a "Time To Live" of ten to prevent infinite loops
  var ttl = 10;
  var dirty;
  // Keeping track of the last dirty watch to short circuit the loop
  this.$$lastDirtyWatch = null;

  do {
    dirty = this.$$digestOnce();
    if (dirty && !(ttl--)) {
      throw '10 Digest Iterations Reached';
    }
  } while (dirty);
};

module.exports = Scope;