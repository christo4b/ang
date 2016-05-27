'use strict'; 

var _ = require('lodash');

function initWatchValue(){
}

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
Scope.prototype.$digest = function(){
  var self = this;
  var newValue, oldValue;
  _.forEach(this.$$watchers, function(watcher){
    newValue = watcher.watchFn(self);
    oldValue = watcher.last;

    if(newValue !== oldValue){
      watcher.last = newValue;
      watcher.listenerFn(newValue, oldValue, self);
    }
  });
};

module.exports = Scope;