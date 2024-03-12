import * as fs from "fs";
import { DateTime } from "luxon";

const BunLogger = {
  store: null,
  path: null,
  router: null,
};

let BunLoggerException = (type = 'log', args = []) => true;

const BunLoggerDefaultOptions = {
  logPath: 'var/log/bunLogger.json',
  limit: 100,
  exception: BunLoggerException,
  routerPath: '/log',
}

const BunLoggerSetup = (options = BunLoggerDefaultOptions) => {
  BunLogger.router = options.routerPath;
  BunLogger.path = options.logPath;
  process.on('beforeExit', () => {
    fs.rmSync(options.logPath);
  })
  options = {...BunLoggerDefaultOptions, ...options};
  BunLoggerException = options.exception;
  let logFile = '[]';
  try {
    logFile = fs.readFileSync(options.logPath).toString() || '[]';
  }
  catch (e) {
    logFile = '[]';
  }
  BunLogger.store = new Proxy((options?.logPath ? (JSON.parse(logFile) ?? []) : [])?.slice(-options.limit), {
    get: (target, p, receiver) => {
      return target[p];
    },
    set: (target, p, newValue, receiver) => {
      target[p] = newValue;
      if (options?.logPath) {
        if (fs.existsSync(options.logPath)) fs.rmSync(options.logPath);
        if (!fs.existsSync(options.logPath.split('/').slice(0, -1).join('/'))) fs.mkdirSync(options.logPath.split('/').slice(0, -1).join('/'), {recursive: true});
        try {
          fs.writeFileSync(options.logPath, JSON.stringify(target));
        }
        catch (e) {
          originalError(e);
        }
      }
      return true;
    }
  });
}

const originalLog = console.log;
const originalError = console.error;

function BunLoggerLog(...args) {
  if (BunLogger.store === null) throw new Error('[BunLogger] Store has not setup');
  if (BunLoggerException('log', args)) {
    let date = DateTime.now().toFormat('dd.MM.yyyy hh:mm:ss').toLocaleString();
    let id = this?.id ?? NaN;
    let requestId = this?.requestId ?? NaN;
    let router = this?.key ?? 'Untitled Router';
    let consoleMessage = `${DateTime.now().toFormat('dd.MM.yyyy hh:mm:ss').toLocaleString()} - [${id}] - <${requestId}> - [${router}] - `;
    let storeMessage = {
      type: 'info',
      message: args.join(' '),
      router,
      id,
      date,
      requestId,
    }
    BunLogger.store.push(storeMessage);
    originalLog(consoleMessage, ...args);
  }
}
const BunLoggerError = (...args) => {
  if (BunLogger.store === null) throw new Error('[BunLogger] Store has not setup');
  if (BunLoggerException('error', args)) {
    let date = DateTime.now().toFormat('dd.MM.yyyy hh:mm:ss').toLocaleString();
    // @ts-ignore
    let id = this?.id ?? NaN;
    // @ts-ignore
    let router = this?.key ?? 'Untitled Router';
    let consoleMessage = `${DateTime.now().toFormat('dd.MM.yyyy hh:mm:ss').toLocaleString()} - [${id}] - [${router}] - `;
    let storeMessage = {
      type: 'error',
      message: args.join(' '),
      router,
      id,
      date,
    }
    BunLogger.store.push(storeMessage);
    originalError(consoleMessage, ...args);
  }
}

export const Logger = {
  Logger: BunLogger,
  log: BunLoggerLog,
  error: BunLoggerError,
  setup: BunLoggerSetup,
}
export default Logger;
