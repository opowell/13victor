let doc = document;

function pick() {
    var args = arguments;
    var length = args.length;
    for (var i = 0; i < length; i++) {
        var arg = args[i];
        if (typeof arg !== 'undefined' && arg !== null) {
            return arg;
        }
    }
}

function clamp(value, min, max) {
    return value > min ? value < max ? value : max : min;
}

function defined(obj) {
    return typeof obj !== 'undefined' && obj !== null;
}

fireEvent = function (el, type, eventArguments, defaultFunction) {
    /* eslint-enable valid-jsdoc */
    var e, i;
    eventArguments = eventArguments || {};
    if (doc.createEvent &&
        (el.dispatchEvent || el.fireEvent)) {
        e = doc.createEvent('Events');
        e.initEvent(type, true, true);
        extend(e, eventArguments);
        if (el.dispatchEvent) {
            el.dispatchEvent(e);
        }
        else {
            el.fireEvent(type, e);
        }
    }
    else {
        if (!eventArguments.target) {
            // We're running a custom event
            extend(eventArguments, {
                // Attach a simple preventDefault function to skip
                // default handler if called. The built-in
                // defaultPrevented property is not overwritable (#5112)
                preventDefault: function () {
                    eventArguments.defaultPrevented = true;
                },
                // Setting target to native events fails with clicking
                // the zoom-out button in Chrome.
                target: el,
                // If the type is not set, we're running a custom event
                // (#2297). If it is set, we're running a browser event,
                // and setting it will cause en error in IE8 (#2465).
                type: type
            });
        }
        var fireInOrder = function (protoEvents, hcEvents) {
            if (protoEvents === void 0) { protoEvents = []; }
            if (hcEvents === void 0) { hcEvents = []; }
            var iA = 0;
            var iB = 0;
            var length = protoEvents.length + hcEvents.length;
            for (i = 0; i < length; i++) {
                var obj = (!protoEvents[iA] ?
                    hcEvents[iB++] :
                    !hcEvents[iB] ?
                        protoEvents[iA++] :
                        protoEvents[iA].order <= hcEvents[iB].order ?
                            protoEvents[iA++] :
                            hcEvents[iB++]);
                // If the event handler return false, prevent the default
                // handler from executing
                if (obj.fn.call(el, eventArguments) === false) {
                    eventArguments.preventDefault();
                }
            }
        };
        fireInOrder(el.protoEvents && el.protoEvents[type], el.hcEvents && el.hcEvents[type]);
    }
    // Run the default if not prevented
    if (defaultFunction && !eventArguments.defaultPrevented) {
        defaultFunction.call(el, eventArguments);
    }
};

function extend(a, b) {
    /* eslint-enable valid-jsdoc */
    var n;
    if (!a) {
        a = {};
    }
    for (n in b) { // eslint-disable-line guard-for-in
        a[n] = b[n];
    }
    return a;
}