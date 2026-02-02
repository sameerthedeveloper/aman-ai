const { app, BrowserWindow, Tray, Menu, nativeImage, shell } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;
let tray;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        minHeight: 600,
        titleBarStyle: 'hiddenInset', // Mac-style native title bar
        backgroundColor: '#0f1012',
        icon: path.join(__dirname, 'assets/app-icon.png'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false, // For simple dev, can be tightened later
        },
        show: false, // Don't show until ready
    });

    // Load the app
    const startUrl = isDev
        ? 'http://localhost:5173'
        : `file://${path.join(__dirname, '../dist/index.html')}`;

    mainWindow.loadURL(startUrl);

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // Open external links in browser
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    // Handle close to hide instead of quit (Mac style)
    mainWindow.on('close', (event) => {
        if (!app.isQuitting) {
            event.preventDefault();
            mainWindow.hide();
        }
        return false;
    });
}

function createTray() {
    const iconPath = path.join(__dirname, 'assets/tray-icon.png');
    console.log('Loading tray icon from:', iconPath);

    let icon = nativeImage.createFromPath(iconPath);
    if (icon.isEmpty()) {
        console.error('Failed to load tray icon!');
    } else {
        icon = icon.resize({ width: 16, height: 16 });
        icon.setTemplateImage(true); // Mac-style dark/light mode adaptation
    }

    tray = new Tray(icon);
    tray.setToolTip('AMAN-AI');

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Show AMAN-AI',
            click: () => {
                mainWindow.show();
                mainWindow.focus();
            }
        },
        { type: 'separator' },
        {
            label: 'Quit',
            click: () => {
                app.isQuitting = true;
                app.quit();
            }
        }
    ]);

    tray.setContextMenu(contextMenu);

    // Toggle on click
    tray.on('click', () => {
        if (mainWindow.isVisible()) {
            if (mainWindow.isFocused()) {
                mainWindow.hide();
            } else {
                mainWindow.focus();
            }
        } else {
            mainWindow.show();
            mainWindow.focus();
        }
    });
}

app.whenReady().then(() => {
    // Explicitly set dock icon for macOS dev environment
    if (process.platform === 'darwin') {
        const iconPath = path.join(__dirname, 'assets/app-icon.png');
        app.dock.setIcon(iconPath);
    }

    createWindow();
    createTray();

    // Start Backend (Production only)
    let backendProcess = null;
    if (!isDev) {
        const backendPath = path.join(process.resourcesPath, 'backend-dist', 'aman-backend');
        console.log('Starting backend from:', backendPath);
        backendProcess = spawn(backendPath, [], {
            detached: false,
            stdio: 'ignore' // or 'inherit' for debugging
        });

        backendProcess.unref();
    }

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        } else {
            mainWindow.show();
        }
    });

    app.on('will-quit', () => {
        if (backendProcess) {
            backendProcess.kill();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', () => {
    app.isQuitting = true;
});
