const jwt = require('jsonwebtoken');

const jwtConfig = {
    secret: process.env.JWT_SECRET || 'fallback-secret',
    expiresIn: process.env.JWT_EXPIRE || '24h',
    streamingSecret: process.env.STREAMING_SECRET || 'streaming-secret'
};

const generateToken = (payload) => {
    return jwt.sign(payload, jwtConfig.secret, { 
        expiresIn: jwtConfig.expiresIn 
    });
};

const generateStreamingToken = (payload) => {
    return jwt.sign(payload, jwtConfig.streamingSecret, { 
        expiresIn: '10m' // 10 minutes for streaming links
    });
};

const verifyToken = (token) => {
    return jwt.verify(token, jwtConfig.secret);
};

const verifyStreamingToken = (token) => {
    return jwt.verify(token, jwtConfig.streamingSecret);
};

module.exports = {
    jwtConfig,
    generateToken,
    generateStreamingToken,
    verifyToken,
    verifyStreamingToken
};
