/// <reference lib="dom" />

import './components';

document.body.innerHTML = `
    <app-loader>
        <app-chart name="CPU" key="cpu.total"></app-chart>
        <app-chart name="Memory Total" key="memory.total"></app-chart>
        <app-chart name="Memory Limit" key="memory.limit"></app-chart>
        <app-chart name="Platform" key="system.platforms"></app-chart>
        <app-chart name="Agent" key="system.agents"></app-chart>
    </app-loader>
`;
