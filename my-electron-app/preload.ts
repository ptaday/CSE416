import { contextBridge } from 'electron';
import * as crypto from 'crypto';

// Expose safe APIs to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  generateKeyPair: (passphrase: string) => {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
        cipher: 'aes-256-cbc',
        passphrase: passphrase,
      },
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
    });
    return { publicKey, privateKey };
  }
});
