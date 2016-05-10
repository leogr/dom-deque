'use strict';

var DomDeque = DomDeque || {};

(function() {
  var ContentChangesObserverBehaviorImpl = {

    attached: function() {
      this._contentObserver = Polymer.dom(this.content).observeNodes(
        this._onContentChanges().bind(this)
      );
    },

    detached: function() {
      if (this._contentObserver) {
        Polymer.dom(this).unobserveNodes(this._contentObserver);
      }
    },

    _onContentChanges: function() {}
  };

  DomDeque.ContentChangesObserverBehavior = ContentChangesObserverBehaviorImpl;
})();
