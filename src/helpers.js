function normalizeNumber(number) {
    return number.replace(/^0/, '62').replace(/\D/g, '');
}

module.exports = {
    normalizeNumber
}
