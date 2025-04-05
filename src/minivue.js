// MiniVue - A minimal Vue-inspired JavaScript framework
const PREFIX = 'm-';
const VALID_DIRECTIVES = ['model', 'if', 'for', 'bind', 'on'];
const VALID_EVENTS = ['click', 'change', 'input', 'submit', 'keydown', 'keyup', 'mouseover', 'mouseout', 'mousemove', 'mouseenter', 'mouseleave'];
class MiniVue {
  constructor(options) {
    this.$options = options || {};
    this.$data = options.data || {};
    this.$el = typeof options.el === 'string' 
      ? document.querySelector(options.el) 
      : options.el;
    this.debug = options.debug || false;
    
    try {
      this.log('Initializing MiniVue instance');
      // Make data properties reactive
      this._observe(this.$data);
      
      // Proxy data properties to MiniVue instance
      for (let key in this.$data) {
        Object.defineProperty(this, key, {
          get: () => this.$data[key],
          set: val => {
            this.$data[key] = val;
          }
        });
      }
      
      // Setup computed properties
      this._initComputed(options.computed || {});
      
      // Bind methods to the instance
      this._bindMethods(options.methods || {});
      
      // Initialize DOM
      if (this.$el) {
        this._compile(this.$el);
      } else {
        this.log('Warning: No element provided, DOM compilation skipped');
      }
    } catch (error) {
      console.error('[MiniVue] Initialization error:', error);
    }
  }
  
  // Initialize computed properties
  _initComputed(computed) {
    try {
      this.log('Setting up computed properties');
      
      // Create a new object to store computed properties
      this.$computed = {};
      const vm = this;
      
      // Setup each computed property
      for (let key in computed) {
        // Define getters/setters for computed properties
        Object.defineProperty(this.$computed, key, {
          enumerable: true,
          configurable: true,
          get: computed[key].bind(this)
        });
        
        // Define a getter/setter on the instance
        Object.defineProperty(this, key, {
          enumerable: true,
          configurable: true,
          get() {
            return vm.$computed[key];
          }
        });
      }
    } catch (error) {
      console.error('[MiniVue] Error setting up computed properties:', error);
    }
  }
  
  // Bind methods to the MiniVue instance
  _bindMethods(methods) {
    try {
      this.log('Binding methods to instance');
      for (let key in methods) {
        if (typeof methods[key] === 'function') {
          this[key] = methods[key].bind(this);
          this.log(`Method bound: ${key}`);
        } else {
          console.warn(`[MiniVue] Method ${key} is not a function`);
        }
      }
    } catch (error) {
      console.error('[MiniVue] Error binding methods:', error);
    }
  }
  
  // Logging method
  log(...args) {
    if (this.debug) {
      console.log('[MiniVue]', ...args);
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
        
        // For arrays, make them reactive
        if (Array.isArray(value)) {
          this._observeArray(value, dep);
        }
        
        // Store the instance reference
        const vm = this;
        
        Object.defineProperty(data, key, {
          get() {
            // When a property is accessed in a template rendering,
            // register it as a dependency
            if (Dep.target) {
              dep.addSub(Dep.target);
            }
            return value;
          },
          set(newValue) {
            if (value === newValue) return;
            value = newValue;
            
            // If the new value is an array, make it reactive
            if (Array.isArray(newValue)) {
              vm._observeArray(newValue, dep);
            }
            
            // Notify all subscribers that value has changed
            dep.notify();
          }
        });
      }
    } catch (error) {
      console.error('[MiniVue] Reactivity setup error:', error);
    }
  }
  
  // Make an array reactive
  _observeArray(array, dep) {
    try {
      // Store the dep for this array
      Object.defineProperty(array, '__dep__', {
        value: dep,
        enumerable: false,
        configurable: true
      });
      
      // Patch array methods to trigger updates
      const methodsToPatch = [
        'push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse'
      ];
      
      // Keep track of the original methods
      const arrayProto = Array.prototype;
      // Create a copy of the array prototype
      const patchedProto = Object.create(arrayProto);
      
      // Patch each method to trigger updates after mutation
      methodsToPatch.forEach(method => {
        patchedProto[method] = function(...args) {
          // Call the original method
          const result = arrayProto[method].apply(this, args);
          
          // Get the associated dep and notify
          const dep = this.__dep__;
          if (dep) {
            dep.notify();
          }
          
          return result;
        };
      });
      
      // Set the array's prototype to our patched version
      Object.setPrototypeOf(array, patchedProto);
      
      // Also observe any objects inside the array
      const vm = this;
      array.forEach(item => {
        if (typeof item === 'object' && item !== null) {
          vm._observe(item);
        }
      });
    } catch (error) {
      console.error('[MiniVue] Error making array reactive:', error);
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
          console.error('[MiniVue] Error compiling node:', nodeError, node);
        }
      });
    } catch (error) {
      console.error('[MiniVue] Template compilation error:', error);
    }
  }
  
  // Handle element node compilation
  _compileElement(node) {
    // Process element directives
    const attrs = node.attributes;
    
    // First check for m-for since it takes precedence
    let hasForDirective = false;
    for (let i = 0; i < attrs.length; i++) {
      const attr = attrs[i];
      if (attr.name === 'm-for') {
        hasForDirective = true;
        this._bindForDirective(node, attr.value);
        return; // Skip other directives on this node - they'll be processed on each clone
      }
    }
    
    // Process other directives if no m-for is present
    if (!hasForDirective) {
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
            
            // Handle m-bind directive
            else if (directive.startsWith('bind:')) {
              const attrToBind = directive.slice(5); // Extract attribute name after 'bind:'
              this._bindAttributeDirective(node, attrToBind, value);
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
          // Handle shorthand bind syntax :attribute
          else if (attrName.startsWith(':')) {
            const attrToBind = attrName.slice(1);
            this._bindAttributeDirective(node, attrToBind, value);
          }
        } catch (attrError) {
          console.error('[MiniVue] Error processing attribute:', attrError, attr);
        }
      });
      
      // Continue recursively for children
      if (node.childNodes.length > 0) {
        this._compile(node);
      }
    }
  }
  
  // Handle event binding directive
  _bindEventDirective(node, event, handlerExpression) {
    try {
      this.log(`Binding event ${event} to handler: ${handlerExpression}`);
      
      // Check if it's a direct method call or an expression
      if (handlerExpression.includes('(') && handlerExpression.includes(')')) {
        // It's an expression with arguments
        const methodName = handlerExpression.split('(')[0].trim();
        
        // Extract arguments if any
        let argsString = handlerExpression.substring(
          handlerExpression.indexOf('(') + 1, 
          handlerExpression.lastIndexOf(')')
        ).trim();
        
        // Check if the method exists
        if (typeof this[methodName] !== 'function') {
          console.warn(`[MiniVue] Method ${methodName} not defined`);
          return;
        }
        
        // Add event listener that evaluates the expression
        node.addEventListener(event, (e) => {
          try {
            // Create special $event variable that can be used in expressions
            this.$event = e;
            
            // Determine arguments to pass
            let args = [];
            if (argsString === '$event') {
              // Pass the event object as the only argument
              args = [e];
            } else if (argsString.length > 0) {
              // Handle multiple arguments by splitting on commas, but respecting parentheses
              // This is a simplified implementation - handles simple expressions
              args = argsString.split(',').map(arg => {
                arg = arg.trim();
                if (arg === '$event') return e;
                
                // Try to evaluate the argument
                try {
                  // Check if it's a variable reference or expression
                  if (arg.startsWith('-') && this.$data.hasOwnProperty(arg.substring(1))) {
                    // Handle negative variable reference (e.g., -value)
                    return -this.$data[arg.substring(1)];
                  } else if (this.$data.hasOwnProperty(arg)) {
                    // Handle direct data property reference
                    return this.$data[arg];
                  }
                  
                  // Otherwise try to parse it as a literal
                  if (arg === 'true') return true;
                  if (arg === 'false') return false;
                  if (arg === 'null') return null;
                  if (arg === 'undefined') return undefined;
                  
                  // Check if it's a number (including negative numbers)
                  const num = Number(arg);
                  if (!isNaN(num)) return num;
                  
                  // If it's a string literal (surrounded by quotes)
                  if ((arg.startsWith('"') && arg.endsWith('"')) || 
                      (arg.startsWith("'") && arg.endsWith("'"))) {
                    return arg.substring(1, arg.length - 1);
                  }
                  
                  // Default fallback
                  return arg;
                } catch (evalError) {
                  console.error('[MiniVue] Error evaluating argument:', evalError);
                  return undefined;
                }
              });
            }
            
            // Call the method with the evaluated arguments
            this[methodName].apply(this, args);
            
            // Clean up
            delete this.$event;
          } catch (evalError) {
            console.error('[MiniVue] Error evaluating expression:', evalError);
          }
        });
      } else {
        // Simple method call without arguments
        // Check if the method exists on the instance
        if (typeof this[handlerExpression] !== 'function') {
          console.warn(`[MiniVue] Method ${handlerExpression} not defined`);
          return;
        }
        
        // Add the event listener to the node
        node.addEventListener(event, (e) => {
          // Call the method with the event object
          this[handlerExpression](e);
        });
      }
    } catch (error) {
      console.error(`[MiniVue] Error binding event ${event}:`, error);
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
      console.error('[MiniVue] Error binding m-model:', error);
    }
  }
  
  // Handle m-if directive binding
  _bindIfDirective(node, value) {
    try {
      this.log(`Binding m-if for ${value}`);
      const initialDisplay = node.style.display || '';
      
      // Create watcher for conditional rendering
      new Watcher(this, value, () => {
        const currentVal = this.$data[value];
        this.log(`m-if watcher triggered for ${value} with value ${currentVal}`);
        node.style.display = currentVal ? initialDisplay : 'none';
        this.log(`Set display to: ${node.style.display}`);
      });
      
      // Initial render
      const currentVal = this.$data[value];
      this.log(`Initial m-if render for ${value} with value ${currentVal}`);
      node.style.display = currentVal ? initialDisplay : 'none';
      this.log(`Set initial display to: ${node.style.display}`);
    } catch (error) {
      console.error('[MiniVue] Error binding m-if:', error);
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
              newText = newText.replace(m, this.$data[k]);
            });
            node.textContent = newText;
          });
        });
        
        // Initial render
        let newText = rawText;
        matches.forEach(match => {
          const key = match.replace(/\{\{|\}\}/g, '').trim();
          newText = newText.replace(match, this.$data[key]);
        });
        node.textContent = newText;
      } catch (error) {
        console.error('[MiniVue] Error compiling text node:', error);
      }
    }
  }
  
  // Handle attribute binding directive
  _bindAttributeDirective(node, attr, value) {
    try {
      this.log(`Binding attribute ${attr} with value ${value}`);
      
      // Special handling for style attribute
      if (attr === 'style') {
        this._bindStyleAttribute(node, value);
        return;
      }
      
      // Function to update the attribute based on the current data state
      const updateAttribute = () => {
        try {
          if (this.$data.hasOwnProperty(value)) {
            // Direct property reference
            const attrValue = this.$data[value];
            if (attrValue === false || attrValue === null || attrValue === undefined) {
              node.removeAttribute(attr);
            } else {
              node.setAttribute(attr, attrValue);
            }
          } else {
            // For expressions or direct values
            this._evaluateAttributeExpression(node, attr, value);
          }
        } catch (updateError) {
          console.error(`[MiniVue] Error updating attribute ${attr}:`, updateError);
        }
      };
      
      // Initial attribute value
      updateAttribute();
      
      // Create watcher for this binding to update when data changes
      if (value.includes('+') || value.includes('-') || value.includes('*') || value.includes('/') || 
          value.includes('(') || value.includes(')')) {
        // For complex expressions, watch all involved data properties
        for (let key in this.$data) {
          if (value.includes(key)) {
            new Watcher(this, key, updateAttribute);
          }
        }
      } else {
        // For simple property references
        new Watcher(this, value, updateAttribute);
      }
    } catch (error) {
      console.error(`[MiniVue] Error binding attribute ${attr}:`, error);
    }
  }
  
  // Special handler for style binding
  _bindStyleAttribute(node, value) {
    try {
      this.log(`Binding style attribute with value ${value}`);
      
      // Function to update the style
      const updateStyle = () => {
        try {
          // Handle string expressions like "'border-color: ' + borderColor"
          if (value.includes('+')) {
            let styleValue = '';
            const parts = value.split('+');
            
            // Combine all parts, evaluating variables
            parts.forEach(part => {
              part = part.trim();
              
              // String literal
              if ((part.startsWith('"') && part.endsWith('"')) || 
                  (part.startsWith("'") && part.endsWith("'"))) {
                styleValue += part.substring(1, part.length - 1);
              } 
              // Data property
              else if (this.$data.hasOwnProperty(part)) {
                styleValue += this.$data[part];
              }
              // Direct value
              else {
                styleValue += part;
              }
            });
            
            // Apply the combined style string
            if (styleValue) {
              // Split into individual styles
              const styleProps = styleValue.split(';');
              styleProps.forEach(prop => {
                if (!prop.trim()) return;
                
                const [property, propertyValue] = prop.split(':');
                if (property && propertyValue) {
                  node.style[property.trim()] = propertyValue.trim();
                }
              });
            }
          }
          // Object syntax: { 'border-color': borderColor }
          else if (value.startsWith('{') && value.endsWith('}')) {
            try {
              // Extract key-value pairs
              const styleObject = value.substring(1, value.length - 1);
              const pairs = styleObject.split(',');
              
              pairs.forEach(pair => {
                if (!pair.trim()) return;
                
                const [property, propValue] = pair.split(':').map(p => p.trim());
                if (!property || !propValue) return;
                
                // Extract property name from quotes if present
                const propName = property.replace(/['"]/g, '');
                
                // Get property value 
                let finalValue;
                if ((propValue.startsWith('"') && propValue.endsWith('"')) || 
                    (propValue.startsWith("'") && propValue.endsWith("'"))) {
                  finalValue = propValue.substring(1, propValue.length - 1);
                } else if (this.$data.hasOwnProperty(propValue)) {
                  finalValue = this.$data[propValue];
                } else {
                  finalValue = propValue;
                }
                
                // Apply style
                node.style[propName] = finalValue;
              });
            } catch (objError) {
              console.error('[MiniVue] Error parsing style object:', objError);
            }
          }
          // Direct property reference
          else if (this.$data.hasOwnProperty(value)) {
            node.style.cssText = this.$data[value];
          }
        } catch (styleError) {
          console.error('[MiniVue] Error updating style:', styleError);
        }
      };
      
      // Initial style
      updateStyle();
      
      // Watch for changes in related data properties
      for (let key in this.$data) {
        if (value.includes(key)) {
          new Watcher(this, key, updateStyle);
        }
      }
    } catch (error) {
      console.error('[MiniVue] Error binding style attribute:', error);
    }
  }
  
  // Evaluate attribute expressions for more complex bindings
  _evaluateAttributeExpression(node, attr, expression) {
    try {
      // Handle simple literals
      if (expression === 'true') {
        node.setAttribute(attr, true);
      } else if (expression === 'false') {
        // For boolean attributes, remove them completely when false
        node.removeAttribute(attr);
      } else if (expression === 'null' || expression === 'undefined') {
        node.removeAttribute(attr);
      } else {
        // Try to evaluate as a number
        const num = Number(expression);
        if (!isNaN(num)) {
          node.setAttribute(attr, num);
          return;
        }
        
        // Check if it's a string literal with quotes
        if ((expression.startsWith('"') && expression.endsWith('"')) || 
            (expression.startsWith("'") && expression.endsWith("'"))) {
          node.setAttribute(attr, expression.substring(1, expression.length - 1));
          return;
        }
        
        // For complex expressions involving multiple data properties
        // This is a simplified implementation and doesn't handle all cases
        if (expression.includes('+') || expression.includes('-') || 
            expression.includes('*') || expression.includes('/')) {
          
          // Try to evaluate a simple expression with basic operations
          try {
            // Replace data properties with their values
            let evalExpr = expression;
            for (let key in this.$data) {
              const regex = new RegExp('\\b' + key + '\\b', 'g');
              evalExpr = evalExpr.replace(regex, this.$data[key]);
            }
            
            // Special case for string concatenation
            if (expression.includes('+') && 
                (expression.includes('"') || expression.includes("'"))) {
              // Handle string concatenation by evaluating and converting to string
              const result = eval(evalExpr);
              node.setAttribute(attr, result.toString());
              return;
            }
            
            // For other expressions
            const result = eval(evalExpr);
            node.setAttribute(attr, result);
            return;
          } catch (evalError) {
            console.warn(`[MiniVue] Couldn't evaluate expression ${expression}:`, evalError);
          }
        }
        
        // Default: use the expression as a literal string
        node.setAttribute(attr, expression);
      }
    } catch (error) {
      console.error(`[MiniVue] Error evaluating attribute expression:`, error);
    }
  }

  // Handle m-for directive binding
  _bindForDirective(node, expression) {
    try {
      this.log(`Binding m-for with expression: ${expression}`);
      
      // Parse the expression (item in items, or item, index in items)
      const forMatch = expression.match(/^\s*(\w+)(\s*,\s*(\w+))?\s+in\s+(\w+)\s*$/);
      if (!forMatch) {
        console.error(`[MiniVue] Invalid m-for expression: ${expression}`);
        return;
      }
      
      const itemName = forMatch[1];
      const indexName = forMatch[3] || null; // Optional index variable
      const arrayName = forMatch[4];
      
      if (!this.$data[arrayName] || !Array.isArray(this.$data[arrayName])) {
        console.warn(`[MiniVue] m-for array "${arrayName}" is not defined or not an array`);
        return;
      }
      
      // Store the template node
      const templateNode = node.cloneNode(true);
      templateNode.removeAttribute('m-for');
      
      // Create a comment node as anchor
      const anchorNode = document.createComment(`m-for: ${expression}`);
      node.parentNode.insertBefore(anchorNode, node);
      
       
      // Create end marker to mark the end of the m-for section
      const endMarker = document.createComment(`m-for-end: ${expression}`);
      node.parentNode.insertBefore(endMarker, node.nextSibling);

       
      // Keep a reference to all nodes created by this m-for directive
      const createdNodes = [];


      // Remove the original node
      node.parentNode.removeChild(node);
      
      // Create a function to render the list
      const renderList = () => {
        // Get the current state of the array
        const array = this.$data[arrayName];
        
        
        while (createdNodes.length > 0) {
          const nodeToRemove = createdNodes.pop();
          if (nodeToRemove.parentNode) {
            nodeToRemove.parentNode.removeChild(nodeToRemove);
          }
        }
        // // Clear existing nodes between anchor and end marker
        // let currentNode = anchorNode.nextSibling;
        // while (currentNode && currentNode.m_for_marker !== anchorNode) {
        //   const nextNode = currentNode.nextSibling;
        //   if (currentNode.m_for_item) {
        //     currentNode.parentNode.removeChild(currentNode);
        //   }
        //   currentNode = nextNode;
        // }
        
        // Create a document fragment to improve performance
        const fragment = document.createDocumentFragment();
        
        // Create a new node for each item in the array
        array.forEach((item, index) => {
          const clone = templateNode.cloneNode(true);
          
          // Mark this node as part of this for loop
          clone.m_for_item = true;
          clone.m_for_marker = anchorNode;
          
          // Add to our tracking array
          createdNodes.push(clone);

          // Create a "scope" for this iteration
          const createScope = (node) => {
            // Override the data property getters/setters for elements in this scope
            Object.defineProperty(node, 'm_for_scope', {
              value: {
                [itemName]: item,
              },
              enumerable: false
            });
            
            // If there's an index variable defined, add it to the scope
            if (indexName) {
              node.m_for_scope[indexName] = index;
            }
            
            // Apply the scope to all child nodes
            Array.from(node.childNodes).forEach(child => {
              if (child.nodeType === 1) { // Element node
                createScope(child);
              }
            });
          };
          
          createScope(clone);
          
          // Compile this clone with its scope
          this._compileForItem(clone);
          
          // Add to our document fragment
          fragment.appendChild(clone);
        });
      
        // Add all the new nodes at once for better performance
        // anchorNode.parentNode.insertBefore(fragment, anchorNode.nextSibling);
        anchorNode.parentNode.insertBefore(fragment, endMarker);
      };
      
      // Initial render
      renderList();
      
      // Set up watcher to re-render when the array changes
      new Watcher(this, arrayName, renderList);
      
    } catch (error) {
      console.error('[MiniVue] Error binding m-for:', error);
    }
  }

  // Compile a cloned m-for item with its own scope
  _compileForItem(node) {
    try {
      // Process element directives
      const attrs = node.attributes;
      
      if (attrs) {
        Array.from(attrs).forEach(attr => {
          try {
            const attrName = attr.name;
            const value = attr.value;
            
            if (attrName.startsWith('m-')) {
              const directive = attrName.slice(2);
              this.log(`Processing directive in m-for item: ${directive}`, value);
              
              // Handle m-model directive in for loop - needs special handling
              if (directive === 'model') {
                this._bindModelInForItem(node, value);
              }
              
              // Handle m-if directive
              else if (directive === 'if') {
                this._bindIfInForItem(node, value);
              }
              
              // Handle m-bind directive
              else if (directive.startsWith('bind:')) {
                const attrToBind = directive.slice(5);
                this._bindAttributeInForItem(node, attrToBind, value);
              }
              
              // Handle m-on directive (event handling)
              else if (directive.startsWith('on:')) {
                this._bindEventInForItem(node, directive.slice(3), value);
              }
            }
            // Handle shorthand event syntax @click
            else if (attrName.startsWith('@')) {
              const event = attrName.slice(1);
              this._bindEventInForItem(node, event, value);
            }
            // Handle shorthand bind syntax :attribute
            else if (attrName.startsWith(':')) {
              const attrToBind = attrName.slice(1);
              this._bindAttributeInForItem(node, attrToBind, value);
            }
          } catch (attrError) {
            console.error('[MiniVue] Error processing attribute in m-for item:', attrError, attr);
          }
        });
      }
      
      // Process text nodes
      Array.from(node.childNodes).forEach(child => {
        // Handle element nodes
        if (child.nodeType === 1) {
          this._compileForItem(child);
        }
        // Handle text nodes with mustache template syntax
        else if (child.nodeType === 3) {
          this._compileTextNodeInForItem(child, node.m_for_scope);
        }
      });
    } catch (error) {
      console.error('[MiniVue] Error compiling m-for item:', error);
    }
  }

  // Evaluate an expression within the m-for scope context
  _evaluateInForScope(expr, scope) {
    try {
      // Special handling for item property access
      for (const key in scope) {
        if (expr === key) {
          return scope[key];
        }
        // Check for property access on the item
        if (expr.startsWith(key + '.')) {
          const props = expr.substring(key.length + 1).split('.');
          let value = scope[key];
          for (const prop of props) {
            if (value === undefined || value === null) {
              return undefined;
            }
            value = value[prop];
          }
          return value;
        }
      }
      
      // For access to root data properties
      if (this.$data.hasOwnProperty(expr)) {
        return this.$data[expr];
      }
      
      return undefined;
    } catch (error) {
      console.error('[MiniVue] Error evaluating for scope expression:', error);
      return undefined;
    }
  }

  // Compile text node with interpolation within a for loop item
  _compileTextNodeInForItem(node, scope) {
    const reg = /\{\{(.*?)\}\}/g;
    const text = node.textContent;
    
    if (reg.test(text)) {
      try {
        this.log('Found text interpolation in m-for item');
        const matches = text.match(reg);
        const rawText = text;
        
        // Initial render
        let newText = rawText;
        matches.forEach(match => {
          const key = match.replace(/\{\{|\}\}/g, '').trim();
          // Try to evaluate in the for scope first, then fall back to root data
          const value = this._evaluateInForScope(key, scope);
          newText = newText.replace(match, value !== undefined ? value : '');
        });
        node.textContent = newText;
        
      } catch (error) {
        console.error('[MiniVue] Error compiling text node in m-for item:', error);
      }
    }
  }

  // Handle events within m-for item
  _bindEventInForItem(node, event, handlerExpression) {
    try {
      this.log(`Binding event ${event} to handler in m-for item: ${handlerExpression}`);
      
      // Get the scope from the node
      const scope = node.m_for_scope;
      
      // Handle method expressions with arguments
      if (handlerExpression.includes('(') && handlerExpression.includes(')')) {
        const methodName = handlerExpression.split('(')[0].trim();
        
        // Extract arguments
        let argsString = handlerExpression.substring(
          handlerExpression.indexOf('(') + 1, 
          handlerExpression.lastIndexOf(')')
        ).trim();
        
        // Check if the method exists
        if (typeof this[methodName] !== 'function') {
          console.warn(`[MiniVue] Method ${methodName} not defined`);
          return;
        }
        
        // Add event listener
        node.addEventListener(event, (e) => {
          try {
            this.$event = e;
            
            // Handle arguments
            let args = [];
            if (argsString === '$event') {
              args = [e];
            } else if (argsString.length > 0) {
              args = argsString.split(',').map(arg => {
                arg = arg.trim();
                if (arg === '$event') return e;
                
                // Try to evaluate in scope first
                const scopeValue = this._evaluateInForScope(arg, scope);
                if (scopeValue !== undefined) {
                  return scopeValue;
                }
                
                // Fall back to literals
                if (arg === 'true') return true;
                if (arg === 'false') return false;
                if (arg === 'null') return null;
                if (arg === 'undefined') return undefined;
                
                const num = Number(arg);
                if (!isNaN(num)) return num;
                
                if ((arg.startsWith('"') && arg.endsWith('"')) || 
                    (arg.startsWith("'") && arg.endsWith("'"))) {
                  return arg.substring(1, arg.length - 1);
                }
                
                return arg;
              });
            }
            
            // Call method with args
            this[methodName].apply(this, args);
            
            delete this.$event;
          } catch (evalError) {
            console.error('[MiniVue] Error in m-for event handler:', evalError);
          }
        });
      } else {
        // Simple handler without arguments
        if (typeof this[handlerExpression] !== 'function') {
          console.warn(`[MiniVue] Method ${handlerExpression} not defined`);
          return;
        }
        
        node.addEventListener(event, (e) => {
          this[handlerExpression](e);
        });
      }
    } catch (error) {
      console.error(`[MiniVue] Error binding event in m-for item:`, error);
    }
  }

  // Bind m-if within a for loop item
  _bindIfInForItem(node, value) {
    try {
      this.log(`Binding m-if in m-for item: ${value}`);
      const scope = node.m_for_scope;
      const initialDisplay = node.style.display || '';
      
      // Initial render
      const currentVal = this._evaluateInForScope(value, scope);
      node.style.display = currentVal ? initialDisplay : 'none';
    } catch (error) {
      console.error('[MiniVue] Error binding m-if in m-for item:', error);
    }
  }

  // Bind attributes within a for loop item
  _bindAttributeInForItem(node, attr, value) {
    try {
      this.log(`Binding attribute ${attr} in m-for item with value: ${value}`);
      const scope = node.m_for_scope;
      
      // Handle object expressions like :class="{'completed': todo.completed}"
      if (value.startsWith('{') && value.endsWith('}')) {
        // Parse the object expression
        try {
          // Extract key-value pairs from object syntax
          const objectContent = value.substring(1, value.length - 1).trim();
          if (objectContent) {
            // Handle class binding specially
            if (attr === 'class') {
              const currentClasses = (node.getAttribute('class') || '').split(' ').filter(Boolean);
              
              // Parse each class condition
              objectContent.split(',').forEach(pair => {
                // Extract class name and condition
                const matches = pair.match(/'([^']+)':\s*([^,}]+)/);
                if (matches) {
                  const className = matches[1];
                  const condition = matches[2].trim();
                  
                  // Evaluate the condition
                  const conditionValue = this._evaluateInForScope(condition, scope);
                  
                  // Apply or remove class based on condition
                  if (conditionValue) {
                    if (!currentClasses.includes(className)) {
                      currentClasses.push(className);
                    }
                  } else {
                    const index = currentClasses.indexOf(className);
                    if (index !== -1) {
                      currentClasses.splice(index, 1);
                    }
                  }
                }
              });
              
              // Update class attribute
              node.setAttribute('class', currentClasses.join(' '));
            }
          }
        } catch (objectError) {
          console.error('[MiniVue] Error parsing object expression:', objectError);
        }
      } else {
        // Regular attribute binding
        const attrValue = this._evaluateInForScope(value, scope);
        if (attrValue !== undefined) {
          node.setAttribute(attr, attrValue);
        }
      }
    } catch (error) {
      console.error(`[MiniVue] Error binding attribute in m-for item:`, error);
    }
  }

  // Bind m-model within a for loop item
  _bindModelInForItem(node, value) {
    try {
      this.log(`Binding m-model in m-for item: ${value}`);
      const scope = node.m_for_scope;
      
      // Get the item property path
      const parts = value.split('.');
      if (parts.length < 2) {
        console.warn(`[MiniVue] m-model in m-for should reference item properties: ${value}`);
        return;
      }
      
      const itemName = parts[0];
      if (!scope[itemName]) {
        console.warn(`[MiniVue] m-model references unknown item: ${itemName}`);
        return;
      }
      
      // Set initial value
      const propPath = parts.slice(1).join('.');
      let propContainer = scope[itemName];
      
      // Navigate to the containing object
      const propParts = propPath.split('.');
      for (let i = 0; i < propParts.length - 1; i++) {
        propContainer = propContainer[propParts[i]];
        if (!propContainer) return;
      }
      
      const finalProp = propParts[propParts.length - 1];
      
      // Handle different input types
      if (node.tagName === 'INPUT') {
        if (node.type === 'checkbox') {
          node.checked = propContainer[finalProp];
          node.addEventListener('change', () => {
            propContainer[finalProp] = node.checked;
          });
        } else {
          node.value = propContainer[finalProp];
          node.addEventListener('input', () => {
            propContainer[finalProp] = node.value;
          });
        }
      } else if (node.tagName === 'TEXTAREA') {
        node.value = propContainer[finalProp];
        node.addEventListener('input', () => {
          propContainer[finalProp] = node.value;
        });
      } else if (node.tagName === 'SELECT') {
        node.value = propContainer[finalProp];
        node.addEventListener('change', () => {
          propContainer[finalProp] = node.value;
        });
      }
    } catch (error) {
      console.error('[MiniVue] Error binding m-model in m-for item:', error);
    }
  }
}

// Dependency class
class Dep {
  constructor() {
    this.subs = [];
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
        console.error('[MiniVue] Error updating subscriber:', error);
      }
    });
  }
}

// Watcher class - The object that will be notified when data changes
class Watcher {
  constructor(vm, key, callback) {
    this.vm = vm;
    this.key = key;
    this.callback = callback;
    
    try {
      // Save current watcher instance
      Dep.target = this;
      
      // Access the property to trigger the getter and register this watcher
      vm[key];
      
      // Reset for next use
      Dep.target = null;
      
      // Initial call to render
      this.update();
    } catch (error) {
      console.error('[MiniVue] Error creating watcher for', key, error);
      Dep.target = null;
    }
  }
  
  update() {
    try {
      this.callback.call(this.vm);
    } catch (error) {
      console.error('[MiniVue] Error in watcher update:', error);
    }
  }
}
// For browser support
if (typeof window !== 'undefined') {
  window.MiniVue = window.MiniVue || MiniVue;
}

// For module support
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MiniVue;
} 
