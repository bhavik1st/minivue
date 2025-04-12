# MiVue in MicroPython

This document explores the possibility of implementing MiVue using MicroPython in a browser environment.

## Using MicroPython in Browser

There are several options to run Python in the browser:

1. **Pyodide** - WebAssembly-based Python runtime
2. **Brython** - Python interpreter implemented in JavaScript
3. **Skulpt** - Another Python-to-JavaScript implementation

## Implementation Approach

```python
# Example using Brython to create a MiVue-like object
from browser import document, html

class MicroVue:
    def __init__(self, options):
        self.el = document.querySelector(options['el'])
        self.data = options.get('data', {})
        self._setup_reactivity()
        self._compile()
    
    def _setup_reactivity(self):
        # Simplified reactivity system
        # Would need JavaScript interop for real proxy-based reactivity
        self._watchers = []
        
    def _compile(self):
        # Process and update DOM based on template
        if self.el:
            self._process_node(self.el)
    
    def _process_node(self, node):
        # Process text interpolation and directives
        if hasattr(node, 'nodeType') and node.nodeType == 3:  # Text node
            self._process_text(node)
        elif hasattr(node, 'attributes'):
            # Process attributes/directives
            for attr in node.attributes:
                if attr.name.startswith('m-'):
                    directive = attr.name[2:]
                    if directive == 'model':
                        self._bind_model(node, attr.value)
        
        # Process children
        for child in node.childNodes:
            self._process_node(child)
    
    def _process_text(self, node):
        # Simple template parsing
        text = node.textContent
        # Implementation for {{ ... }} interpolation would go here
        
    def _bind_model(self, node, key):
        # Two-way binding implementation
        node.value = self.data.get(key, '')
        
        def update_model(event):
            self.data[key] = event.target.value
            
        node.bind('input', update_model)

# Usage
app = MicroVue({
    'el': '#app',
    'data': {
        'message': 'Hello from MicroPython!'
    }
})
```

## Challenges

1. **Performance**: Python in browser is slower than native JavaScript
2. **DOM Interaction**: More complex as you need to bridge Python and DOM APIs
3. **Reactivity**: JavaScript's Proxy is more powerful than what's easily available in Python
4. **Integration**: Using existing JS libraries becomes more difficult

## When This Approach Makes Sense

1. You're working with MicroPython devices and want code consistency
2. You're building a Python-focused educational tool
3. Your team is more comfortable with Python than JavaScript

For most web applications, using the JavaScript version of MiVue would be more efficient, but the Python approach could be an interesting experiment or useful in specialized scenarios.

## Extended Example with More Features

```python
from browser import document, html, window

class MicroVue:
    def __init__(self, options):
        self.el = document.querySelector(options['el'])
        self.data = options.get('data', {})
        self.methods = options.get('methods', {})
        
        # Bind methods to the instance
        for name, method in self.methods.items():
            setattr(self, name, method.__get__(self, self.__class__))
        
        self._setup_reactivity()
        self._compile()
    
    def _setup_reactivity(self):
        # Create a simple observer pattern
        self._subscribers = {}
        
        # We need to use JavaScript's Object.defineProperty for proper reactivity
        for key in self.data:
            self._define_reactive_property(key)
    
    def _define_reactive_property(self, key):
        # Need to use JavaScript interop for true reactivity
        value = self.data[key]
        subscribers = self._subscribers
        
        # Get/set accessors in Python
        def getter(self):
            return value
        
        def setter(self, new_value):
            nonlocal value
            if new_value != value:
                value = new_value
                # Notify subscribers
                if key in subscribers:
                    for callback in subscribers[key]:
                        callback(new_value)
        
        # Add property to the instance
        setattr(self.__class__, key, property(getter, setter))
    
    def _subscribe(self, key, callback):
        if key not in self._subscribers:
            self._subscribers[key] = []
        self._subscribers[key].append(callback)
    
    def _compile(self):
        if self.el:
            self._process_node(self.el)
    
    def _process_node(self, node):
        # Handle text nodes (for {{ ... }} interpolation)
        if hasattr(node, 'nodeType') and node.nodeType == 3:
            self._process_text(node)
            return
        
        # Handle element nodes
        if hasattr(node, 'attributes'):
            # Check for directives
            attrs_to_process = []
            for attr in node.attributes:
                attrs_to_process.append((attr.name, attr.value))
            
            for name, value in attrs_to_process:
                # Handle m-for directive first (needs to be processed before other directives)
                if name == 'm-for':
                    self._bind_for(node, value)
                    return  # Skip other processing for this node
            
            for name, value in attrs_to_process:
                if name == 'm-model':
                    self._bind_model(node, value)
                elif name == 'm-if':
                    self._bind_if(node, value)
                elif name.startswith('@') or name.startswith('m-on:'):
                    event_name = name[1:] if name.startswith('@') else name[5:]
                    self._bind_event(node, event_name, value)
        
        # Process children recursively (if not already processed by m-for)
        children = list(node.childNodes)  # Make a copy because the list might change
        for child in children:
            self._process_node(child)
    
    def _process_text(self, node):
        text = node.textContent
        if '{{' in text and '}}' in text:
            # Extract bindings
            parts = []
            last_index = 0
            
            # Simple parser for {{ ... }} syntax
            while True:
                start_idx = text.find('{{', last_index)
                if start_idx == -1:
                    # Add the remaining text
                    if last_index < len(text):
                        parts.append(('text', text[last_index:]))
                    break
                
                # Add text before the {{ expression
                if start_idx > last_index:
                    parts.append(('text', text[last_index:start_idx]))
                
                # Find the closing }}
                end_idx = text.find('}}', start_idx)
                if end_idx == -1:
                    # No closing }}, treat the rest as text
                    parts.append(('text', text[last_index:]))
                    break
                
                # Extract the expression
                expr = text[start_idx + 2:end_idx].strip()
                parts.append(('expr', expr))
                
                last_index = end_idx + 2
            
            # Create update function
            def update_text():
                result = ''
                for part_type, part_value in parts:
                    if part_type == 'text':
                        result += part_value
                    else:  # expr
                        if part_value in self.data:
                            result += str(getattr(self, part_value))
                        else:
                            # Try to evaluate as a simple expression
                            try:
                                # Very limited eval for simple expressions
                                # In a real implementation, you'd want a more sophisticated approach
                                result += str(eval(part_value, {'self': self}))
                            except:
                                result += f"[Error: {part_value}]"
                
                node.textContent = result
            
            # Initial update
            update_text()
            
            # Subscribe to data changes
            for _, expr in parts:
                if expr in self.data:
                    self._subscribe(expr, lambda _: update_text())
    
    def _bind_model(self, node, key):
        # Set initial value
        if hasattr(node, 'value'):
            node.value = getattr(self, key, '')
        
        # Add event listener for input changes
        def update_model(event):
            setattr(self, key, event.target.value)
        
        node.bind('input', update_model)
        
        # Subscribe to data changes
        self._subscribe(key, lambda new_value: setattr(node, 'value', new_value))
    
    def _bind_if(self, node, condition):
        original_display = node.style.display or 'block'
        comment_placeholder = document.createComment(f' m-if: {condition} ')
        
        # Create update function
        def update_visibility():
            value = getattr(self, condition, False) if condition in self.data else False
            
            if value:
                if not node.isConnected:
                    comment_placeholder.parentNode.insertBefore(node, comment_placeholder.nextSibling)
                node.style.display = original_display
            else:
                if node.isConnected:
                    node.style.display = 'none'
        
        # Initial update
        update_visibility()
        
        # Subscribe to changes
        if condition in self.data:
            self._subscribe(condition, lambda _: update_visibility())
    
    def _bind_event(self, node, event, handler_expr):
        # Parse the handler expression
        method_name = handler_expr
        if '(' in handler_expr:
            method_name = handler_expr.split('(')[0].strip()
        
        # Check if the method exists
        if method_name in self.methods:
            method = getattr(self, method_name)
            
            # Bind the event
            def event_handler(event):
                method(event)
            
            node.bind(event, event_handler)
    
    def _bind_for(self, node, expression):
        # Parse the expression (e.g., "item in items")
        parts = expression.split(' in ')
        if len(parts) != 2:
            return
        
        item_name = parts[0].strip()
        items_name = parts[1].strip()
        
        # Get the parent node and create a comment placeholder
        parent = node.parentNode
        start_comment = document.createComment(f' m-for: {expression} ')
        end_comment = document.createComment(f' /m-for ')
        
        parent.insertBefore(start_comment, node)
        parent.insertBefore(end_comment, node.nextSibling)
        parent.removeChild(node)
        
        # Store the template
        template_node = node.cloneNode(True)
        
        # Function to render the list
        def render_list():
            # Clear existing items
            current = start_comment.nextSibling
            while current and current != end_comment:
                next_node = current.nextSibling
                parent.removeChild(current)
                current = next_node
            
            # Get the array
            items = getattr(self, items_name, [])
            
            # Render each item
            for item in items:
                # Clone the template
                clone = template_node.cloneNode(True)
                
                # Replace bindings in the clone
                # This is a simplified approach; a real implementation would be more sophisticated
                self._process_for_clone(clone, item_name, item)
                
                # Add to the DOM
                parent.insertBefore(clone, end_comment)
        
        # Initial render
        render_list()
        
        # Subscribe to changes
        if items_name in self.data:
            self._subscribe(items_name, lambda _: render_list())
    
    def _process_for_clone(self, node, item_name, item):
        # Process text nodes for interpolation
        if hasattr(node, 'nodeType') and node.nodeType == 3:
            text = node.textContent
            if '{{' in text and '}}' in text:
                result = ''
                last_index = 0
                
                while True:
                    start_idx = text.find('{{', last_index)
                    if start_idx == -1:
                        result += text[last_index:]
                        break
                    
                    result += text[last_index:start_idx]
                    end_idx = text.find('}}', start_idx)
                    
                    if end_idx == -1:
                        result += text[start_idx:]
                        break
                    
                    expr = text[start_idx + 2:end_idx].strip()
                    
                    # Replace item references
                    if expr == item_name:
                        result += str(item)
                    elif expr.startswith(f"{item_name}."):
                        prop = expr[len(item_name) + 1:]
                        result += str(item.get(prop, '')) if isinstance(item, dict) else str(getattr(item, prop, ''))
                    else:
                        # Keep other expressions unchanged
                        result += f"{{{{ {expr} }}}}"
                    
                    last_index = end_idx + 2
                
                node.textContent = result
        
        # Process attributes and continue with children
        if hasattr(node, 'attributes'):
            for attr in node.attributes:
                # Handle special attribute bindings for m-for items
                pass
        
        # Process children
        for child in node.childNodes:
            self._process_for_clone(child, item_name, item)

# Example usage
app = MicroVue({
    'el': '#app',
    'data': {
        'message': 'Hello from MicroPython!',
        'todos': [
            {'text': 'Learn MicroVue', 'completed': False},
            {'text': 'Build something awesome', 'completed': False}
        ],
        'showCompleted': True
    },
    'methods': {
        'addTodo': lambda self: self.todos.append({'text': 'New Todo', 'completed': False}),
        'clearCompleted': lambda self: setattr(self, 'todos', [todo for todo in self.todos if not todo['completed']])
    }
})
```

## Resources

For more information on Python in the browser:

- Brython: [https://brython.info/](https://brython.info/)
- Pyodide: [https://pyodide.org/](https://pyodide.org/)
- Skulpt: [https://skulpt.org/](https://skulpt.org/) 