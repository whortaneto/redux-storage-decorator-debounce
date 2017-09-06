import debounce from 'lodash.debounce';

export default (engine, ms, maxWait = null, eventsToPersistOn = ['beforeunload']) => {
    if (maxWait !== null && ms > maxWait) {
        throw new Error('maxWait must be > ms');
    }

    let debounced = false;
    let lastReject;
    let lastState;

    let hasWindow = false;
    try {
        hasWindow = !!window;
    } catch (err) {
        // ignore error
    }
    if (hasWindow && window.addEventListener) {
        const saveUponEvent = () => {
            if (!debounced) {
                return;
            }
            lastReject = null;
            engine.save(lastState);
        };
        eventsToPersistOn.forEach(eventName => window.addEventListener(eventName, saveUponEvent));
    }


    const debouncedSave = debounce((stateToSave, resolve, reject) => {
        debounced = false;
        engine.save(stateToSave).then(resolve).catch(reject);
    }, ms, { maxWait });

    return {
        ...engine,

        save(state) {
            lastState = state;

            if (lastReject) {
                lastReject(Error('Debounced, newer action pending'));
                lastReject = null;
            }

            return new Promise((resolve, reject) => {
                lastReject = reject;
                debounced = true;
                debouncedSave(state, resolve, reject);
            });
        }
    };
};
