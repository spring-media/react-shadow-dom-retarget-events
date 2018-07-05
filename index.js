var reactEvents = ["onAbort", "onAnimationCancel", "onAnimationEnd", "onAnimationIteration", "onAuxClick", "onBlur",
    "onChange", "onClick", "onClose", "onContextMenu", "onDoubleClick", "onError", "onFocus", "onGotPointerCapture",
    "onInput", "onKeyDown", "onKeyPress", "onKeyUp", "onLoad", "onLoadEnd", "onLoadStart", "onLostPointerCapture",
    "onMouseDown", "onMouseMove", "onMouseOut", "onMouseOver", "onMouseUp", "onPointerCancel", "onPointerDown",
    "onPointerEnter", "onPointerLeave", "onPointerMove", "onPointerOut", "onPointerOver", "onPointerUp", "onReset",
    "onResize", "onScroll", "onSelect", "onSelectionChange", "onSelectStart", "onSubmit", "onTouchCancel",
    "onTouchMove", "onTouchStart", "onTransitionCancel", "onTransitionEnd", "onDrag", "onDragEnd", "onDragEnter",
    "onDragExit", "onDragLeave", "onDragOver", "onDragStart", "onDrop", "onFocusOut"];

var divergentNativeEvents = {
    onDoubleClick: 'dblclick'
};

var mimickedReactEvents = {
    onInput: 'onChange',
    onFocusOut: 'onBlur',
    onSelectionChange: 'onSelect'
};

module.exports = function retargetEvents(shadowRoot) {

    reactEvents.forEach(function (reactEventName) {

        var nativeEventName = getNativeEventName(reactEventName);

        shadowRoot.addEventListener(nativeEventName, function (event) {

            var path = event.path || (event.composedPath && event.composedPath()) || composedPath(event.target);

            // Create an array on the event to keep track of events that
            // trigger react callbacks. This will allow us to nest retargeted
            // shadowRoots and prevent callbacks from firing multiple times
            // (they will fire once for each nested shadowRoot if we don't do this).
            if(typeof event._retargetEventElements === 'undefined'){
                event._retargetEventElements = [];
            }

            for (var i = 0; i < path.length; i++) {
                var el = path[i];
                var reactComponent = findReactComponent(el);
                var props = findReactProps(reactComponent);
                var callbacksFired = 0;
                if (reactComponent && props) {
                    // if the event triggered a callback in a react component,
                    // keep track by pushing the el into
                    // event._retargetEventElements
                    if(event._retargetEventElements.indexOf(el) === -1){
                        callbacksFired += dispatchEvent(event, reactEventName, props) ? 1 : 0;
                        if(mimickedReactEvents[reactEventName]){
                            callbacksFired += dispatchEvent(event, mimickedReactEvents[reactEventName], props) ? 1 : 0;
                        }
                    }

                    // A callback was fired if callbacksFired is one or more
                    if(callbacksFired){
                        event._retargetEventElements.push(el);
                    }
                }

                if (event.cancelBubble) {
                    break;
                }

                if (el === shadowRoot) {
                    break;
                }
            }
        }, false);
    });
};

function findReactComponent(item) {
    for (var key in item) {
        if (item.hasOwnProperty(key) && key.indexOf('_reactInternal') !== -1) {
            return item[key];
        }
    }
}

function findReactProps(component) {
    if (!component) return undefined;
    if (component.memoizedProps) return component.memoizedProps; // React 16 Fiber
    if (component._currentElement && component._currentElement.props) return component._currentElement.props; // React <=15

}

// Returns true if a callback was fired
function dispatchEvent(event, eventType, componentProps) {
    if (componentProps[eventType]) {
        componentProps[eventType](event);
        return true;
    }
    return false;
}

function getNativeEventName(reactEventName) {
    if (divergentNativeEvents[reactEventName]) {
        return divergentNativeEvents[reactEventName];
    }
    return reactEventName.replace(/^on/, '').toLowerCase();
}

function composedPath(el) {
  var path = [];
  while (el) {
    path.push(el);
    if (el.tagName === 'HTML') {
      path.push(document);
      path.push(window);
      return path;
    }
    el = el.parentElement;
  }
}
