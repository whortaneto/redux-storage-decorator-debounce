import debounce from 'lodash.debounce';

export default (engine, ms, maxWait = null, eventsToPersistOn = ['beforeunload']) => {
    if (maxWait !== null && ms > maxWait) {
        throw new Error('maxWait must be > ms');
    }

    let lastReject;

    let hasWindow = false;
    try {
        hasWindow = !!window;
    } catch (err) {
        // ignore error
    }

    const debouncedSave = debounce((stateToSave, resolve, reject) => {
        engine.save(stateToSave).then(resolve).catch(reject);
    }, ms, { maxWait });

    if (hasWindow && window.addEventListener) {
        const saveUponEvent = () => {
            debouncedSave.flush();
        };
        eventsToPersistOn.forEach(eventName => window.addEventListener(eventName, saveUponEvent));
    }

    return {
        ...engine,

        save(state) {
            if (lastReject) {
                lastReject(Error('Debounced, newer action pending'));
                lastReject = null;
            }

            return new Promise((resolve, reject) => {
                lastReject = reject;
                debouncedSave(state, resolve, reject);
            });
        }
    };
};
