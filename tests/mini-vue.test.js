// add import for MiVue
const MiVue = global.MiVue;

// Test suite for MiVue
describe('MiVue Framework Tests', function() {
  // Setup mock DOM environment before each test
  let container;
  
  beforeEach(function() {
    // Create a fresh container for each test
    container = document.createElement('div');
    document.body.appendChild(container);
  });
  
  afterEach(function() {
    // Clean up after each test
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
    container = null;
  });
  
  // Test basic data binding
  describe('Data Binding', function() {
    it('should bind data to the view', function(done) {
      container.innerHTML = '<div id="app"><p>{{ message }}</p></div>';
      
      const app = new MiVue({
        el: '#app',
        data: {
          message: 'Hello MiVue'
        }
      });
      
      const p = container.querySelector('p');
      assert.equal(p.textContent, 'Hello MiVue');
      
      // Test reactivity
      app.message = 'Updated Message';
      // We need to wait for the DOM to update
      setTimeout(() => {
        assert.equal(p.textContent, 'Updated Message');
        done();
      }, 50);
    });
  });
  
  // Test two-way data binding with m-model
  describe('m-model Directive', function() {
    it('should create two-way binding for input elements', function(done) {
      container.innerHTML = '<div id="app"><input m-model="message"><p>{{ message }}</p></div>';
      
      const app = new MiVue({
        el: '#app',
        data: {
          message: 'Hello MiVue'
        }
      });
      
      const input = container.querySelector('input');
      const p = container.querySelector('p');
      
      // Check initial value
      assert.equal(input.value, 'Hello MiVue');
      assert.equal(p.textContent, 'Hello MiVue');
      
      // Update input and check if data and view update
      input.value = 'Updated via input';
      // Dispatch input event to trigger the handler
      const event = new Event('input');
      input.dispatchEvent(event);
      
      // Check data model update
      assert.equal(app.message, 'Updated via input');
      
      // Check view update
      setTimeout(() => {
        assert.equal(p.textContent, 'Updated via input');
        done();
      }, 50);
    });
    
    it('should handle checkbox elements correctly', function(done) {
      container.innerHTML = '<div id="app"><input type="checkbox" m-model="checked"><p>{{ checked }}</p></div>';
      
      const app = new MiVue({
        el: '#app',
        data: {
          checked: true
        }
      });
      
      const checkbox = container.querySelector('input');
      const p = container.querySelector('p');
      
      // Check initial state
      assert.equal(checkbox.checked, true);
      assert.equal(p.textContent, 'true');
      
      // Toggle checkbox
      checkbox.checked = false;
      const event = new Event('change');
      checkbox.dispatchEvent(event);
      
      // Check data update
      assert.equal(app.checked, false);
      
      // Check view update
      setTimeout(() => {
        assert.equal(p.textContent, 'false');
        done();
      }, 50);
    });
  });
  
  // Test conditional rendering with m-if
  describe('m-if Directive', function() {
    it('should conditionally render elements', function(done) {
      container.innerHTML = '<div id="app"><div m-if="show">Conditional Content</div></div>';
      
      const app = new MiVue({
        el: '#app',
        data: {
          show: true
        },
        debug: true // Enable debugging to help trace what's happening
      });
      
      const conditional = container.querySelector('div > div');
      
      // Element should be visible initially (by default display is empty string)
      assert.notEqual(conditional.style.display, 'none');
      
      // Hide the element
      app.show = false;
      
      // Need to wait for the DOM to update
      setTimeout(() => {
        try {
          // Check if the element is hidden
          assert.equal(conditional.style.display, 'none');
          
          // Show the element again
          app.show = true;
          
          // Wait for the DOM to update again
          setTimeout(() => {
            try {
              // Element should be visible now (not having display: none)
              assert.notEqual(conditional.style.display, 'none');
              done(); // Signal that the test is complete
            } catch (e) {
              done(e);
            }
          }, 100);
        } catch (e) {
          done(e);
        }
      }, 100);
    });
  });
  
  // Test event handling
  describe('Event Handling', function() {
    it('should handle click events with m-on:click', function(done) {
      container.innerHTML = '<div id="app"><button m-on:click="increment">Increment</button><p>{{ counter }}</p></div>';
      
      const app = new MiVue({
        el: '#app',
        data: {
          counter: 0
        },
        methods: {
          increment() {
            this.counter++;
          }
        }
      });
      
      const button = container.querySelector('button');
      const p = container.querySelector('p');
      
      // Initial counter value
      assert.equal(p.textContent, '0');
      
      // Click the button
      button.click();
      
      // Counter should be incremented
      assert.equal(app.counter, 1);
      
      // View should be updated
      setTimeout(() => {
        assert.equal(p.textContent, '1');
        done();
      }, 10);
    });
    
    it('should handle click events with @click shorthand', function(done) {
      container.innerHTML = '<div id="app"><button @click="decrement">Decrement</button><p>{{ counter }}</p></div>';
      
      const app = new MiVue({
        el: '#app',
        data: {
          counter: 10
        },
        methods: {
          decrement() {
            this.counter--;
          }
        }
      });
      
      const button = container.querySelector('button');
      const p = container.querySelector('p');
      
      // Initial counter value
      assert.equal(p.textContent, '10');
      
      // Click the button
      button.click();
      
      // Counter should be decremented
      assert.equal(app.counter, 9);
      
      // View should be updated
      setTimeout(() => {
        assert.equal(p.textContent, '9');
        done();
      }, 10);
    });

    it('should handle event with parameters', function(done) {
      container.innerHTML = '<div id="app"><button @click="addAmount(5)">Add 5</button><p>{{ counter }}</p></div>';
      
      const app = new MiVue({
        el: '#app',
        data: {
          counter: 0
        },
        methods: {
          addAmount(amount) {
            this.counter += amount;
          }
        }
      });
      
      const button = container.querySelector('button');
      const p = container.querySelector('p');
      
      // Initial counter value
      assert.equal(p.textContent, '0');
      
      // Click the button
      button.click();
      
      // Counter should be increased by 5
      assert.equal(app.counter, 5);
      
      // View should be updated
      setTimeout(() => {
        assert.equal(p.textContent, '5');
        done();
      }, 10);
    });

    it('should handle $event parameter', function(done) {
      // For this test, we can use a simpler approach since DOM event details might differ
      container.innerHTML = `
        <div id="app">
          <button @click="captureEventType($event)">Click Me</button>
          <p>{{ eventType }}</p>
        </div>
      `;
      
      const app = new MiVue({
        el: '#app',
        data: {
          eventType: 'none'
        },
        methods: {
          captureEventType(event) {
            this.eventType = event.type;
          }
        }
      });
      
      const button = container.querySelector('button');
      const p = container.querySelector('p');
      
      // Initial value
      assert.equal(p.textContent, 'none');
      
      // Click button
      button.click();
      
      // Event type should be captured
      assert.equal(app.eventType, 'click');
      
      // View should be updated
      setTimeout(() => {
        assert.equal(p.textContent, 'click');
        done();
      }, 10);
    });
    
    it('should handle multiple event types', function(done) {
      // Use click events for more reliable testing in JSDOM
      container.innerHTML = `
        <div id="app">
          <button class="btn1" @click="logEvent('button1')">Button 1</button>
          <button class="btn2" @click="logEvent('button2')">Button 2</button>
          <p>{{ lastEvent }}</p>
        </div>
      `;
      
      const app = new MiVue({
        el: '#app',
        data: {
          lastEvent: 'none'
        },
        methods: {
          logEvent(type) {
            this.lastEvent = type;
          }
        }
      });
      
      const btn1 = container.querySelector('.btn1');
      const btn2 = container.querySelector('.btn2');
      const p = container.querySelector('p');
      
      // Initial value
      assert.equal(p.textContent, 'none');
      
      // Click first button
      btn1.click();
      
      // Check update
      assert.equal(app.lastEvent, 'button1');
      
      // View should be updated
      setTimeout(() => {
        assert.equal(p.textContent, 'button1');
      }, 10);
      
      // Click second button
      btn2.click();
      
      // Check update
      assert.equal(app.lastEvent, 'button2');
      
      // View should be updated
      setTimeout(() => {
        assert.equal(p.textContent, 'button2');
        done();
      }, 10);
    });

    it('should handle data property in event parameters', function(done) {
      container.innerHTML = `
        <div id="app">
          <button @click="multiplyValue(factor)">Multiply by {{factor}}</button>
          <p>{{ value }}</p>
        </div>
      `;
      
      const app = new MiVue({
        el: '#app',
        data: {
          value: 10,
          factor: 2
        },
        methods: {
          multiplyValue(factor) {
            this.value = this.value * factor;
          }
        }
      });
      
      const button = container.querySelector('button');
      const p = container.querySelector('p');
      
      // Initial value
      assert.equal(p.textContent, '10');
      
      // Click to multiply by factor (2)
      button.click();
      
      // Check value was multiplied
      assert.equal(app.value, 20);
      
      // Update factor and click again
      app.factor = 3;
      button.click();
      
      // Check value
      assert.equal(app.value, 60); // 20 * 3
      
      // View should be updated
      setTimeout(() => {
        assert.equal(p.textContent, '60');
        done();
      }, 10);
    });
  });
  
  // Test attribute binding with m-bind
  describe('Attribute Binding', function() {
    it('should bind attributes with m-bind syntax', function(done) {
      container.innerHTML = `
        <div id="app">
          <input m-bind:placeholder="placeholderText">
        </div>
      `;
      
      const app = new MiVue({
        el: '#app',
        data: {
          placeholderText: 'Enter your name'
        }
      });
      
      const input = container.querySelector('input');
      
      // Check initial attribute binding
      assert.equal(input.getAttribute('placeholder'), 'Enter your name');
      
      // Update the bound value
      app.placeholderText = 'Type here...';
      
      // Check if attribute updated
      setTimeout(() => {
        assert.equal(input.getAttribute('placeholder'), 'Type here...');
        done();
      }, 10);
    });
    
    it('should bind attributes with shorthand syntax', function(done) {
      container.innerHTML = `
        <div id="app">
          <a :href="linkUrl" :target="linkTarget">Link</a>
        </div>
      `;
      
      const app = new MiVue({
        el: '#app',
        data: {
          linkUrl: 'https://example.com',
          linkTarget: '_blank'
        }
      });
      
      const link = container.querySelector('a');
      
      // Check initial attribute bindings
      assert.equal(link.getAttribute('href'), 'https://example.com');
      assert.equal(link.getAttribute('target'), '_blank');
      
      // Update the bound values
      app.linkUrl = 'https://updated.com';
      app.linkTarget = '_self';
      
      // Check if attributes updated
      setTimeout(() => {
        assert.equal(link.getAttribute('href'), 'https://updated.com');
        assert.equal(link.getAttribute('target'), '_self');
      }, 10);
    });
    
    it('should handle boolean attributes correctly', function(done) {
      container.innerHTML = `
        <div id="app">
          <button :disabled="isDisabled">Button</button>
        </div>
      `;
      
      const app = new MiVue({
        el: '#app',
        data: {
          isDisabled: true
        }
      });
      
      const button = container.querySelector('button');
      
      // Check initial state
      assert.equal(button.getAttribute('disabled'), 'true');
      
      // Change the value
      app.isDisabled = false;
      
      // Check updated state
      setTimeout(() => {
        assert.equal(button.getAttribute('disabled'), null);
        done();
      }, 50);
    });
    
    it('should handle expressions in attribute bindings', function(done) {
      container.innerHTML = `
        <div id="app">
          <div :class="'status-' + statusType">Status</div>
        </div>
      `;
      
      const app = new MiVue({
        el: '#app',
        data: {
          statusType: 'active'
        }
      });
      
      const div = container.querySelector('#app > div');
      
      // Check initial class
      assert.equal(div.getAttribute('class'), 'status-active');
      
      // Update the status
      app.statusType = 'inactive';
      
      // Check updated class
      setTimeout(() => {
        assert.equal(div.getAttribute('class'), 'status-inactive');
        done();
      }, 50);
    });

    it('should handle numeric attribute bindings', function(done) {
      container.innerHTML = `
        <div id="app">
          <input :maxlength="maxLength">
        </div>
      `;
      
      const app = new MiVue({
        el: '#app',
        data: {
          maxLength: 10
        }
      });
      
      const input = container.querySelector('input');
      
      // Check initial value
      assert.equal(input.getAttribute('maxlength'), '10');
      assert.equal(progress.getAttribute('value'), '25');
      assert.equal(progress.getAttribute('max'), '100');
      
      // Update the bound value
      app.progressValue = 75;
      
      // Check if value updated
      setTimeout(() => {
        assert.equal(progress.getAttribute('value'), '75');
      }, 10);
    });
  });

  // Test m-for directive
  describe('m-for Directive', function() {
    it('should render list items correctly', function(done) {
      container.innerHTML = '<div id="app"><div><div m-for="item in items">{{ item.name }}</div></div></div>';
      
      const app = new MiVue({
        el: '#app',
        data: {
          items: [
            { name: 'Item 1' },
            { name: 'Item 2' },
            { name: 'Item 3' }
          ]
        }
      });
      
      // Wait for the rendering to complete
      setTimeout(() => {
        // Should have 3 divs (one for each item)
        const renderedItems = container.querySelectorAll('#app > div > div');
        assert.equal(renderedItems.length, 3);
        
        // Check content of each item
        assert.equal(renderedItems[0].textContent, 'Item 1');
        assert.equal(renderedItems[1].textContent, 'Item 2');
        assert.equal(renderedItems[2].textContent, 'Item 3');
        
        done();
      }, 50);
    });

    it('should update when array is modified', function(done) {
      container.innerHTML = '<div id="app"><div><div m-for="item in items">{{ item.name }}</div></div></div>';
      
      const app = new MiVue({
        el: '#app',
        data: {
          items: [
            { name: 'Item 1' },
            { name: 'Item 2' }
          ]
        }
      });
      
      // Wait for initial rendering
      setTimeout(() => {
        // Should have 2 items initially
        let renderedItems = container.querySelectorAll('#app > div > div');
        assert.equal(renderedItems.length, 2);
        
        // Add a new item
        app.items.push({ name: 'Item 3' });
        
        // Wait for update
        setTimeout(() => {
          // Should now have 3 items
          renderedItems = container.querySelectorAll('#app > div > div');
          assert.equal(renderedItems.length, 3);
          assert.equal(renderedItems[2].textContent, 'Item 3');
          
          // Remove an item
          app.items.splice(0, 1);
          
          // Wait for update
          setTimeout(() => {
            // Should now have 2 items again
            renderedItems = container.querySelectorAll('#app > div > div');
            assert.equal(renderedItems.length, 2);
            assert.equal(renderedItems[0].textContent, 'Item 2');
            assert.equal(renderedItems[1].textContent, 'Item 3');
            
            done();
          }, 50);
        }, 50);
      }, 50);
    });
  });

  // Test computed properties
  describe('Computed Properties', function() {
    it('should calculate derived values', function(done) {
      container.innerHTML = '<div id="app"><p>{{ count }}</p><p>{{ doubled }}</p></div>';
      
      const app = new MiVue({
        el: '#app',
        data: {
          count: 2
        },
        computed: {
          doubled() {
            return this.count * 2;
          }
        }
      });
      
      const paragraphs = container.querySelectorAll('p');
      
      // Check initial values
      assert.equal(paragraphs[0].textContent, '2');
      assert.equal(paragraphs[1].textContent, '4');
      
      // Update data
      app.count = 5;
      
      // Check updated computed value
      setTimeout(() => {
        assert.equal(paragraphs[0].textContent, '5');
        assert.equal(paragraphs[1].textContent, '10');
        done();
      }, 50);
    });
  });
});
