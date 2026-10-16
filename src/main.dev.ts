/* eslint global-require: off, no-console: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `yarn build` or `yarn build-main`, this file is compiled to
 * `./src/main.prod.js` using webpack. This gives us some performance wins.
 */
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import path from 'path';
import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron';
import Store from 'electron-store';
import { nanoid } from 'nanoid';

Store.initRenderer();

let clientWindow: BrowserWindow | null = null;
const parsingWindows = [];

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

if (
  process.env.NODE_ENV === 'development' ||
  process.env.DEBUG_PROD === 'true'
) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

const initialiseClients = () => {
  clientWindow?.webContents.send('CLIENTS', 'INITIALISE');
}

ipcMain.on('PARSE_REQUEST', (event, arg) => {
  dialog.showOpenDialog(clientWindow, {
    title: "Parse .rhc file",
    filters: [{ name: 'Racehub Client Recording', extensions: ['rhc']}],
    properties: ['openFile', 'multiSelections']
  }).then(result => {
    if (!result.canceled) {
      result.filePaths.forEach(filepath => {
        const parserId = nanoid();
        const parsingWindow = createParsingWindow(parserId, filepath);
        parsingWindows.push({parserId, filepath, parsingWindow});
        clientWindow?.webContents.send('ADD_PARSER', parserId, filepath);
      });
    }
  }).catch(err => {
    console.log(err)
  })
});

ipcMain.on('PARSER_PROGRESS', (event, parserId, progress) => {
  clientWindow?.webContents.send('PARSER_PROGRESS', parserId, progress);
});

const createWindow = async () => {
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.DEBUG_PROD === 'true'
  ) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  clientWindow = new BrowserWindow({
    show: false,
    width: 475,
    height: 720,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      // TODO: Remove this in future
      enableRemoteModule: true,
      nodeIntegration: true,
    },
  });

  clientWindow.loadURL(`file://${__dirname}/clientWindow/index.html`);

  // @TODO: Use 'ready-to-show' event
  //        https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
  clientWindow.webContents.on('did-finish-load', () => {
    if (!clientWindow) {
      throw new Error('"clientWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      clientWindow.minimize();
    } else {
      clientWindow.show();
      clientWindow.focus();
    }
    initialiseClients();
  });

  clientWindow.on('close', () => {
    parsingWindows.forEach(w => w.parsingWindow.close()); //TODO: should neaten this up with the windows closing once they have finished.
    clientWindow?.webContents.send('APP', {messageType: 'close'});
  })

  clientWindow.on('closed', () => {
    clientWindow = null;
  });

  clientWindow.setMenuBarVisibility(false);

  // Open urls in the user's browser
  clientWindow.webContents.on('new-window', (event, url) => {
    event.preventDefault();
    shell.openExternal(url);
  });

};

// Exception to permit non-NAPI native module
app.allowRendererProcessReuse = false

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// open on startup
const appFolder = path.dirname(process.execPath)
const updateExe = path.resolve(appFolder, '..', 'Update.exe')
const exeName = path.basename(process.execPath)

app.setLoginItemSettings({
  openAtLogin: true,
  path: updateExe,
  args: [
    '--processStart', `"${exeName}"`,
    '--process-start-args', `"--hidden"`
  ]
})

app.whenReady().then(createWindow).catch(console.log);

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (clientWindow === null) createWindow();
});

const createParsingWindow = (parserId: string, filepath: string) => {
  let parsingWindow: BrowserWindow | null = null;

  parsingWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      devTools: false,
      // TODO: Remove this in future
      enableRemoteModule: true,
      nodeIntegration: true,
    },
  });
  parsingWindow.loadURL(`file://${__dirname}/parsingWindow/index.html`);

  parsingWindow.webContents.on('did-finish-load', () => {
    if (!parsingWindow) {
      throw new Error('"parsingWindow" is not defined');
    }
    //parsingWindow.show();

    parsingWindow.webContents.send('PARSE_FILEPATH', parserId, filepath);
  });

  parsingWindow.on('closed', () => {
    parsingWindow = null;
  });

  parsingWindow.setMenuBarVisibility(false);

  return parsingWindow;
}
