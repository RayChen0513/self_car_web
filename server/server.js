import express from 'express';
import path from 'path';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });
const PORT = process.env.PORT || 3000;

let Position = { lat: null, lng: null }; // 初始位置

// WebSocket connection handler
wss.on('connection', (ws) => {
    console.log('[WebSocket] Client connected');

    ws.on('message', (data) => {
        console.log('[WebSocket] Received:', data.toString());
        // Optionally broadcast to all connected clients
        wss.clients.forEach((client) => {
            if (client.readyState === 1) { // OPEN
                client.send(JSON.stringify({ echo: data.toString(), data}));
            }
        });
    });

    ws.on('error', (error) => {
        console.log('[WebSocket] Error:', error.message);
    });

    ws.on('close', () => {
        console.log('[WebSocket] Client disconnected');
    });
});

app.post('/api/setDevicePos', express.json(), (req, res) => {
    const { lat, lng } = req.body;
    // 這裡你可以將位置存儲到資料庫或其他地方
    console.log(`Received device position: lat=${lat}, lng=${lng}`);
    Position = { lat, lng };
    res.status(200).send({ message: 'Position updated' });
});

app.get('/api/getDevicePos', (req, res) => {
    res.status(200).json(Position);
});

server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`WebSocket server is running on ws://localhost:${PORT}`);
});