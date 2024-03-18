/// <reference lib="dom" />
import 'https://cdn.jsdelivr.net/npm/chart.js';
class ChartComponent extends HTMLElement {
    public readonly data = {title: ''};
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    construct() {
        this.data.title = this.getAttribute('title') ?? 'Title';
    }

    connectedCallback() {
        const metricPath = (window as any).metricPath;
        const Chart = (window as any).Chart;

        if (!metricPath || !Chart) {
            console.error('Metric Router has not set or Chart.js is not available');
            return;
        }

        Chart.Tooltip.positioners.fixedY = function (elements, eventPosition) {
            return {
                x: eventPosition.x,
                y: 600,
            };
        };
        const api = `${location.protocol}//${location.host}${metricPath}`;
        this.fetchAndRenderChart(api, Chart);
    }

    fetchAndRenderChart(api: string, Chart: any) {
        this.listener(api, Chart);
        setInterval(() => this.listener(api, Chart), 5000);
    }

    listener(api: string, Chart: any) {
        fetch(api).then((data) => data.json()).then((response) => {
            this.construct();
            let ctx = this.shadowRoot.querySelector('canvas');
            if (ctx) ctx.remove();
            ctx = document.createElement('canvas');
            this.shadowRoot.append(ctx);
            const data = response.result;
            const timestamps = Object.keys(data).map(Number);
            const datasets = timestamps.map((timestamp) => {
                let _data = data[timestamp];
                _data = _data.system.platforms;
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
                }
                else {
                    acc.push(a);
                }
                return acc;
            }, []).map((dataset, i, self) => {
                dataset.data = timestamps.map((timestamp) => {
                    const index = dataset.data.findIndex((data) => data.date === timestamp);
                    if (index > -1) {
                        return dataset.data[index];
                    }
                    else {
                        return {
                            date: timestamp,
                            data: 0,
                        }
                    }
                });
                return dataset;
            });
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: timestamps,
                    datasets: datasets,
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
                            display: true,
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
                                    const timestamp = timestamps[i];
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
        });
    }
}

customElements.define('app-chart', ChartComponent);
