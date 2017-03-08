const fs = require('fs');
const gcProfiler = (require('gc-stats'))();
const redux = require('redux');

const optimist = require('redux-optimistic-ui');

const startTime = Date.now();

const heapSnaps = [];
gcProfiler.on('stats', (info) => {
    console.log(`GC ${info.pause / 1e6}ms: heap used: ${info.before.usedHeapSize} -> ${info.after.usedHeapSize} (Delta: ${info.diff.usedHeapSize})`)
    heapSnaps.push({
        time: Date.now() - startTime,
        before: info.before.usedHeapSize,
        after: info.after.usedHeapSize,
    });
});

const SAMPLE_SIZE = 100000;

const reducer = (state, action) => {
    if (action.type === 'INC') {
        return {
            counter: state.counter + 1
        };
    }
    return state;
}

const initialState = {
    counter: 0
};

const optimisticReducer = optimist.optimistic(reducer, { maxHistory: 1000000000 });

const store = redux.createStore(optimisticReducer, initialState);

const actionCreator = (id, optimisticType) => {
    const action = {
        type: optimisticType && optimisticType !== optimist.BEGIN ? '--' : 'INC',
        data: new Buffer(1024).toString('utf-8')
    };
    if (optimisticType) {
        action.meta = {};
        action.meta.optimistic = {
            id,
            type: optimisticType
        }
    }
    return action;
}

let deferred = [];
let i = 0;
const addDeferred = (fn, i, timeout) => deferred.push({ fn, i, runAfter: Date.now() + timeout });

const timer = setInterval(() => {
    const sample = i++;

    if (i === SAMPLE_SIZE) {
        clearInterval(timer);
        setTimeout(cleanup, 100);
    }

    const now = Date.now();

    let action;
    const select = sample % 10;

    if (sample % 100 === 0) {
        console.log(`Running ${sample} of ${SAMPLE_SIZE}`);
    }

    if (select <= 3) { // 40% are not optimistic
        store.dispatch(actionCreator(sample));
        return;
    }

    const d = deferred.reduce((buckets, value) => {
        if (value.runAfter > now) {
            buckets.expired.push(value);
        } else {
            buckets.active.push(value);
        }
        return buckets;
    }, { expired: [], active: [] });

    deferred = d.active;

    store.dispatch(actionCreator(sample, optimist.BEGIN));
    if (select <= 6) { // 30% commit in 10ms
        addDeferred(() => store.dispatch(actionCreator(sample, optimist.COMMIT)), sample, 10);
    } else if(select <= 8) { // 20% commit in 1000ms
        addDeferred(() => store.dispatch(actionCreator(sample, optimist.COMMIT)), sample, 1000);
    } else { // 10% revert after 250ms?
        addDeferred(() => store.dispatch(actionCreator(sample, optimist.REVERT)), sample, 250);
    }

    d.expired.forEach(value => value.fn());

}, 0);

function cleanup() {
    deferred.forEach(value => value.fn());
    const endTime = Date.now();
    console.log("Elapsed time", endTime - startTime, "ms");
    console.log(JSON.stringify(store.getState(), null, 2));

    console.log('Writing GC stats');
    const fdStats = fs.openSync('heapdata.txt', 'w+');
    fs.writeSync(fdStats, "TIME\tUSED\n");
    heapSnaps.forEach(point => {
        fs.writeSync(fdStats, `${point.time}\t${point.before}\n`);
        fs.writeSync(fdStats, `${point.time}\t${point.after}\n`);
    });
    fs.closeSync(fdStats);
}