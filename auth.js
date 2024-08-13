const axios = require('axios');
const creds = require('./credentials.json')
const fs = require('fs');
const config = require('./config.json')
const { checkTimestamp } = require('./utils.js')

const getToken = async (event, context) => {
    try {
        const response = await axios.post('https://api.smartling.com/auth-api/v2/authenticate', {
            userIdentifier: creds.userIdentifier,
            userSecret: creds.userSecret
        })
        if (response.status === 200) {
            const accessToken = response.data.response.data.accessToken
            const refreshToken = response.data.response.data.refreshToken
            const timestamp = new Date().toISOString();
            fs.writeFileSync('config.json', JSON.stringify({ refreshToken, accessToken, timestamp }, null, 3));
            return config.accessToken
        } else {
            return 'There was an error with your request'
        }
    } catch (err) {
        console.error(`Get token error: Something went wrong ${err}`)
    }
}

const refreshToken = async (event, context) => {
    try {
        const response = await axios.post('https://api.smartling.com/auth-api/v2/authenticate/refresh', {
            refreshToken: config.refreshToken
        })
        if (response.status === 200) {
            console.log('Token refreshed');
            const accessToken = response.data.response.data.accessToken
            const refreshToken = response.data.response.data.refreshToken
            const timestamp = new Date().toISOString();
            fs.writeFileSync('config.json', JSON.stringify({ refreshToken, accessToken, timestamp }, null, 3));
            return accessToken
        } else {
            getToken()
        }
    } catch (err) {
        console.error(`Refresh auth error: Something went wrong ${err}`)
    }
}

const token = async (event, context) => {
    if (!checkTimestamp(config.timestamp)) {
        return config.accessToken
    } else {
        const refresh = await refreshToken()
        return refresh
    }
}

module.exports = {
    getToken,
    token
};