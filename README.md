# react-shadow-dom-retarget-events

## What it does

Fixes events for react components rendered in a `shadow dom`.

## Why

When you render a react component inside `shadow dom` events will not be dispatched to react. 
I.e. when a user clicks in your react component nothing happens. This happens (or does not happen) with any events.
 
A bug is filed at [#10422](https://github.com/facebook/react/issues/10422).

## How to fix it

Luckily someone wrote [a workaround on Stack Overflow](https://stackoverflow.com/questions/37866237/click-event-not-firing-when-react-component-in-a-shadow-dom).
It works by adding vanilla JS event listeners and dispatches events to React.

This repo is his answer in an npm module.

## Installation

`yarn add react-shadow-dom-retarget-events` / `npm install react-shadow-dom-retarget-events --save`

## Usage

```jsx
import retargetEvents from 'react-shadow-dom-retarget-events';

class App extends React.Component {
  render() {
  	return (
        <div onClick={() => alert('I have been clicked')}>Click me</div>
    );
  }
}

const proto = Object.create(HTMLElement.prototype, {
  attachedCallback: {
    value: function() {
      const mountPoint = document.createElement('span');
      const shadowRoot = this.createShadowRoot();
      shadowRoot.appendChild(mountPoint);
      ReactDOM.render(<App/>, mountPoint);
      retargetEvents(shadowRoot);
    }
  }
});
document.registerElement('my-custom-element', {prototype: proto});
```

## Credits

Credits go to @josephnvu on Stack Overflow 
