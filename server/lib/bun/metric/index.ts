import {ClientMetricData, ClientMetricDataByServer, MetricCount, MetricCounts} from "@shared/types/metric";
import {File} from '@lib/package/file';

const MetricStoreFile = new File('temp/log/metric.json');

const MetricStore: {[timestamp: number]: ClientMetricData[], keys: any[]} = new Proxy({} as any, {
    get(target: {}, p: string | symbol, receiver: any): any {
        const store = JSON.parse(MetricStoreFile.read()?.toString() ?? '{}') ?? {};
        if (p === 'keys') return Object.keys(store);
        return store[p];
    },
    set(target: {}, p: string | symbol, newValue: any, receiver: any): boolean {
        const store = JSON.parse(MetricStoreFile.read()?.toString() ?? '{}') ?? {};
        store[p] = newValue;
        return MetricStoreFile.write(JSON.stringify(store));
    },
});

export const sendToMetricStore = (data: ClientMetricData) => {
    const date = new Date();
    date.setSeconds(0);
    date.setMilliseconds(0)
    const timestamp = date.getTime();
    if (!MetricStore[timestamp]) MetricStore[timestamp] = [];
    MetricStore[timestamp] = [...MetricStore[timestamp], data];
}

export const getClientMetricDataByServer = (): {[timestamp: number]: ClientMetricDataByServer } => {
    const timestamps = MetricStore.keys.map(Number);
    return timestamps.map((timestamp) => {
        const store = MetricStore[timestamp];
        const systems = store.map((data) => data.system)?.filter(Boolean);
        const errors = store.map((data) => data.errors)?.filter(Boolean);
        const clicks = store.map((data) => data.clicks)?.filter(Boolean);
        const redirects = store.map((data) => data.redirects)?.filter(Boolean);
        const totalMemory = store.map((data) => data.memory.total)?.filter(Boolean);
        const limitMemory = store.map((data) => data.memory.limit)?.filter(Boolean);
        const totalNetwork = store.map((data) => data.network.total)?.filter(Boolean);
        const totalCPU = store.map((data) => data.cpu.total)?.filter(Boolean);
        const clientDataByServer: ClientMetricDataByServer = {
            system: {
                platforms: systems.reduce((acc, a) => ({...acc, [a.platform]: (acc[a.platform] ?? 0) + 1}), {}),
                mobile: systems.filter((system) => system.mobile)?.length,
                agents:  systems.reduce((acc, a) => ({...acc, [a.agent]: (acc[a.agent] ?? 0) + 1}), {}),
            },
            errors: getMetricCount(...errors),
            clicks: getMetricCount(...clicks),
            redirects: getMetricCount(...redirects),
            memory: {
                total: getMetricCounts(...totalMemory),
                limit: getMetricCounts(...limitMemory),
            },
            network: {
                total: getMetricCounts(...totalNetwork)
            },
            cpu: {
                total: getMetricCounts(...totalCPU),
            }
        };
        return {[timestamp]: clientDataByServer};
    }).reduce((acc, a) => ({...acc, ...a}), {});
}

const getMetricCount = (...data: number[]): MetricCount => {
    return data?.length ? {
        max: Math.max(...data),
        min: Math.min(...data),
        delta: Math.round(data.reduce((acc, a) => acc + a,0) / data?.length),
    } : null
}
const getMetricCounts = (...data: MetricCount[]): MetricCounts => {
    return data?.length ? {
        max: data.map((data) => data.max) ?? [],
        min: data.map((data) => data.min) ?? [],
        delta: data.map((data) => data.delta) ?? [],
    } : null
}
