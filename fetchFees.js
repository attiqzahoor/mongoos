const fetch = require('node-fetch');

const fetchRecommendedFees = async () => {
    try {
        const response = await fetch("https://mempool.space/testnet/api/v1/fees/recommended");
        const fees = await response.json();
        return fees;
    } catch (error) {
        console.error('Error fetching recommended fees:', error);
    }
};

module.exports = { fetchRecommendedFees };
