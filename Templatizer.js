'use strict';

var DomDeque = DomDeque || {};

(function() {
  /**
   * The `DomDeque.Templatizer`
   *
   * Example:
   *     // TODO
   *
   * ...
   *
   * @demo demo/index.html
   * @polymerBehavior DomDeque.Templatizer
   */
  var TemplatizerImpl = {

    untemplatize: function(template) {
      delete template._templatized;
      delete template._content;
      delete template.ctor;
      delete template.content._ctor;
      delete template.content._notes;
    },

    reset: function() {
      this.replaceContent('');
    },

    replaceContent: function(contentHTML) {
      this.untemplatize(this);
      Polymer.dom(this).node.innerHTML = contentHTML;
    },

    templatize: function(template) {

      var dataHost = this.dataHost;
      if (!this._content && dataHost && dataHost._template) {

        // 1st step: add new properties and effects to dataHost

        // Backup and reset _bindListener to avoid re-attaching the same listeners later
        var _bindListeners = dataHost._bindListeners;
        dataHost._bindListeners = [];

        // Force dataHost to parse new annotations
        Polymer.dom(dataHost._template).node.innerHTML = Polymer.dom(this).node.outerHTML;
        dataHost._prepAnnotations();
        dataHost._prepEffects();

        // Make _propertyEffects diffs
        var propertyEffects = dataHost._propertyEffects;
        var _propertyEffects = {};
        var _allProps = {};
        for (var k in propertyEffects) {
          var pd = Object.getOwnPropertyDescriptor(dataHost, k);
          if (pd && !pd.configurable) {
            _propertyEffects[k] = propertyEffects[k];
            delete propertyEffects[k];
          }
          _allProps[k] = true;
        }

        // Create new bindings
        Polymer.Bind.createBindings(dataHost); //dataHost._prepBindings();

        // Bind new listeners
        Polymer.Bind.setupBindListeners(dataHost);

        // Restore _propertyEffects
        for (var k in _propertyEffects) {
          propertyEffects[k] = _propertyEffects[k];
        }

        // Restore _bindListener
        _bindListeners.push.apply(_bindListeners, dataHost._bindListeners);
        dataHost._bindListeners = _bindListeners;

        // 2st step: templatize the template and extend this
        this.content._parentProps = _allProps;
        Polymer.Templatizer.templatize.call(this, template);

        // Finally, restore all props
        this.content._parentProps = this._parentProps = _allProps;

      } else {
        Polymer.Templatizer.templatize.call(this, template);
      }
    },

    // Similar to Polymer.Base.extend, but retains any previously set instance
    // values (_propertySetter back on instance once accessor is installed)
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
          //console.log(this, '_extendTemplate', e);
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
