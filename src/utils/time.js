// Define the function to format milliseconds into a time string
function formatMS_HHMMSS(num) {
    const hours = Math.floor(num / 3600000);
    num %= 3600000;
    const minutes = Math.floor(num / 60000);
    num %= 60000;
    const seconds = Math.floor(num / 1000);

    const timeParts = [];
    if (hours > 0) timeParts.push(hours.toString().padStart(2, '0'));
    timeParts.push(minutes.toString().padStart(2, '0'));
    timeParts.push(seconds.toString().padStart(2, '0'));

    return timeParts.join(':');
}

// Define a delay function that returns a promise
const delay = async (ms) => new Promise(r => setTimeout(() => r(true), ms));

// Export the functions using CommonJS
module.exports = {
    formatMS_HHMMSS,
    delay
};
