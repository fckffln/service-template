import {ClientMetricData} from "@shared/types/metric";
import environment from "../../../environments";

let errorsCount = 0;
let clicksCount = 0;
let routeChangesCount = 0;
let loadCounts = [];
let totalMemoryCounts = [];
let limitMemoryCounts = [];
let cpuCounts = [];
window.onerror = function(message, source, lineno, colno, error) {
    errorsCount++;
    return false;
};

document.addEventListener('click', () => {
    clicksCount++;
});

window.addEventListener('hashchange', () => {
    routeChangesCount++;
});

window.onload = (ev) => {
    setTimeout(() => {
        const performanceData = window.performance.timing;
        const loadTime = performanceData.loadEventEnd - performanceData.navigationStart;
        loadCounts.push(loadTime);
    }, 0);
};

const originalFetch = window.fetch;
window.fetch = async (...args): Promise<any> => {
    const start = performance.now();
    let res;
    res = await originalFetch(...args);
    const end = performance.now();
    cpuCounts.push(end - start);
    return res;
}

setInterval(() => {
    if (performance && (performance as any).memory) {
        const memoryData = (performance as any).memory;
        const used = memoryData.usedJSHeapSize;
        const total = memoryData.totalJSHeapSize;
        const limit = memoryData.jsHeapSizeLimit;
        totalMemoryCounts.push(Math.round(used/total * 100));
        limitMemoryCounts.push(Math.round(used/limit * 100));
    }
}, 1000);

const getMetricData = () => {
    const metricData: ClientMetricData = {
        system: {
            agent: navigator.userAgent,
            platform: (navigator as any)?.platform ?? (navigator as any)?.userAgentData?.platform ?? '',
            mobile: (navigator as any)?.userAgentData?.mobile ?? false,
        },
        errors: errorsCount || null,
        clicks: clicksCount || null,
        redirects: routeChangesCount || null,
        network: {
            ...(navigator as any)?.connection,
            max: Math.max(...loadCounts),
            min: Math.min(...loadCounts),
            delta: loadCounts.reduce((acc, a) => acc + a,0) / loadCounts.length,
        },
        memory: {
            limit: limitMemoryCounts?.length ? {
                max: Math.max(...limitMemoryCounts),
                min: Math.min(...limitMemoryCounts),
                delta: Math.round(limitMemoryCounts.reduce((acc, a) => acc + a,0) / limitMemoryCounts.length),
            } : null,
            total: totalMemoryCounts?.length ? {
                max: Math.max(...totalMemoryCounts),
                min: Math.min(...totalMemoryCounts),
                delta: Math.round(totalMemoryCounts.reduce((acc, a) => acc + a,0) / totalMemoryCounts.length),
            } : null,
        },
        cpu: {
            total: cpuCounts?.length ? {
                max: Math.max(...cpuCounts),
                min: Math.min(...cpuCounts),
                delta: Math.round(cpuCounts.reduce((acc, a) => acc + a, 0) / cpuCounts.length),
            } : null,
        }
    };
    return metricData;
}

const sendData = () => {
    originalFetch(`${environment.publicApi}/metric/client`, {
        method: 'POST',
        body: JSON.stringify(getMetricData()),
    }).then(console.log);
}

export default () => {
    setInterval(() => {
        sendData();
    }, 5000);
}
