import WebSocket, { WebSocketServer } from 'ws';
import { createClient } from 'redis';

// Initialize Redis
const redisSubscriber = createClient();
const redisPublisher = createClient();

// Connect both Redis clients
async function initializeRedis() {
    await redisSubscriber.connect();
    await redisPublisher.connect();
    console.log('Redis clients connected');
}



// Set up WebSocket server
const wss = new WebSocketServer({ port: 8080 });

// Track clients and rooms
const rooms: Map<string, Set<WebSocket>> = new Map();

// Initialize Redis connections
initializeRedis().catch(console.error);

// Subscribe to Redis channels for each room
async function subscribeToRoom(room: string) {
    await redisSubscriber.subscribe(room, (message) => {
        // Broadcast the message to all clients in the room
        const clients = rooms.get(room);
        if (clients) {
            for (const client of clients) {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(message);
                }
            }
        }
    });
}

// Handle WebSocket connection
wss.on('connection', (ws: WebSocket) => {
    ws.on('message', async (data) => {
        const { room, message } = JSON.parse(data.toString());

        // Add client to the room
        if (!rooms.has(room)) {
            rooms.set(room, new Set());
            await subscribeToRoom(room);  // Subscribe Redis to this room's channel
        }
        rooms.get(room)!.add(ws);

        // Publish message to Redis, which will broadcast to all servers
        await redisPublisher.publish(room, message);
    });

    // Remove the client from the room on disconnect
    ws.on('close', () => {
        rooms.forEach((clients, room) => {
            clients.delete(ws);
            if (clients.size === 0) {
                rooms.delete(room);
            }
        });
    });
});

console.log('WebSocket server is listening on ws://localhost:8080');

/*import WebSocket, { WebSocketServer } from 'ws';
import { createClient } from 'redis';

interface ClientMessage {
    userId: string;
}

interface PubSubMessage {
    userId: string;
    message: string;
}

// Initialize WebSocket server on port 8080
const wss = new WebSocketServer({ port: 8080 });

// Initialize Redis clients for pub/sub
const redisSubscriber = createClient();
const redisPublisher = createClient();

// Connect both Redis clients
async function initializeRedis() {
    await redisSubscriber.connect();
    await redisPublisher.connect();
    console.log('Redis clients connected');
}

// Broadcast function to send a message to all connected clients
function broadcastMessage(data: ClientMessage) {
    for (const client of clients) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    }
}

// Store active connections with user IDs
const clients: Set<WebSocket> = new Set();

// Initialize Redis connections
initializeRedis().catch(console.error);

// Subscribe to the 'events' channel once when server starts
redisSubscriber.subscribe('events', (message) => {
    try {
        const pubSubMessage: PubSubMessage = JSON.parse(message);
        const { userId } = pubSubMessage;
        // Emit event to the relevant user if connected
        broadcastMessage({ "userId": userId });

    } catch (error) {
        console.error('Error parsing message from Redis:', error);
    }
});

// Handle WebSocket connections
wss.on('connection', (ws: WebSocket) => {
    console.log('New client connected');
    clients.add(ws);
    // Listen for the first message containing the user ID
    ws.on('message', async (data: string) => {
        console.log("Received message:", data);
        try {
            // Parse incoming data
            const message: ClientMessage = JSON.parse(data);

            // Check if the userId exists in the parsed message
            if (message.userId) {
                // Register WebSocket connection with user ID
                
                console.log(`User ${message.userId} connected`);

                // Send confirmation to client
                ws.send(JSON.stringify({ status: 'subscribed', userId: message.userId }));

                // Publish an initial message for this user to the 'events' channel
                const initialMessage: PubSubMessage = {
                    userId: message.userId,
                    message: `hi from ${message.userId}`
                };
                console.log(JSON.stringify(initialMessage));

                // Use the publish method correctly
                await redisPublisher.publish('events', JSON.stringify(initialMessage));
            } else {
                ws.send(JSON.stringify({ error: 'Invalid message: missing userId' }));
            }
        } catch (error) {
            console.error("Invalid message format:", data, error);
            ws.send(JSON.stringify({ error: 'Invalid message format' }));
        }
    });

    // Handle connection close
    ws.on('close', () => {
        clients.delete(ws);
    });
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down...');
    await redisSubscriber.quit();
    await redisPublisher.quit();
    process.exit(0);
});

console.log('WebSocket server is listening on ws://localhost:8080');*/