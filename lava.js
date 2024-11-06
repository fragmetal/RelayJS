const { execFile, exec } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');
const https = require('https');
// SET UTILS
logger = require('./src/utils/logger.js');
// Function to download a file using HTTPS
function downloadFile(url, dest, cb) {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
        if (response.statusCode !== 200) {
            cb(`Failed to download file: ${response.statusCode}`);
            return;
        }
        response.pipe(file);
        file.on('finish', () => {
            file.close(() => {
                const stats = fs.statSync(dest);
                if (stats.size < 100000) {
                    cb('Downloaded file is too small, possible corruption.');
                } else {
                    cb();
                }
            });
        });
    }).on('error', (err) => {
        fs.unlink(dest, () => cb(err.message));
    });
}

// Paths
const javaDir = path.join(__dirname, 'openjdk');
const javaPath = path.join(javaDir, 'bin', 'java');

// Check if Java is installed
if (fs.existsSync(javaPath)) {
    console.log('Java is already installed at:', javaPath);
    startLavalink(javaPath);
} else {
    exec('java -version', (error, stdout, stderr) => {
        if (error) {
            console.error('Java is not installed. Downloading Java...');

            // Download Java
            const javaUrl = 'https://builds.openlogic.com/downloadJDK/openlogic-openjdk/22.0.2+9/openlogic-openjdk-22.0.2+9-linux-x64.tar.gz'; // Replace with actual URL
            const javaDest = path.join(__dirname, 'openjdk.tar.gz');

            downloadFile(javaUrl, javaDest, (err) => {
                if (err) {
                    console.error('Failed to download Java:', err);
                    return;
                }

                // Create the openjdk directory if it doesn't exist
                if (!fs.existsSync(javaDir)) {
                    fs.mkdirSync(javaDir);
                }

                // Extract Java to the openjdk directory
                exec(`tar -xzf ${javaDest} -C ${javaDir} --strip-components=1`, (extractError) => {
                    if (extractError) {
                        console.error('Failed to extract Java:', extractError);
                        return;
                    }

                    console.log('Java downloaded and extracted successfully.');

                    // Delete the tar.gz file after extraction
                    fs.unlink(javaDest, (unlinkError) => {
                        if (unlinkError) {
                            console.error('Failed to delete tar.gz file:', unlinkError);
                            return;
                        }
                        makeJavaExecutable(javaPath);
                    });
                });
            });
        } else {
            console.log('Java is installed:', stderr);
            startLavalink('java'); // Use system Java
        }
    });
}

function makeJavaExecutable(javaPath) {
    // Make the Java executable
    exec(`chmod +x ${javaPath}`, (chmodError) => {
        if (chmodError) {
            console.error('Failed to set executable permissions on Java:', chmodError);
            return;
        }

        startLavalink(javaPath);
    });
}

function startLavalink(javaExecutable) {
    const lavalinkJarPath = path.join(__dirname, 'Lavalink.jar');
    const configPath = path.join(__dirname, 'application.yml');
    const pluginsPath = path.join(__dirname, 'plugins');

    // Ensure the plugins directory exists
    if (!fs.existsSync(pluginsPath)) {
        console.error('Plugins directory does not exist:', pluginsPath);
        return;
    }

    // console.log('Starting Lavalink with the following parameters:');
    // console.log('Java Executable:', javaExecutable);
    // console.log('Lavalink JAR Path:', lavalinkJarPath);
    // console.log('Config Path:', configPath);
    // console.log('Plugins Path:', pluginsPath);

    // Start Lavalink directly using Java with plugins
    const lavalinkProcess = execFile(javaExecutable, [
        '-jar',
        lavalinkJarPath,
        `--spring.config.location=${configPath}`,
        `-Dplugin.dir=${pluginsPath}`
    ]);

    lavalinkProcess.stdout.on('data', (data) => {
        //console.log(`${data}`);
        if (data.includes('Lavalink is ready to accept connections.')) {
            logger.info(`Starting bot...`);
            const botProcess = exec('node index.js');

            botProcess.stdout.on('data', (botData) => {
                console.log(`${botData}`);
            });

            botProcess.stderr.on('data', (botError) => {
                console.error(`Bot stderr: ${botError}`);
            });

            botProcess.on('close', (code) => {
                console.log(`Bot process exited with code ${code}`);
            });

            botProcess.on('error', (err) => {
                console.error('Failed to start bot process:', err);
            });
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
}

// HTTP Server to manage bot actions
const server = http.createServer((req, res) => {
    if (req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Welcome to the bot management server.');
    }
});

server.listen(80, '0.0.0.0', () => {});