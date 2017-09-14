'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _lodash = require('lodash.debounce');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var debounce = _lodash2['default'] || require('lodash/debounce');

exports['default'] = function (engine, ms) {
    var maxWait = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
    var eventsToPersistOn = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : ['beforeunload'];

    if (maxWait !== null && ms > maxWait) {
        throw new Error('maxWait must be > ms');
    }

    var lastReject = void 0;

    var hasWindow = false;
    try {
        hasWindow = !!window;
    } catch (err) {
        // ignore error
    }

    var debouncedSave = debounce(function (stateToSave, resolve, reject) {
        engine.save(stateToSave).then(resolve)['catch'](reject);
    }, ms, { maxWait: maxWait });

    if (hasWindow && window.addEventListener) {
        var saveUponEvent = function saveUponEvent() {
            debouncedSave.flush();
        };
        eventsToPersistOn.forEach(function (eventName) {
            return window.addEventListener(eventName, saveUponEvent);
        });
    }

    return _extends({}, engine, {
        save: function save(state) {
            if (lastReject) {
                lastReject(Error('Debounced, newer action pending'));
                lastReject = null;
            }

            return new Promise(function (resolve, reject) {
                lastReject = reject;
                debouncedSave(state, resolve, reject);
            });
        }
    });
};