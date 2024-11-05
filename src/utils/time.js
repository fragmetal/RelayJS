// Define the function to format milliseconds into a time string
async function formatMS_HHMMSS(num) {
    return [86400000, 3600000, 60000, 1000, 1].reduce((p, c) => {
        let res = ~~(num / c);
        num -= res * c;
        return [...p, res];
    }, [])
    .map((v, i) => i <= 1 && v === 0 ? undefined : [ i === 4 ? "." : "", v < 10 ? `0${v}` : v, [" Days, ", ":", ":", "", ""][i]].join(""))
    .filter(Boolean)
    .slice(0, -1)
    .join("");
}

// Define a delay function that returns a promise
const delay = async (ms) => new Promise(r => setTimeout(() => r(true), ms));

// Export the functions using CommonJS
module.exports = {
    formatMS_HHMMSS,
    delay
};
