import Logger from "../logger";
import Router from "../router";
import {PathResolve} from "@shared/route/build-backend-routes";

// @ts-ignore
export default Router({key: 'Logger', pathResolver: (url) => url.pathname?.startsWith(Logger.Logger.router) ? PathResolve.Root : PathResolve.Disabled, callback: async (request, response, tools) => {
    if (!Logger.Logger) throw new Error('[BunLogger] Store has not setup');
    const url = new URL(request.url);
    if (url.pathname.endsWith('jetbrains_mono.ttf')) {
        return tools.tryFiles(() => ['server/lib/bun/assets/jetbrains_mono.ttf']);
    }
    if (url.searchParams.get('type') === 'json') {
        return new response(JSON.stringify(Logger.Logger.store), { headers: { 'Content-Type': 'application/json' } });
    }
    else {
        return new response(`
			<html>
				<head>
				    <meta lang="ru" charset="UTF-8">
					<title>Log List ${new Date()}</title>
					<link rel="icon" disabled>
				</head>
				<body>
					<style>
						@font-face {
							src: url("${Logger.Logger.router + '/jetbrains_mono.ttf'}");
							font-family: "JetBrains Mono";
						}
						* {
							box-sizing: border-box;
							font-family: "JetBrains Mono";
						}
						html, body {
							margin: 0;
							padding: 0;
							background: #2B2B2B;
							color: #BABABA;
						}
						table {
							border-collapse: collapse;
							width: 100%;
							max-width: 100vw;
							table-layout: auto;
						}
						tr {
						  min-height: 2em;
							max-width: 100vw;
							width: 100vw;
							transition: 300ms ease-in-out;
							&:hover {
								> * {
									background: #323232 !important;
								}
								.index {
							    color: #BABABA !important;
						    }
							}
							td {
								min-height: 2em;
								padding: 0.5em 1em;
								height: 100%;
								word-wrap: anywhere;
								white-space: pre-wrap;
								max-width: 100%;
								
								&:nth-child(1) {
									background: #2B2B2B;
									min-width: 5em;
									justify-content: flex-end;
									text-align: right;
									color: #585A5C;
									border-right: 0.1em solid #585A5C;
									user-select: none;
								}
								&:nth-child(2) {
									width: 100%;
									color: #BABABA;
									background: #2B2B2B;
								}
							}
						}
						}
						.index {
							color: #757575;
						}
					</style>
					<main>
					    <div style="padding: 2em">
					        <h1>Simple Log</h1>
                            <h3 style="margin: 0">Group by:</h3>
                            <div style="display: inline-flex;gap: 1em;align-items: center">
                                <input value="id" type="radio">
                                <h3>Iteration ID</h3>
                            </div>
                            <div style="display: inline-flex;gap: 1em;align-items: center">
                                <input value="requestId" type="radio">
                                <h3>Request ID</h3>
                            </div>
                            <div style="display: inline-flex;gap: 1em;align-items: center">
                                <input value="router" type="radio">
                                <h3>Router ID</h3>
                            </div>
                            <div style="display: inline-flex;gap: 1em;align-items: center">
                                <input value="disabled" type="radio">
                                <h3>Date (Disabled)</h3>
                            </div>
					    </div>
						<table>
							<tbody>
								${new Array(100).fill(`
								<tr>
								  <td class="index"></td>
								  <td class="message"></td>
								</tr>
								`).join(' ')}
							</tbody>
						</table>
					</main>
					<script>
					    const jsonValues = '${JSON.stringify(Logger.Logger.store)}';
                        let values = JSON.parse(jsonValues);
                        console.log(values);
                        const createNode = (node, i, key) => {
                            return \`
                                <tr>
									<td class="index">\${i + 1}</td>
									<td \${Array.isArray(node) ? '' : \`title='\${JSON.stringify({id: node.id, reqId: node.id, router: node.router})}'\`} class="message" \${node.type === 'error' ? 'style="color: crimson;"' : ''}>\${Array.isArray(node) ? \`<table>
									    <tbody>
									        <tr id="toggle"><td></td><td style="color: gray">\${node[0][key]}</td></tr>
									        \${node.map((node,i) => \`<tr title='\${JSON.stringify({id: node.id, reqId: node.id, router: node.router})}'>
									            <td class="index">\${i + 1}</td>
									            <td \${node.type === 'error' ? 'style="color: crimson;"' : ''} class="message">\${node.date} - \${node.message}</td>
									        </tr>\`).join(' ')}
									    </tbody>
									</table>\` : node.message}</td>
								</tr>
                            \`;
                        };
                        function update(e) {
                            const value = e.currentTarget.value;
                            const reduceByKey = (key) => {
                                return JSON.parse(jsonValues).reduce((acc, a) => {
                                        if (!!acc[a[key]]) {
                                            acc[a[key]].push(a);
                                        }
                                        else {
                                            acc[a[key]] = [a];
                                        }
                                        return acc;
                                    }, {});
                            }
                            Array.from(document.querySelectorAll('input[type="radio"]')).filter((el) => el.value !== value).forEach((el) => el.checked = false);
                            document.querySelector('tbody').innerHTML = '';
                            switch (value) {
                                case 'id':
                                case 'requestId':
                                case 'router':
                                    values = reduceByKey(value);
                                    break;
                                default:
                                     values = JSON.parse(jsonValues);
                            }
                            if (value !== 'date') {
                                document.querySelector('tbody').innerHTML = Object.values(values).map((node, i) => createNode(node, i, value)).toReversed().join(' ');
                                document.querySelectorAll('#toggle').forEach((el) => {
                                    el.style.cursor = 'pointer';
                                    el.addEventListener('click', (e) => {
                                        const el = e.currentTarget;
                                        const parent = el.parentElement;
                                        if (Array.from(parent.children)[1].style?.fontSize === '0px') {
                                            Array.from(parent.children).slice(1).forEach((child) => child.style.fontSize = '');
                                        }
                                        else {
                                            Array.from(parent.children).slice(1).forEach((child) => child.style.fontSize = '0px');
                                        }
                                    });
                                });
                            }
                        }
                        document.querySelectorAll('input[type="radio"]').forEach((el) => el.addEventListener('input', update));
                        setTimeout(() => document.querySelector('input[value="disabled"').click(), 250);
                    </script>
				</body>
			</html>
			`, { headers: { 'Content-Type': 'text/html' } });
    }
}})
