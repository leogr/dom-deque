'use strict';

var DomDeque = DomDeque || {};

(function() {
  /**
   * The `DomDeque.ContentChangesObserverBehavior` behavior ...
   *
   * Example:
   *     // TODO
   *
   * ...
   *
   * @demo demo/index.html
   * @polymerBehavior DomDeque.ContentChangesObserverBehavior
   */
  var ContentChangesObserverBehaviorImpl = {
    attached: function() {
      this._contentObserver = Polymer.dom(this.content).observeNodes(
        this._onContentChanges.bind(this)
      );
    },

    detached: function() {
      if (this._contentObserver) {
        Polymer.dom(this.content).unobserveNodes(this._contentObserver);
      }
    },

    _onContentChanges: function() {}
  };

  DomDeque.ContentChangesObserverBehavior = [ContentChangesObserverBehaviorImpl];
})();
