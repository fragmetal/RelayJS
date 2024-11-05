const { execFile, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const https = require('https');

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

// Check if Java is installed
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
            const javaDir = path.join(__dirname, 'openjdk');
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

                    console.log('tar.gz file deleted successfully.');
                    makeJavaExecutable();
                });
            });
        });
    } else {
        console.log('Java is installed:', stderr);
        startLavalink();
    }
});

function makeJavaExecutable() {
    const javaDir = path.join(__dirname, 'openjdk'); // Replace with actual folder name
    const javaPath = path.join(javaDir, 'bin', 'java');

    // Make the Java executable
    exec(`chmod +x ${javaPath}`, (chmodError) => {
        if (chmodError) {
            console.error('Failed to set executable permissions on Java:', chmodError);
            return;
        }

        startLavalink();
    });
}

function startLavalink() {
    // Adjust the path based on the actual extraction
    const javaDir = path.join(__dirname, 'openjdk'); // Replace with actual folder name
    const javaPath = path.join(javaDir, 'bin', 'java');

    // Check if the Java executable exists
    if (!fs.existsSync(javaPath)) {
        console.error('Java executable not found at:', javaPath);
        return;
    }

    // Start Lavalink process
    const lavalinkProcess = execFile(javaPath, ['-jar',
        path.join(__dirname, 'lavalink', 'Lavalink.jar'),
        `--spring.config.location=${path.join(__dirname, 'lavalink', 'application.yml')}`
    ]);

    lavalinkProcess.stdout.on('data', (data) => {
        console.log(`${data}`);
        if (data.includes('Lavalink is ready to accept connections')) {
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
}