'use strict'; 

var _ = require('lodash');

function initWatchValue(){}

function Scope() {
  this.$$watchers = [];
}

// Takes a watcher fn and a listener function and adds them to the scope's $$watchers array
Scope.prototype.$watch = function(watchFn, listenerFn, eq){

  var watcher = { 
    watchFn: watchFn,
    listenerFn: listenerFn || function(){},
    last: initWatchValue,
    eq: !!eq
  };

  this.$$watchers.push(watcher);
  this.$$lastDirtyWatch = null;
};

Scope.prototype.$$areEqual = function(newValue, oldValue, eq){
  if (eq) {
    return _.isEqual(newValue, oldValue);
  } else {
    return newValue === oldValue ||
      (typeof newValue === 'number' && typeof oldValue === 'number' && 
        isNaN(newValue) && isNaN(oldValue));
  }
};

// Digest will invoke the watcher and compare its return value
// with the previous return value
Scope.prototype.$$digestOnce = function() {
  
  var self = this;
  var newValue, oldValue, dirty;
  _.forEach(this.$$watchers, function(watcher) {
    try {
      newValue = watcher.watchFn(self);
      oldValue = watcher.last;
      // If we've encountered a dirty watch:
      if (!self.$$areEqual(newValue, oldValue, watcher.eq)) {
        self.$$lastDirtyWatch = watcher;
        //deep clone of the object b/c changes made to the object would be reflected in our reference to that object
        watcher.last = (watcher.eq ? _.cloneDeep(newValue) : newValue);
        watcher.listenerFn(newValue, (oldValue === initWatchValue ? newValue : oldValue), self);
        dirty = true;
      // short circuit is possible because we're using Lodash forEach, not standard forEach
      } else if (self.$$lastDirtyWatch === watcher) {
        return false;
      }
    } catch (e) {
      console.error(e);
    }
  });
  return dirty;
};


Scope.prototype.$digest = function() {
  // Using a "Time To Live" of ten to prevent infinite loops
  var ttl = 10;
  var dirty;
  // Keeping track of the last dirty watch to short circuit the loop
  // putting property on this object so we can access it within the $watch
  this.$$lastDirtyWatch = null;

  do {
    dirty = this.$$digestOnce();
    if (dirty && !(ttl--)) {
      throw 'Error: TTL: 10 Digest Iterations Reached';
    }
  } while (dirty);
};



module.exports = Scope;