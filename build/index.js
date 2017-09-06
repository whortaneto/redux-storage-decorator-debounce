'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _lodash = require('lodash.debounce');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

exports['default'] = function (engine, ms) {
    var maxWait = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
    var eventsToPersistOn = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : ['beforeunload'];

    if (maxWait !== null && ms > maxWait) {
        throw new Error('maxWait must be > ms');
    }

    var debounced = false;
    var lastReject = void 0;
    var lastState = void 0;

    var hasWindow = false;
    try {
        hasWindow = !!window;
    } catch (err) {
        // ignore error
    }
    if (hasWindow && window.addEventListener) {
        var saveUponEvent = function saveUponEvent() {
            if (!debounced) {
                return;
            }
            lastReject = null;
            engine.save(lastState);
        };
        eventsToPersistOn.forEach(function (eventName) {
            return window.addEventListener(eventName, saveUponEvent);
        });
    }

    var debouncedSave = (0, _lodash2['default'])(function (stateToSave, resolve, reject) {
        debounced = false;
        engine.save(stateToSave).then(resolve)['catch'](reject);
    }, ms, { maxWait: maxWait });

    return _extends({}, engine, {
        save: function save(state) {
            lastState = state;

            if (lastReject) {
                lastReject(Error('Debounced, newer action pending'));
                lastReject = null;
            }

            return new Promise(function (resolve, reject) {
                lastReject = reject;
                debounced = true;
                debouncedSave(state, resolve, reject);
            });
        }
    });
};