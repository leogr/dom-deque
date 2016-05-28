'use strict';

var DomDeque = DomDeque || {};

(function() {
  /**
   * The `DomDeque.DomDequeBehavior` implements a **double-ended queue** (i.e., deque) of template instances.
   *
   * It is intended to be used with `<template>` **type extensions**.
   *
   * When a `<template>` use it, it is always able to **stamp/insert** or **remove**
   * **one or more** its own **instances** at the front or at the back of the queue.
   *
   * Since this behavior uses the custom `DomDeque.Templatizer` it makes the `<template>`
   * able to **re-templatize its content when changes** (e.g., using `innerHTML`).
   *
   * Note that, similar to Polymer templates, the **insertion point** of instances within the parent node
   * is relative to the original position of the `<template>` when attached.
   * Pushing instances at **front** insert them at the insertion point (above others).
   * Otherwise, pushing at the **back** insert them after the last instance position (below others).
   * Removing instances at front/back respects the same positioning behavior.
   *
   * @demo demo/index.html
   * @polymerBehavior DomDeque.DomDequeBehavior
   */
  var DomDequeBehaviorImpl = {
    properties: {
      /**
       * The maximum number of elements in the queue (defaults to infinity).
       * Sizes the queue so that it contains up to `maxSize` elements.
       * If set to a value smaller than the current queue length,
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

    created: function() {
      this._instances = [];
    },

    attached: function() {
      if (this._instances.length) {
        // NOTE: ideally should not be async, but node can be attached when shady dom is in the act of distributing/composing so push it out
        this.async(this._attachInstances);
      }
    },

    detached: function() {
      if (!this.parentNode ||
          (this.parentNode.nodeType == Node.DOCUMENT_FRAGMENT_NODE &&
           (!Polymer.Settings.hasShadow ||
            !(this.parentNode instanceof ShadowRoot)))) {
        this._detachInstances();
      }
    },

    /**
     * Access last template instance.
     *
     * @readonly
     * @type {Polymer.Base}
     */
    get back() {
      return this._instances[this._instances.length - 1];
    },

    /**
     * Access first template instance.
     *
     * @readonly
     * @type {Polymer.Base}
     */
    get front() {
      return this._instances[0];
    },

    /**
     * Renders the current template content at the end of the deque,
     * attaching it after the last template instance.
     *
     * @return {Polymer.Base} Instance to manage the new template instance.
     */
    pushBack: function() {
      return this._renderInstance(false);
    },

    /**
     * Renders the current template content at the front of the deque,
     * attaching it before the first template instance.
     *
     * @return {Polymer.Base} Instance to manage the new template instance.
     */
    pushFront: function() {
      return this._renderInstance(true);
    },

    /**
     * Detaches the first template instance,
     * removing it from the front of the queue.
     *
     * @return {Polymer.Base} Instance to manage the removed template instance.
     */
    popFront: function() {
      return this._removeInstance(true);
    },

    /**
     * Detaches the last template instance,
     * removing it from the back of the queue.
     *
     * @return {Polymer.Base} Instance to manage the removed template instance.
     */
    popBack: function() {
      return this._removeInstance(false);
    },

    /**
     * Resizes the queue size.
     *
     * @param {number} n New maximum size
     */
    _onMaxSizeChanged: function(n) {
      for (var i = this._instances.length; i > n; i--) {
        this.popBack();
      }
    },

    /**
     * Enqueues and renders the current template content.
     * Furthermore it fires the dom-change event.
     *
     * @param {boolean} atFront Whether the instance must be made at front or not.
     * @return {Polymer.Base} Instance of the current template content.
     */
    _renderInstance: function(atFront) {
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
          // Compute insertion point
          for (var i = 0; i < this._instances.length; i++) {
            var nInstance = this._instances[i];
            if (nInstance._children[0]) {
              insertionPoint = nInstance._children[0];
              break;
            }
          }

          // Enqueue at front
          this._instances.unshift(instance);
        } else {
          // Enqueue at back
          this._instances.push(instance);
        }
        // Resize queue to the max limit
        if (this._instances.length > this.maxSize) {
          this._detachInstance(atFront ? this._instances.pop() : this._instances.shift());
        }

        parent.insertBefore(instance.root, insertionPoint);
        this.fire('dom-change');
        return instance;
      }
    },

    /**
     * Dequeues and detaches a template instance.
     * Furthermore it fires dom-change event.
     *
     * @param      {boolean}  atFront  Whether the instance must be dequeued at front or not.
     * @return     {Polymer.Base|undefined}  Removed instance.
     */
    _removeInstance: function(atFront) {
      if (this._instances.length) {
        var instance = atFront ? this._instances.shift() : this._instances.pop();
        this._detachInstance(instance);
        this.fire('dom-change');
        return instance;
      }
    },

    /**
     * Removes a template instance from its parent.
     *
     * @param {Polymer.Base} instance Instance to detach.
     */
    _detachInstance: function(instance) {
      if (instance) {
        var c$ = instance._children;
        if (c$ && c$.length) {
          // Use first child parent (scenario: template may have been detached)
          var parent = Polymer.dom(Polymer.dom(c$[0]).parentNode);
          for (var i = 0, n; (i < c$.length) && (n = c$[i]); i++) {
            parent.removeChild(n);
          }
        }
      }
    },

    /**
     * Attaches all templates instances to the current parent.
     */
    _attachInstances: function() {
      var parentNode = Polymer.dom(this).parentNode;
      // Guard against element being detached while render was queued
      if (parentNode) {
        var parent = Polymer.dom(parentNode);
        for (var j = 0; j < this._instances.length; j++) {
          var c$ = this._instances[j]._children;
          if (c$ && c$.length) {
            // Detect case where dom-deque was re-attached in new position
            var lastChild = Polymer.dom(this).previousSibling;
            if (lastChild !== c$[c$.length-1]) {
              for (var i=0, n; (i<c$.length) && (n=c$[i]); i++) {
                parent.insertBefore(n, this);
              }
            }
          }
        }
      }
    },

    /**
     * Removes all templates instances from its parent.
     */
    _detachInstances: function() {
      var l$ = this._instances.length;
      for (var i=0; i < l$; i++) {
        this._detachInstance(this._instances[i]);
      }
    },

    /**
     * Implements extension point from `Polymer.Templatizer` mixin.
     * Called as side-effect of a host property change,
     * responsible for notifying `parent.<prop>` property change on each instance.
     */
    _forwardParentProp: function(prop, value) {
      for (var i = 0; i < this._instances.length; i++) {
        this._instances[i][prop] = value;
      }
    },

    /**
     * Implements extension point from `Polymer.Templatizer` mixin.
     * Called as side-effect of a host path change,
     * responsible for notifying `parent.<path>` path change on each instance.
     */
    _forwardParentPath: function(path, value) {
      for (var i = 0; i < this._instances.length; i++) {
        this._instances[i]._notifyPath(path, value, true);
      }
    }
  };

  DomDeque.DomDequeBehavior = [
    DomDeque.Templatizer,
    DomDequeBehaviorImpl
  ];
})();
