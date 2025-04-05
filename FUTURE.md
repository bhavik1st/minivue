# MiniVue: Future Features Roadmap

This document outlines the next must-have features to be developed for MiniVue, inspired by Alpine.js and Vue.js.

## 1. Improved Reactivity with Proxy

```javascript
// Current approach uses Object.defineProperty
// Proxy-based system would allow reactive arrays and better object tracking
const reactiveData = createReactive({
  count: 0,
  items: []
}); 
// Adding items to arrays would automatically trigger updates
```

## 2. Component System

```html
<div id="app">
  <!-- Reusable component with props -->
  <todo-item 
    m-for="item in todos" 
    m-bind:todo="item"
    @delete="deleteTodo">
  </todo-item>
</div>

<script>
  MiniVue.component('todo-item', {
    props: ['todo'],
    template: `
      <div class="todo-item">
        <span>{{ todo.text }}</span>
        <button @click="$emit('delete', todo)">×</button>
      </div>
    `,
  });
</script>
```

## 3. Template Refs

```html
<input m-ref="searchInput">
<button @click="focusSearch">Focus Search</button>

<script>
  methods: {
    focusSearch() {
      this.$refs.searchInput.focus();
    }
  }
</script>
```

## 4. Lifecycle Hooks

```javascript
new MiniVue({
  created() {
    // Called after instance is created
    console.log('Component created');
  },
  mounted() {
    // Called after DOM is mounted
    console.log('DOM mounted');
  },
  updated() {
    // Called after data changes
    console.log('Component updated');
  },
  beforeDestroy() {
    // Cleanup before instance is destroyed
    console.log('Component will be destroyed');
  }
});
```

## 5. Transitions and Animations

```html
<m-transition name="fade">
  <div m-if="show">Animated content</div>
</m-transition>

<style>
  .fade-enter-active, .fade-leave-active {
    transition: opacity 0.5s;
  }
  .fade-enter, .fade-leave-to {
    opacity: 0;
  }
</style>
```

## 6. Show Directive (m-show)

```html
<!-- More efficient than m-if for frequent toggles -->
<div m-show="isVisible">This toggles visibility without removing from DOM</div>
```

## 7. Event Modifiers

```html
<!-- Stop event propagation -->
<button @click.stop="handleClick">Click me</button>

<!-- Prevent default behavior -->
<form @submit.prevent="submitForm">...</form>

<!-- Key modifiers -->
<input @keyup.enter="search">
```

## 8. Template Compilation

```javascript
// Precompile templates for better performance
const compiledTemplate = MiniVue.compile(`
  <div>
    <h1>{{ title }}</h1>
    <button @click="increment">{{ count }}</button>
  </div>
`);

new MiniVue({
  render: compiledTemplate
});
```

## 9. Directives API

```javascript
// Custom directives
MiniVue.directive('focus', {
  mounted(el) {
    el.focus();
  }
});

// Usage
<input m-focus>
```

## 10. State Management

```javascript
// Simple store like Pinia/Vuex
const store = MiniVue.createStore({
  state: {
    count: 0
  },
  mutations: {
    increment(state) {
      state.count++;
    }
  },
  actions: {
    asyncIncrement({ commit }) {
      setTimeout(() => commit('increment'), 1000);
    }
  }
});
```

## Implementation Priorities

1. **High Priority**
   - Improved reactivity with Proxy
   - Component system (basic)
   - Show directive

2. **Medium Priority**
   - Event modifiers
   - Template refs
   - Lifecycle hooks

3. **Lower Priority**
   - Transitions and animations
   - Template compilation
   - Directives API
   - State management

These features would significantly enhance MiniVue while maintaining its lightweight nature, bridging the gap between the current implementation and more feature-rich frameworks like Vue.js and Alpine.js. 