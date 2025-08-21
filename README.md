# Real-Time Chat Application Backend

A robust real-time chat application backend built with Node.js, Express, Socket.IO, TypeScript, and MySQL using Prisma ORM.

## 🚀 Features

- **User Authentication**: JWT-based auth with bcrypt password hashing
- **Chat Rooms**: Create public/private rooms with invitation codes
- **Real-Time Messaging**: Socket.IO for instant message delivery
- **User Presence**: Online/offline status tracking
- **Security**: Rate limiting, input validation, CORS protection

## 🛠️ Prerequisites

- Node.js (v16+)
- MySQL (v8.0+)
- npm or yarn

## 📦 Installation

### 1. Clone and Install
```bash
git clone <repository-url>
cd chat-app-backend
npm install
```

### 2. Environment Setup
```bash
cp env.example .env
```

Edit `.env` with your configuration:
```env
DATABASE_URL="mysql://username:password@localhost:3306/chat-app"
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_EXPIRES_IN="7d"
PORT=3000
NODE_ENV="development"
```

### 3. Database Setup
```sql
CREATE DATABASE `chat-app`;
```

```bash
npm run prisma:generate
npm run prisma:migrate
```

### 4. Build and Run
```bash
npm run build
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get profile (auth required)

### Rooms
- `POST /api/rooms` - Create room (auth required)
- `GET /api/rooms/my-rooms` - Get user's rooms (auth required)
- `GET /api/rooms/public` - Get public rooms
- `POST /api/rooms/join` - Join room (auth required)
- `GET /api/rooms/:roomId` - Get room details (auth required)

### Messages
- `GET /api/messages/room/:roomId` - Get messages (auth required)
- `POST /api/messages` - Send message (auth required)
- `PUT /api/messages/:messageId` - Edit message (auth required)
- `DELETE /api/messages/:messageId` - Delete message (auth required)

## 🔌 Socket.IO Events

### Client to Server
- `join_room` - Join a chat room
- `send_message` - Send a message
- `typing` - Typing indicator

### Server to Client
- `joined_room` - Room join confirmation
- `receive_message` - New message received
- `typing` - User typing indicator
- `user_status` - User online/offline status
- `user_joined_room` - User joined room notification

## 🧪 Testing

```bash
npm test
```

## 📁 Project Structure
```
src/
├── config/          # Database and Socket.IO config
├── controllers/     # Business logic
├── middleware/      # Auth, error handling, rate limiting
├── routes/          # API endpoints
├── utils/           # JWT, password, validation utilities
└── index.ts         # Main application entry
```

## 🛡️ Security Features

- Password hashing with bcrypt
- JWT authentication
- Rate limiting (API: 100/10s, Messages: 5/10s)
- Input validation with Joi
- CORS protection
- Room access control

## 🚀 Deployment

1. Set up MySQL database
2. Configure environment variables
3. Run migrations: `npm run prisma:migrate`
4. Build: `npm run build`
5. Start: `npm start`

## 📜 Available Scripts

- `npm run build` - Build TypeScript
- `npm start` - Start production server
- `npm run dev` - Start development server
- `npm test` - Run tests
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run migrations
- `npm run prisma:studio` - Open Prisma Studio

## 🔍 Health Check

```bash
curl http://localhost:3000/health
```

## 📄 License

MIT License
