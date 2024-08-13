function checkTimestamp(isoString) {
    const isoDate = new Date(isoString);
    const now = new Date();
    const diffInMilliseconds = now - isoDate;
    const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60));
    return diffInMinutes >= 5
}


module.exports = {
    checkTimestamp
};