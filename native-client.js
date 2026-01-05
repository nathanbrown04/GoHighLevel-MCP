const https = require('https');
const readline = require('readline');
const fs = require('fs');

// CONFIG
const BASE_URL = 'https://web-production-5c6c5.up.railway.app';
const SSE_URL = `${BASE_URL}/sse`;
const LOG_FILE = 'C:\\mcp\\client_debug.log';

// STATE
let messageEndpoint = null;
let pendingMessages = [];
let streamBuffer = ''; // <--- NEW: Buffer for fragmented packets

// Clear log on start
fs.writeFileSync(LOG_FILE, `[${new Date().toISOString()}] --- Client Started ---\n`);

//const log = (msg) => {
//    fs.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] ${msg}\n`);
//};

// 1. Connect to Railway
const connect = () => {
    log(`Connecting to ${SSE_URL}...`);
    
    const req = https.get(SSE_URL, {
        headers: { 
            'Accept': 'text/event-stream', 
            'Cache-Control': 'no-cache', 
            'Connection': 'keep-alive' 
        }
    }, (res) => {
        log(`Connected with status: ${res.statusCode}`);
        
        res.on('data', (chunk) => {
            // Append new chunk to the existing buffer
            streamBuffer += chunk.toString();
            
            // Only process if we have complete lines (split by newline)
            if (streamBuffer.includes('\n')) {
                const lines = streamBuffer.split('\n');
                // The last item is either empty or a partial line. Keep it in the buffer.
                streamBuffer = lines.pop(); 

                for (const line of lines) {
                    processLine(line.trim());
                }
            }
        });
    });
    
    req.on('error', (e) => {
        log(`Connection Error: ${e.message}`);
        setTimeout(connect, 5000);
    });
};

// Process a single, complete SSE line
const processLine = (trimmed) => {
    if (!trimmed) return;

    // Capture Endpoint
    if (trimmed.startsWith('data: ') && !trimmed.includes('{')) {
        let rawUrl = trimmed.replace('data: ', '').trim();
        if (rawUrl.startsWith('/')) {
            messageEndpoint = `${BASE_URL}${rawUrl}`;
        } else {
            messageEndpoint = rawUrl;
        }
        log(`Endpoint Captured: ${messageEndpoint}`);
        flushQueue();
        return;
    }

    // Forward JSON to Claude
    if (trimmed.startsWith('data: {')) {
        const jsonStr = trimmed.replace('data: ', '').trim();
        try {
            // Verify it parses before sending
            JSON.parse(jsonStr); 
            process.stdout.write(jsonStr + '\n');
        } catch (e) {
            log(`JSON Parse Error (Fragmented?): ${e.message}`);
        }
    }
};

// 2. Send Message Helper
const sendMessage = (data) => {
    if (!messageEndpoint) return;
    
    // VALIDATION
    try { JSON.parse(data); } catch (e) { return; }

    const url = new URL(messageEndpoint);
    const bodyBuffer = Buffer.from(data, 'utf-8');

    log(`Posting to: ${url.pathname}${url.search}`);
    
    const req = https.request(url, { 
        method: 'POST', 
        headers: { 
            'Content-Type': 'application/json',
            'Content-Length': bodyBuffer.length
        } 
    }, (res) => {
        if (res.statusCode !== 200 && res.statusCode !== 202) {
            log(`POST failed with status: ${res.statusCode}`);
            res.on('data', d => log(`Server Error: ${d.toString()}`));
        }
    });
    
    req.on('error', (e) => log(`POST Request Error: ${e.message}`));
    req.write(bodyBuffer);
    req.end();
};

const flushQueue = () => {
    if (pendingMessages.length > 0) {
        log(`Flushing ${pendingMessages.length} queued messages...`);
        pendingMessages.forEach(msg => sendMessage(msg));
        pendingMessages = [];
    }
};

const rl = readline.createInterface({ input: process.stdin });
rl.on('line', (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    if (!messageEndpoint) {
        log('Queueing message (Endpoint not ready)');
        pendingMessages.push(trimmed);
    } else {
        sendMessage(trimmed);
    }
});

connect();