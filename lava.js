const { execFile } = require('child_process');
const path = require('path');

const lavalinkProcess = execFile('java', ['-jar',
    path.join(__dirname, 'lavalink', 'Lavalink.jar'),
    `--spring.config.location=${path.join(__dirname, 'lavalink', 'application.yml')}`
]);

lavalinkProcess.stdout.on('data', (data) => {
    console.log(`${data}`);
    if (data.includes('Lavalink is ready to accept connections')) {
        // Start index.js once Lavalink is ready
        execFile('node', [path.join(__dirname, 'index.js')], { stdio: 'inherit' });
    }
});

lavalinkProcess.stderr.on('data', (data) => {
    console.error(`${data}`);
});

lavalinkProcess.on('close', (code) => {
    console.log(`Lavalink process exited with code ${code}`);
});

lavalinkProcess.on('error', (err) => {
    console.error('Failed to start Lavalink process:', err);
});