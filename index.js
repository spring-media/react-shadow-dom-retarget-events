'use strict';

function retargetEvents(shadowRoot) {
  let events = 'onClick onContextMenu onDoubleClick onDrag onDragEnd onDragEnter onDragExit onDragLeave onDragOver onDragStart onDrop onMouseDown onMouseEnter onMouseLeave onMouseMove onMouseOut onMouseOver onMouseUp'.split(' ');

  function dispatchEvent(event, eventType, itemProps) {
    if (itemProps[eventType]) {
      itemProps[eventType](event);
    } else if (itemProps.children && itemProps.children.forEach) {
      itemProps.children.forEach(child => {
        child.props && dispatchEvent(event, eventType, child.props);
      })
    }
  }

  // Compatible with v0.14 & 15
  function findReactInternal(item) {
    let instance;
    for (let key in item) {
      if (item.hasOwnProperty(key) && ~key.indexOf('_reactInternal')) {
        instance = item[key];
        break;
      }
    }
    return instance;
  }

  events.forEach(eventType => {
    let transformedEventType = eventType.replace(/^on/, '').toLowerCase();

    shadowRoot.addEventListener(transformedEventType, event => {
      let path = [];

      for (let i in event.path) {
        let item = event.path[i];
        path.push(item);

        let internalComponent = findReactInternal(item);
        if (internalComponent
            && internalComponent._currentElement
            && internalComponent._currentElement.props
        ) {
          dispatchEvent(event, eventType, internalComponent._currentElement.props);
        }

        if (item == shadowRoot) break;
      }
    });
  });
}

module.exports = retargetEvents;

