export default (engine, ms, maxWait = null, eventsToPersistOn = ['beforeunload']) => {
    if (maxWait !== null && ms > maxWait) {
        throw new Error('maxWait must be > ms');
    }

    let lastTimeout;
    let maxTimeout;
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
            if (!lastTimeout) {
                return;
            }

            lastTimeout = clearTimeout(lastTimeout);
            maxTimeout = clearTimeout(maxTimeout);
            lastReject = null;
            engine.save(lastState);
        };
        eventsToPersistOn.forEach(eventName => window.addEventListener(eventName, saveUponEvent));
    }

    return {
        ...engine,

        save(state) {
            lastState = state;
            lastTimeout = clearTimeout(lastTimeout);

            if (lastReject) {
                lastReject(Error('Debounced, newer action pending'));
                lastReject = null;
            }

            return new Promise((resolve, reject) => {
                const doSave = () => {
                    lastTimeout = clearTimeout(lastTimeout);
                    maxTimeout = clearTimeout(maxTimeout);
                    lastReject = null;
                    lastState = null;
                    engine.save(state).then(resolve).catch(reject);
                };

                lastReject = reject;
                lastTimeout = setTimeout(doSave, ms);

                if (maxWait !== null && !maxTimeout) {
                    maxTimeout = setTimeout(doSave, maxWait);
                }
            });
        }
    };
};
