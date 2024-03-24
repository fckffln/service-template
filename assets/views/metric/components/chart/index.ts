/// <reference lib="dom" />
import 'https://cdn.jsdelivr.net/npm/chart.js';

const interval = 5000;

function getChart() {
    const Chart = (window as any).Chart;
    if (!Chart) {
        console.error('Chart.js is not available');
        return;
    }
    return Chart
}

function init() {
    const metricPath = (window as any).metricPath;
    const Chart = getChart();
    if (!metricPath) {
        console.error('Metric path is not available');
        return;
    }
    Chart.Tooltip.positioners.fixedY = function (elements, eventPosition) {
        return {
            x: eventPosition.x,
            y: 0,
        };
    };
    (window as any).Charts = {metrics: {timestamps: [], datasets: (key) => []}};
    const api = `${location.protocol}//${location.host}${metricPath}`;
    listener(api);
    setInterval(() => listener(api), interval);
}

function listener(api: string) {
    fetch(api).then((data) => data.json()).then((response) => {
        const data = response.result;
        const timestamps = Object.keys(data).map(Number);
        (window as any).Charts.metrics.timestamps = timestamps;
        (window as any).Charts.metrics.datasets = (key: string) => timestamps.map((timestamp) => {
            const getByKey = (key, data) => {
                const keys = key.split('.');
                const _key = keys[0];
                const _data = data[_key];
                if (keys?.length >= 2) return getByKey(keys.slice(1).join('.'), _data);
                return _data;
            }
            let _data = data[timestamp];
            _data = getByKey(key, _data);
            if (!_data) return [];
            const labels = Object.keys(_data);
            return labels.map((label) => ({
                label,
                data: [{data: _data[label], date: timestamp}],
                pointHoverBorderColor: '#FFFFFF',
                pointHoverBorderWidth: 3.5,
                pointBorderWidth: 1,
                pointRadius: 0.7,
                pointHoverRadius: 6,
                borderWidth: 2,
            }))
        }).reduce((acc, a) => [...acc, ...a], []).reduce((acc, a) => {
            const index = acc.findIndex((b) => b.label === a.label);
            if (index > -1) {
                acc[index].data.push(...a.data);
            } else {
                acc.push(a);
            }
            return acc;
        }, []).map((dataset, i, self) => {
            dataset.data = timestamps.map((timestamp) => {
                const index = dataset.data.findIndex((data) => data.date === timestamp);
                if (index > -1) {
                    return dataset.data[index];
                } else {
                    return {
                        date: timestamp,
                        data: 0,
                    }
                }
            });
            return dataset;
        });
        (window as any).Loader.toggle(false);
    });
}

export class ChartComponent extends HTMLElement {
    public readonly data = {title: '', key: ''};
    private readonly shadow: ShadowRoot;
    constructor() {
        super();
        this.shadow = this.attachShadow({ mode: 'closed' });
        this.fetchAndRenderChart();
    }

    construct() {
        this.data.title = this.getAttribute('name') ?? 'Title';
        this.data.key = this.getAttribute('key') ?? 'platforms';
    }

    fetchAndRenderChart() {
        this.listener();
        setInterval(() => this.listener(), interval);
    }

    listener() {
        this.construct();
        let ctx = this.shadow.querySelector('canvas');
        if (ctx) ctx.remove();
        ctx = document.createElement('canvas');
        this.shadow.append(ctx);
        const Chart = getChart();
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: (window as any).Charts.metrics.timestamps,
                datasets: (window as any).Charts.metrics.datasets(this.data.key),
            },
            options: {
                animation: false,
                plugins: {
                    tooltip: {
                        mode: 'nearest',
                        axis: 'x',
                        intersect: false,
                        align: 'center',
                        yAlign: 'bottom',
                        position: 'fixedY',
                        backgroundColor: 'var(--text-main-color)',
                        displayColors: false,
                        bodyAlign: 'start',
                        footerAlign: 'center',
                        font: {
                            family: 'Inter',
                            size: 10,
                        },
                    },
                    title: {
                        fullSize: false,
                        position: 'top',
                        display: true,
                        text: this.data.title,
                        color: 'black',
                        align: 'start',
                        font: {
                            size: 14,
                            weight: '500',
                            lineHeight: 1.2,
                            family: 'Inter',
                        },
                        padding: { top: 0, left: 100, right: 0, bottom: -25 },
                    },
                    legend: {
                        labels: {
                            font: {
                                family: 'Inter',
                                size: 10,
                            },
                            boxHeight: 4,
                            boxWidth: 15,
                            borderWidth: 10,
                        },
                        align: 'end',
                        maxHeight: 40,
                        display: false,
                    },
                },
                parsing: {
                    xAxisKey: 'date',
                    yAxisKey: 'data',
                },
                responsive: true,
                // maintainAspectRatio: false,
                scales: {
                    x: {
                        border: {
                            dash: [1, 2],
                            draw: false,
                            display: false,
                            zeroLineColor: 'transparent',
                            padding: -20,
                        },
                        ticks: {
                            autoSkip: true,
                            maxRotation: 0,
                            minRotation: 0,
                            // padding: 10,
                            font: {
                                family: 'Inter',
                                size: 10,
                            },
                            callback: (_, i, __) => {
                                const timestamp = (window as any).Charts.metrics.timestamps[i];
                                const date = new Date(timestamp);
                                return `${date.toLocaleTimeString()}`;
                            }
                        },
                    },
                    y: {
                        border: {
                            dash: [4, 4],
                        },
                        grid: {
                            borderWidth: 1,
                            drawBorder: false,
                            color: '#8c95b196',
                            borderColor: 'transparent',
                        },
                        beginAtZero: true,
                        min: 0,
                        ticks: {
                            display: true,
                            padding: 2.5,
                            autoSkip: true,
                            maxRotation: 0,
                            minRotation: 0,
                            font: {
                                family: 'Inter',
                                size: 10,
                            },
                        },
                    },
                }
            }
        });
    }
}
init();
customElements.define('app-chart', ChartComponent);
