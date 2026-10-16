import { ipcRenderer, remote } from 'electron'
import * as dgram from 'dgram';

import { AddressInfo } from 'net';
import { Options } from './types';

import path from 'path';
import fs from 'fs';
import zlib from 'zlib';
import { nanoid } from 'nanoid';
import { throttle } from 'lodash';

import { store } from '../store/store';

import { clientConnect, clientDisconnect, clientUpdateRecorderInfo } from '../actions/clients';

const { app } = remote;

export const DEFAULT_RECEIVE_PORT = 20777;
export const DEFAULT_FORWARD_PORT = 30500;
export const CLIENT_STARTED_ERROR_MESSAGE = 'Client was already started';


export default class BaseClient {
  receivePort: number;
  forwardPort: number;
  socket: dgram.Socket | undefined;
  verbose: boolean;
  isRunning: boolean;
  clientId: string;
  clientType: string | null;
  file: zlib.Gzip | undefined;
  lastMessage: string | null;
  messageCount: number | null;

  constructor(opts: Options = {}) {
    const { receivePort = DEFAULT_RECEIVE_PORT, forwardPort = DEFAULT_FORWARD_PORT, verbose = true } = opts;

    this.receivePort = receivePort;
    this.forwardPort = forwardPort
    this.verbose = verbose;
    this.isRunning = false;

    this.clientId = nanoid();
    this.clientType = null;

    this.lastMessage = null;
    this.messageCount = null;

    this.throttled_updateRecorderInfo = throttle(this.updateRecorderInfo, 200);

    this.initialiseIPCConnections();
  }

  initialiseIPCConnections() {
    ipcRenderer.on('APP', (event, message) => {
      const { messageType } = message;
      switch (messageType) {
        case 'close': {
          this.disconnect();
          break;
        }
        default: {
          break;
        }
      }
    })
  }

  createStream() {
    const basePath = path.join(app.getPath('documents'), 'Racehub');
    const filePath = path.join(basePath, `${Date.now()}.rhc`);
    fs.mkdirSync(basePath, {recursive: true});
    return fs.createWriteStream(filePath);
  }

  parseMessage(m: Buffer) {
    this.messageCount++
    this.lastMessage = new Date().getTime();
    this.throttled_updateRecorderInfo();

    if (this.socket) {
      this.socket.send(m, 0, m.length, this.forwardPort, '0.0.0.0');
    }

    if (this.file) {
      const ret = this.file.write(m);
      console.log(ret);
    }
  }

  connect() {
    const { clientId } = this;
    this.start();
    store.dispatch(clientConnect(clientId));
  }

  disconnect() {
    const { clientId } = this;
    this.stop();
    this.lastMessage = null;
    this.messageCount = null;
    store.dispatch(clientDisconnect(clientId));
  }

  start() {
    if (this.isRunning) {
      throw CLIENT_STARTED_ERROR_MESSAGE;
    }

    this.file = zlib.createGzip();
    this.file.pipe(this.createStream());

    this.socket = dgram.createSocket('udp4');

    this.socket.on('listening', () => {
      if (!this.socket) {
        return;
      }

      const address: AddressInfo = this.socket.address() as AddressInfo;

      if (this.verbose) {
        console.log(
          `UDP socket listening on ${address.address}:${address.port}`
        );
      }

      this.socket.setBroadcast(true);
    });

    this.socket.on('message', m => this.parseMessage(m));

    this.socket.bind(this.receivePort);

    this.isRunning = true;
  }

  stop() {
    if (!this.isRunning) {
      return;
    }

    return (
      this.socket &&
      this.socket.close(() => {
        if (this.verbose) {
          console.log(`UDP socket closed`);
        }

        this.socket = undefined;

        this.file &&
        this.file.end(() => {
          if (this.verbose) {
            console.log(`File closed`);
          }

          this.file = undefined;
        });

        this.isRunning = false;
      })
    );
  }

  updateRecorderInfo() {
    const { clientId, messageCount, lastMessage } = this;

    const message = {
      messageCount,
      lastMessage
    };

    store.dispatch(clientUpdateRecorderInfo(clientId, message));
  }
}
