# WebSocket Server with Redis Pub/Sub and Load Balancing

This repository demonstrates a scalable WebSocket setup using Redis Pub/Sub and load balancing to allow efficient, room-based messaging across multiple WebSocket servers. By leveraging sticky sessions, Redis channels, and WebSocket rooms, clients can subscribe to specific rooms, publish messages, and communicate across server instances.

## Architecture Overview

This WebSocket server uses **Redis** as a centralized Pub/Sub message broker, allowing multiple WebSocket servers to communicate seamlessly. Clients connect through a **load balancer** that distributes connections while maintaining **sticky sessions** to ensure that each client consistently connects to the same server instance.

### Key Components

1. **WebSocket Server**: Manages WebSocket connections, handles room subscriptions, and broadcasts messages to clients within rooms.
2. **Redis Pub/Sub**: Provides cross-server communication so that messages published in one room are sent to all clients across all WebSocket servers in that room.
3. **Load Balancer with Sticky Sessions**: Ensures that each client remains connected to the same server during their session for stateful communication.

### Room-Based Messaging Flow

1. **Client Connection**: When a client connects to the WebSocket server through the load balancer, it is assigned to a server instance with a sticky session.
2. **Room Subscription**: The client specifies a room to join. The WebSocket server adds the client to the room and subscribes to the relevant Redis channel if not already subscribed.
3. **Message Publishing**: When a client sends a message to the room, the server publishes it to Redis. Redis then broadcasts the message to all subscribed servers.
4. **Room Broadcast**: Each server receives the Redis-published message and forwards it to clients in the specified room, regardless of which server instance they are connected to.

## Getting Started

### Prerequisites

- **Node.js** and **npm** installed.
- **Redis** server running for Pub/Sub.
- **NGINX or HAProxy** configured for load balancing.

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/your-username/websocket-redis-pubsub.git
cd websocket-redis-pubsub
npm install
