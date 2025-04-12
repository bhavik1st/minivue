// MiVue - A minimal Vue-inspired JavaScript framework
class MiVue {
  constructor(options) {
    this.$options = options || {};
    this.$data = options.data || {};
    this.$el = typeof options.el === 'string' 
      ? document.querySelector(options.el) 
      : options.el;
    this.debug = options.debug || false;
    this.$computed = options.computed || {};
    this._computedWatchers = {};
    
    // Initialize after DOM is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.initialize());
    } else {
      this.initialize(options);
    }
  }
  
  initialize(options) {
    try {
      this.log('Initializing MiVue instance');
      // Make data properties reactive
      this._observe(this.$data);

      // Proxy data properties to MiVue instance
      for (let key in this.$data) {
        Object.defineProperty(this, key, {
          get: () => this.$data[key],
          set: val => {
            this.$data[key] = val;
          }
        });
      }

      // Initialize computed properties
      // this._initComputed(options.computed || {});

      // Bind methods to the instance
      this._bindMethods(options.methods || {});

      // Initialize DOM
      if (this.$el) {
        this._compile(this.$el);
      } else {
        this.log('Warning: No element provided, DOM compilation skipped');
      }
    } catch (error) {
      console.error('[MiVue] Initialization error:', error);
    }
  }

  // Initialize computed properties
  _initComputed(computedOptions) {
    try {
      this.log('Initializing computed properties');
      for (let key in computedOptions) {
        const userDef = computedOptions[key];
        
        // Support both function and getter/setter object formats
        const getter = typeof userDef === 'function' ? userDef : userDef.get;
        const setter = userDef.set || (() => {
          console.warn(`Computed property "${key}" was assigned to but it has no setter.`);
        });
        
        if (!getter) {
          console.warn(`Computed property "${key}" has no getter.`);
          continue;
        }
        
        // Create a watcher for this computed property
        this._computedWatchers[key] = new ComputedWatcher(this, getter, () => {
          // This is the callback when dependencies change
          // We don't need to do anything here as the value will be recomputed on next access
        }, { computed: true });
        
        // Define the computed property on the instance
        if (!(key in this)) {
          Object.defineProperty(this, key, {
            get: () => {
              const watcher = this._computedWatchers[key];
              if (watcher) {
                // Only evaluate if dirty or it's the first evaluation
                if (watcher.dirty) {
                  watcher.evaluate();
                }
                return watcher.value;
              }
            },
            set: setter.bind(this)
          });
          
          // Also add to $computed for tracking
          this.$computed[key] = true;
        } else {
          console.warn(`Computed property "${key}" is already defined in data.`);
        }
      }
    } catch (error) {
      console.error('[MiVue] Error initializing computed properties:', error);
    }
  }
  
  // Bind methods to the MiVue instance
  _bindMethods(methods) {
    try {
      this.log('Binding methods to instance');
      for (let key in methods) {
        if (typeof methods[key] === 'function') {
          this[key] = methods[key].bind(this);
          this.log(`Method bound: ${key}`);
        } else {
          console.warn(`[MiVue] Method ${key} is not a function`);
        }
      }
    } catch (error) {
      console.error('[MiVue] Error binding methods:', error);
    }
  }
  
  // Logging method
  log(...args) {
    if (this.debug) {
      console.log('[MiVue]', ...args);
    }
  }
  
  // Make data reactive
  _observe(data) {
    try {
      this.log('Setting up reactivity for data');
      for (let key in data) {
        let value = data[key];
        
        // Create a dep list for each property
        const dep = new Dep();
        
        Object.defineProperty(data, key, {
          get() {
            // When a property is accessed in a template rendering,
            // register it as a dependency
            if (Dep.target) {
              dep.depend();  // Use depend() instead of addSub()
            }
            return value;
          },
          set(newValue) {
            if (value === newValue) return;
            value = newValue;
            // Notify all subscribers that value has changed
            dep.notify();
          }
        });
      }
    } catch (error) {
      console.error('[MiVue] Reactivity setup error:', error);
    }
  }
  
  // Process and compile DOM element and its children
  _compile(el) {
    try {
      this.log('Compiling template');
      const nodes = el.childNodes;
      
      Array.from(nodes).forEach(node => {
        try {
          // Handle element nodes
          if (node.nodeType === 1) {
            this._compileElement(node);
          }
          
          // Handle text nodes with mustache template syntax
          else if (node.nodeType === 3) {
            this._compileTextNode(node);
          }
        } catch (nodeError) {
          console.error('[MiVue] Error compiling node:', nodeError, node);
        }
      });
    } catch (error) {
      console.error('[MiVue] Template compilation error:', error);
    }
  }
  
  // Handle element node compilation
  _compileElement(node) {
    // Process element directives
    const attrs = node.attributes;
    
    Array.from(attrs).forEach(attr => {
      try {
        const attrName = attr.name;
        const value = attr.value;
        
        if (attrName.startsWith('m-')) {
          const directive = attrName.slice(2);
          this.log(`Processing directive: ${directive}`, value);
          
          // Handle m-model directive
          if (directive === 'model') {
            this._bindModelDirective(node, value);
          }
          
          // Handle m-if directive
          else if (directive === 'if') {
            this._bindIfDirective(node, value);
          }
          
          // Handle m-on directive (event handling)
          else if (directive.startsWith('on:')) {
            this._bindEventDirective(node, directive.slice(3), value);
          }
        }
        // Handle shorthand event syntax @click
        else if (attrName.startsWith('@')) {
          const event = attrName.slice(1);
          this._bindEventDirective(node, event, value);
        }
      } catch (attrError) {
        console.error('[MiVue] Error processing attribute:', attrError, attr);
      }
    });
    
    // Continue recursively for children
    if (node.childNodes.length > 0) {
      this._compile(node);
    }
  }
  
  // Handle event binding directive
  _bindEventDirective(node, event, handlerName) {
    try {
      this.log(`Binding event ${event} to method ${handlerName}`);
      
      // Check if the method exists on the instance
      if (typeof this[handlerName] !== 'function') {
        console.warn(`[MiVue] Method ${handlerName} not defined`);
        return;
      }
      
      // Add the event listener to the node
      node.addEventListener(event, (e) => {
        // Call the method with the event object
        this[handlerName](e);
      });
    } catch (error) {
      console.error(`[MiVue] Error binding event ${event}:`, error);
    }
  }
  
  // Handle m-model directive binding
  _bindModelDirective(node, value) {
    try {
      this.log(`Binding m-model for ${value}`);
      
      // Handle different input types
      if (node.tagName === 'INPUT') {
        if (node.type === 'checkbox') {
          // For checkboxes, use checked property instead of value
          node.checked = this.$data[value];
          
          // Use change event for checkboxes
          node.addEventListener('change', () => {
            this.$data[value] = node.checked;
          });
          
          // Create watcher for this checkbox binding
          new Watcher(this, value, () => {
            node.checked = this.$data[value];
          });
        } else if (node.type === 'radio') {
          // For radio buttons
          node.checked = node.value === this.$data[value];
          
          node.addEventListener('change', () => {
            this.$data[value] = node.value;
          });
          
          // Create watcher for radio buttons
          new Watcher(this, value, () => {
            node.checked = node.value === this.$data[value];
          });
        } else {
          // For text, number, etc.
          node.value = this.$data[value];
          
          node.addEventListener('input', () => {
            this.$data[value] = node.value;
          });
          
          // Create watcher for other input types
          new Watcher(this, value, () => {
            node.value = this.$data[value];
          });
        }
      } else if (node.tagName === 'TEXTAREA') {
        // For textarea
        node.value = this.$data[value];
        
        node.addEventListener('input', () => {
          this.$data[value] = node.value;
        });
        
        // Create watcher for textarea
        new Watcher(this, value, () => {
          node.value = this.$data[value];
        });
      } else if (node.tagName === 'SELECT') {
        // For select elements
        node.value = this.$data[value];
        
        node.addEventListener('change', () => {
          this.$data[value] = node.value;
        });
        
        // Create watcher for select
        new Watcher(this, value, () => {
          node.value = this.$data[value];
        });
      }
    } catch (error) {
      console.error('[MiVue] Error binding m-model:', error);
    }
  }
  
  // Handle m-if directive binding
  _bindIfDirective(node, value) {
    try {
      this.log(`Binding m-if for ${value}`);
      const initialDisplay = node.style.display || '';
      
      // Create watcher for conditional rendering
      new Watcher(this, value, () => {
        node.style.display = this.$data[value] ? initialDisplay : 'none';
      });
      
      // Initial render
      node.style.display = this.$data[value] ? initialDisplay : 'none';
    } catch (error) {
      console.error('[MiVue] Error binding m-if:', error);
    }
  }
  
  // Handle text node compilation
  _compileTextNode(node) {
    const reg = /\{\{(.*?)\}\}/g;
    const text = node.textContent;
    
    if (reg.test(text)) {
      try {
        this.log('Found text interpolation');
        const matches = text.match(reg);
        const rawText = text;
        
        matches.forEach(match => {
          const key = match.replace(/\{\{|\}\}/g, '').trim();
          this.log(`Binding text for ${key}`);
          
          // Create watcher for this text binding
          new Watcher(this, key, () => {
            let newText = rawText;
            matches.forEach(m => {
              const k = m.replace(/\{\{|\}\}/g, '').trim();
              // Get the value, which could be in $data or could be a computed property
              const value = this[k] !== undefined ? this[k] : '';
              newText = newText.replace(m, value);
            });
            node.textContent = newText;
          });
        });
        
        // Initial render
        let newText = rawText;
        matches.forEach(match => {
          const key = match.replace(/\{\{|\}\}/g, '').trim();
          // Get the value, which could be in $data or could be a computed property
          const value = this[key] !== undefined ? this[key] : '';
          newText = newText.replace(match, value);
        });
        node.textContent = newText;
      } catch (error) {
        console.error('[MiVue] Error compiling text node:', error);
      }
    }
  }
}

// Dependency class
class Dep {
  constructor() {
    this.subs = [];
    this.id = Dep.uid++;
  }
  
  addSub(sub) {
    if (sub && typeof sub.update === 'function') {
      this.subs.push(sub);
    }
  }
  
  notify() {
    this.subs.forEach(sub => {
      try {
        sub.update();
      } catch (error) {
        console.error('[MiVue] Error updating subscriber:', error);
      }
    });
  }
  
  depend() {
    if (Dep.target) {
      Dep.target.addDep(this);
    }
  }
}

// Static properties for Dep
Dep.uid = 0;
Dep.target = null;
const targetStack = [];

function pushTarget(target) {
  if (Dep.target) targetStack.push(Dep.target);
  Dep.target = target;
}

function popTarget() {
  Dep.target = targetStack.pop();
}

// Watcher class - The object that will be notified when data changes
class Watcher {
  constructor(vm, key, callback) {
    this.vm = vm;
    this.key = key;
    this.callback = callback;
    
    try {
      // Save current watcher instance
      pushTarget(this);
      
      // Access the property to trigger the getter and register this watcher
      vm[key];
      
      // Reset for next use
      popTarget();
      
      // Initial call to render
      this.update();
    } catch (error) {
      console.error('[MiVue] Error creating watcher for', key, error);
      popTarget();
    }
  }
  
  update() {
    try {
      this.callback.call(this.vm);
    } catch (error) {
      console.error('[MiVue] Error in watcher update:', error);
    }
  }
  
  addDep(dep) {
    // Default implementation is a no-op
    // This will be overridden in ComputedWatcher
  }
}

// Special watcher for computed properties
class ComputedWatcher extends Watcher {
  constructor(vm, getter, callback, options) {
    super(vm, '_computed', callback); // Use a placeholder key
    this.vm = vm;
    this.getter = getter;
    this.callback = callback;
    this.deps = [];
    this.depIds = new Set();
    this.dirty = true; // Whether computed value needs to be recalculated
    this.value = undefined;
    
    // Override key to use the getter function
    this.key = options && options.computed ? 'computed' : undefined;
    
    // Don't evaluate immediately for computed properties
    this.lazy = options && options.computed;
    
    if (!this.lazy) {
      this.evaluate();
    }
  }
  
  // Add dependency
  addDep(dep) {
    const id = dep.id;
    if (!this.depIds.has(id)) {
      this.depIds.add(id);
      this.deps.push(dep);
      dep.addSub(this);
    }
  }
  
  // Evaluate the value
  evaluate() {
    try {
      pushTarget(this);
      this.value = this.getter.call(this.vm);
      this.dirty = false;
      popTarget();
      return this.value;
    } catch (error) {
      console.error('[MiVue] Error evaluating computed property:', error);
      popTarget();
      return undefined;
    }
  }
  
  // Mark as dirty when dependencies change
  update() {
    if (this.lazy) {
      this.dirty = true;
    } else {
      super.update();
    }
  }
}

// For browser support
if (typeof window !== 'undefined') {
  window.MiVue = window.MiVue || MiVue;
}

// For module support
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MiVue;
} 