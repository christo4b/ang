/* jshint globalstrict: true */
'use strict'; 

function Scope() {
  this.$$watchers = [];
}

// Takes a watcher fn and a listener function and adds them to the scope's $$watchers array
Scope.prototype.$watch = function(watchFn, listenerFn){
  var watcher = {
    watchFn: watchFn,
    listenerFn: listenerFn
  };
  this.$$watchers.push(watcher);
};

Scope.prototype.$digest = function(){
  _.forEach(this.$$watchers, function(watcher){
    watcher.listenerFn();
  });
};
