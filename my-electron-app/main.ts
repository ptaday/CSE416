import { app, BrowserWindow, ipcMain } from 'electron';
import crypto from 'crypto';
import path from 'path';

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
        preload: path.join(__dirname, 'preload.js'), // Path to your preload file
      nodeIntegration: true, // Enable Node.js integration in renderer process
      contextIsolation: true, // Disable context isolation
    },
  });

  mainWindow.loadURL('http://localhost:5173'); // Load your Vite app
  mainWindow.webContents.openDevTools(); // Open DevTools for debugging
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Handle key generation via IPC
ipcMain.handle('generate-keys', async (_, passphrase: string) => {
  try {
    // Generate RSA key pair
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });

    // Encrypt the private key using the provided passphrase
    const algorithm = 'aes-256-cbc';
    const key = crypto.createHash('sha256').update(passphrase).digest();
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encryptedPrivateKey = cipher.update(privateKey, 'utf-8', 'hex');
    encryptedPrivateKey += cipher.final('hex');

    // Generate a hash of the public key to serve as the username
    const usernameHash = crypto.createHash('sha256').update(publicKey).digest('hex');

    // Return the public key, encrypted private key, and username hash
    return {
      publicKey,
      encryptedPrivateKey: `${iv.toString('hex')}:${encryptedPrivateKey}`,
      username: usernameHash,
    };
  } catch (error) {
    console.error('Error generating key pair:', error);
    throw error;
  }
});
