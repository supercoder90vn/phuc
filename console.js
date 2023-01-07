(function() {
    // https://github.com/jsbin/jsbin/blob/master/public/js/vendor/stringify.js
    var stringify = (function() {
        var sortci = function(a, b) {
            return a.toLowerCase() < b.toLowerCase() ? -1 : 1;
        };
        var htmlEntities = function(str) {
            return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        };

        /**
         * Recursively stringify an object. Keeps track of which objects it has
         * visited to avoid hitting circular references, and a buffer for indentation.
         * Goes 2 levels deep.
         */
        return function stringify(o, visited, buffer) {
            var i, vi, type = '',
                parts = [];
            buffer = buffer || '';
            visited = visited || [];

            // Get out fast with primitives that don't like toString
            if (o === null) {
                return 'null';
            }
            if (typeof o === 'undefined') {
                return 'undefined';
            }

            // Determine the type
            try {
                type = ({}).toString.call(o);
            } catch (e) { // only happens when typeof is protected (...randomly)
                type = '[object Object]';
            }

            // Handle the primitive types
            if (type == '[object Number]') {
                return '' + o;
            }
            if (type == '[object Boolean]') {
                return o ? 'true' : 'false';
            }
            if (type == '[object Function]') {
                return o.toString().split('\n  ').join('\n' + buffer);
            }
            if (type == '[object String]') {
                return '"' + htmlEntities(o.replace(/"/g, '\\"')) + '"';
            }

            // Check for circular references
            for (vi = 0; vi < visited.length; vi++) {
                if (o === visited[vi]) {
                    // Notify the user that a circular object was found and, if available,
                    // show the object's outerHTML (for body and elements)
                    return '[circular ' + type.slice(1) +
                        ('outerHTML' in o ? ' :\n' + htmlEntities(o.outerHTML).split('\n').join('\n' + buffer) : '')
                }
            }

            // Remember that we visited this object
            visited.push(o);

            // Stringify each member of the array
            if (type == '[object Array]') {
                for (i = 0; i < o.length; i++) {
                    parts.push(stringify(o[i], visited));
                }
                return '[' + parts.join(', ') + ']';
            }

            // Fake array – very tricksy, get out quickly
            if (type.match(/Array/)) {
                return type;
            }

            var typeStr = type + ' ',
                newBuffer = buffer + '  ';

            // Dive down if we're less than 2 levels deep
            if (buffer.length / 2 < 2) {
                var names = [];
                // Some objects don't like 'in', so just skip them
                try {
                    for (i in o) {
                        names.push(i);
                    }
                } catch (e) {}

                names.sort(sortci);
                for (i = 0; i < names.length; i++) {
                    try {
                        parts.push(newBuffer + names[i] + ': ' + stringify(o[names[i]], visited, newBuffer));
                    } catch (e) {}
                }
            }

            // If nothing was gathered, return empty object
            if (!parts.length) return typeStr + '{ ... }';

            // Return the indented object with new lines
            return typeStr + '{\n' + parts.join(',\n') + '\n' + buffer + '}';
        };
    }());

    var nativeConsole = {};

    function appendElement(message) {
        if (document.body) {
            document.body.append(message);
        } else {
            // wait for document ready
            setTimeout(appendElement, 100, message);
        }
    }

    function createElement(text, color) {
        var pre = document.createElement('pre');
        pre.style.color = color || '#000000';
        pre.innerText = text;
        return pre;
    }

    function virtualConsoleFactory(key, color) {
        return function() {
            // Reflect.apply -> Function.prototype.apply.call
            Function.prototype.apply.call(nativeConsole[key], nativeConsole, arguments);
            // Array.from -> Array.prototype.slice.call
            var args = Array.prototype.slice.call(arguments)
                .map(function (arg) {
                    return stringify(arg);
                })
                .join(', ');
            appendElement(createElement(args, color));
        };
    }

    // override native console
    // for (var attr in window.console) {
    //     if (window.console.hasOwnProperty(attr)) {
    //         nativeConsole[attr] = window.console[attr];
    //         switch (attr) {
    //             case 'clear':
    //                 window.console['clear'] = function clear() {
    //                     if (document.body) {
    //                         document.body.innerHtml = null;
    //                     }
    //                     nativeConsole.clear.call(nativeConsole);
    //                 };;
    //                 break;
    //             case 'error':
    //                 window.console['error'] = virtualConsoleFactory('error', '#ff0000');
    //                 break;
    //             default:
    //                 window.console[attr] = virtualConsoleFactory(attr);
    //         }
    //     }
    // }

    // to catch error event
    window.addEventListener('error', function(e) {
        e.preventDefault();
        console.error(e.message);
        return true;
    }, true);
})();
