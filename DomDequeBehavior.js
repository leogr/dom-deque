'use strict';

var DomDeque = DomDeque || {};

(function() {
  /**
   * The `DomDeque.DomDequeBehavior` behavior ...
   *
   * Example:
   *     // TODO
   *
   * ...
   *
   * @demo demo/index.html
   * @polymerBehavior DomDeque.DomDequeBehavior
   */
  var DomDequeBehaviorImpl = {

    // TODO: Detect case where template was re-attached in new position (use attached callback)
    // https://github.com/Polymer/polymer/blob/master/src/lib/template/dom-if.html#L132

    properties: {
      /**
       * The number of elements in the queue (defaults to infinity).
       *
       * Sizes the queue so that it contains up to n elements.
       * If it is smaller than the current queue length,
       * the queue is reduced to its first `maxSize` elements,
       * removing those beyond.
       *
       * @type {?number}
       */
      maxSize: {
        type: Number,
        value: Infinity,
        observer: '_onMaxSizeChanged'
      }
    },

    _onMaxSizeChanged: function(newSize) {
      for (var i = this._instances.length; i >= newSize; i--) {
        this.popBack();
      }
    },

    created: function() {
      this._instances = [];
    },

    /**
     *
     *
     * @return {Polymer.Base} The `Polymer.Base` instance to manage the template instance.
     */
    get back() {
      return this._instances[this.instances.length - 1];
    },

    /**
     *
     *
     * @return {Polymer.Base} The `Polymer.Base` instance to manage the template instance.
     */
    get front() {
      return this._instances[0];
    },

    /**
     *
     *
     * @return {Polymer.Base} The `Polymer.Base` instance to manage the template instance.
     */
    pushBack: function() {
      var instance = this._makeInstance();
      if (instance) {
        this._instances.push(instance);
        if (this._instances.length > this.maxSize) {
          this.popFront();
        }
      }
      return instance;
    },

    /**
     *
     *
     * @return {Polymer.Base} The `Polymer.Base` instance to manage the template instance.
     */
    pushFront: function() {
      var instance = this._makeInstance(true);
      if (instance) {
        this._instances.unshift(instance);
        if (this._instances.length > this.maxSize) {
          this.popBack();
        }
      }
      return instance;
    },

    /**
     *
     *
     * @return {Polymer.Base} The `Polymer.Base` instance to manage the template instance.
     */
    popFront: function() {
      var instance = this._instances.shift();
      this._teardownInstance(instance);
      return instance;
    },

    /**
     *
     *
     * @return {Polymer.Base} The `Polymer.Base` instance to manage the template instance.
     */
    popBack: function() {
      var instance = this._instances.pop();
      this._teardownInstance(instance);
      return instance;
    },

    /**
     * Cleans the templatizer cache.
     *
     * Forces the templatizer to prepare again the template when `content` changes.
     * The `ContentChangesObserverBehavior` makes this to happen automatically.
     *
     * @method forceTemplatize
     */
    cleanCache: function() {
      this._content = null;
      this.ctor = null;
    },

    _makeInstance: function(atFront) {
      if (!this.ctor) {
        this.templatize(this);
      }

      var parentNode = Polymer.dom(this).parentNode;
      // Guard against element being detached while render was queued
      if (parentNode) {
        var parent = Polymer.dom(parentNode);
        var instance = this.stamp();
        var insertionPoint = this;

        if (atFront) {
          for (var i = 0; i < this._instances.length; i++) {
            var nInstance = this._instances[i];
            if (nInstance._children[0]) {
              insertionPoint = nInstance._children[0];
              break;
            }
          }
        }

        parent.insertBefore(instance.root, insertionPoint);
        return instance;
      }
    },

    _teardownInstance: function(instance) {
      if (instance) {
        var c$ = instance._children;
        if (c$ && c$.length) {
          // use first child parent, for case when dom-if may have been detached
          var parent = Polymer.dom(Polymer.dom(c$[0]).parentNode);
          for (var i = 0, n; (i < c$.length) && (n = c$[i]); i++) {
            parent.removeChild(n);
          }
        }
      }
    },

    // Implements extension point from Templatizer mixin
    // Called as side-effect of a host property change, responsible for
    // notifying parent.<prop> path change on instance
    _forwardParentProp: function(prop, value) {
      for (var i = 0; i < this._instances.length; i++) {
        this._instances[i][prop] = value;
      }
    },

    // Implements extension point from Templatizer
    // Called as side-effect of a host path change, responsible for
    // notifying parent.<path> path change on each row
    _forwardParentPath: function(path, value) {
      for (var i = 0; i < this._instances.length; i++) {
        this._instances[i]._notifyPath(path, value, true);
      }
    }
  };

  DomDeque.DomDequeBehavior = [
    Polymer.Templatizer,
    DomDequeBehaviorImpl
  ];
})();
