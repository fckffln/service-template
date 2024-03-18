export type MetricCount = {max: number, min: number, delta: number} | null;
export type MetricCounts = {max: number[], min: number[], delta: number[]} | null;

export type ClientMetricData = {
    system: {
        agent: string,
        platform: string,
        mobile: boolean
    },
    errors: number,
    clicks: number,
    redirects: number,
    network: {
        total: MetricCount,
    },
    memory: {
        limit: MetricCount,
        total: MetricCount,
    },
    cpu: {
        total: MetricCount,
    }
};
export type ClientMetricDataByServer = {
    system: {
        platforms: {[platform: ClientMetricData['system']['platform']]: number}
        mobile: number,
        agents: {[agent: ClientMetricData['system']['agent']]: number}
    };
    errors: MetricCount,
    clicks: MetricCount,
    redirects: MetricCount,
    network: {
        total: MetricCounts,
    },
    memory: {
        limit: MetricCounts,
        total: MetricCounts,
    },
    cpu: {
        total: MetricCounts,
    }
}
