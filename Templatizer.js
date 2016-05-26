'use strict';

var DomDeque = DomDeque || {};

(function() {
  var setHTML = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML').set;

  /**
   * The `DomDeque.Templatizer` is an extension of `Polymer.templatizer`.
   *
   * It allows the **dynamic replacement of the content** making the **late-binding** to work (also at instance time).
   *
   * By default Polymer parses annotations and prepare bindings at registration time,
   * augumenting custom elements.
   * This behavior make the same feature set to work also at **runtime**,
   * allowing the user to **replace the template content at any time with no features loss**.
   *
   * @demo demo/index.html
   * @polymerBehavior DomDeque.Templatizer
   */
  var TemplatizerImpl = {
    /**
     * Sets the HTML syntax describing the element descendants.
     *
     * It automatically untemplatizes the current template.
     *
     * @param      {string}  text  The serialized HTML to replace with.
     */
    set innerHTML(text) {
      this.untemplatize(this);
      setHTML.call(this, text);
    },

    /**
     * Cleans all the template caches.
     *
     * @param {HTMLTemplateElement} template
     */
    untemplatize: function(template) {
      delete template._templatized;
      delete template._content;
      delete template.ctor;
      delete template.content._ctor;
      delete template.content._notes;
    },

    /**
     * Prepares a template containing Polymer bindings by generating
     * a constructor for an anonymous `Polymer.Base` subclass to serve as the
     * binding context for the provided template.
     *
     * Use `this.stamp` to create instances of the template context containing
     * a `root` fragment that may be stamped into the DOM.
     *
     * When content changes - i.e., by `contentHTML` - we ignore template cache
     * and prepare effects and bindings for the new content.
     *
     * @method templatize
     * @param {HTMLTemplateElement} template
     */
    templatize: function(template) {
      var dataHost = this.dataHost;
      // When content cache is missing and a data host exists
      // We add new properties and effects to the data host
      if (!this._content && dataHost && dataHost._template) {
        // Backup and reset already  bound listeners to avoid re-attaching them later
        var _bindListeners = dataHost._bindListeners;
        dataHost._bindListeners = [];

        // Force data host to parse new annotations
        Polymer.dom(dataHost._template).node.innerHTML = Polymer.dom(this).node.outerHTML;
        dataHost._prepAnnotations();
        dataHost._prepEffects();

        // Backup existing property effects (from the data host), for later usage
        // Keep only unseen property effects
        var _propertyEffects = dataHost._propertyEffects;
        var existingPropertyEffects = {};
        var allProps = {};
        for (var k in _propertyEffects) {
          var pd = Object.getOwnPropertyDescriptor(dataHost, k);
          if (pd && !pd.configurable) {
            existingPropertyEffects[k] = _propertyEffects[k];
            delete _propertyEffects[k];
          }
          allProps[k] = true;
        }

        // Create new bindings
        Polymer.Bind.createBindings(dataHost); // Called within dataHost._prepBindings();

        // Bind new listeners
        Polymer.Bind.setupBindListeners(dataHost);

        // Restore pre-existing property effects
        for (var k in _propertyEffects) {
          _propertyEffects[k] = existingPropertyEffects[k];
        }

        // Restore pre-existing bound listeners
        if (_bindListeners) {
          _bindListeners.push.apply(_bindListeners, dataHost._bindListeners);
        }
        dataHost._bindListeners = _bindListeners;

        // Tell to Polymer's templatize to use all the parent properties
        this.content._parentProps = allProps;
      }

      // Finally, templatize the template and extend the "this" object
      Polymer.Templatizer.templatize.call(this, template);
    },

    /**
     * Behaves similarly to `Polymer.Base.extend` but retains previously set instance values.
     * Note that `_propertySetter` come back on instance once accessor is installed.
     *
     * @param {HTMLTemplateElement} template
     * @param {Object} proto
     */
    _extendTemplate: function(template, proto) {
      var n$ = Object.getOwnPropertyNames(proto);
      if (proto._propertySetter) {
        // _propertySetter API may need to be copied onto the template,
        // and it needs to come first to allow the property swizzle below
        template._propertySetter = proto._propertySetter;
      }
      for (var i=0, n; (i<n$.length) && (n=n$[i]); i++) {
        var val = template[n];
        var pd = Object.getOwnPropertyDescriptor(proto, n);
        try {
          Object.defineProperty(template, n, pd);
        } catch (e) {
          // Silently ignore property re-definition
          // console.log(this, '_extendTemplate', e);
        }
        if (val !== undefined) {
          template._propertySetter(n, val);
        }
      }
    }
  };

  DomDeque.Templatizer = [
    Polymer.Templatizer,
    TemplatizerImpl
  ];
})();
