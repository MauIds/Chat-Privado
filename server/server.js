const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const User = require('./models/User');
const Message = require('./models/Message');

// Cargar variables de entorno
dotenv.config();

// Conectar a la base de datos
connectDB();

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.FRONTEND_URL || "*" 
      : "*",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(express.json());

// Configuración de CORS mejorada para producción
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL || "*" 
    : "*",
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
};
app.use(cors(corsOptions));

// Rutas
app.use('/api/auth', require('./routes/auth'));

// API para mensajes
app.get('/api/messages', async (req, res) => {
  try {
    const messages = await Message.find().sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error en el servidor');
  }
});

// Health check endpoint para Render
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Inicializar usuarios (solo en desarrollo)
const initializeUsers = async () => {
  try {
    const userCount = await User.countDocuments();
    
    if (userCount === 0) {
      // Crear usuarios iniciales solo si no existen
      await User.create([
        {
          userId: 'usuario1',
          name: 'Ari',
          password: process.env.USER1_PASSWORD || 'password1'
        },
        {
          userId: 'usuario2',
          name: 'Mau',
          password: process.env.USER2_PASSWORD || 'password2'
        }
      ]);
      console.log('Usuarios iniciales creados');
    }
  } catch (err) {
    console.error('Error al inicializar usuarios:', err);
  }
};

// Socket.io
io.on('connection', (socket) => {
  console.log('Nuevo cliente conectado');
  
  // Unirse a la sala de chat
  socket.on('join', ({ userId }) => {
    socket.join('privatechat');
    socket.userId = userId;
    console.log(`${userId} se ha unido al chat`);
  });
  
  // Escuchar mensajes nuevos
  socket.on('sendMessage', async ({ senderId, sender, text }) => {
    try {
      // Guardar mensaje en la base de datos
      const message = new Message({
        senderId,
        sender,
        text,
        timestamp: Date.now()
      });
      
      await message.save();
      
      // Enviar mensaje a todos en la sala
      io.to('privatechat').emit('message', {
        id: message._id,
        senderId,
        sender,
        text,
        timestamp: message.timestamp
      });
    } catch (err) {
      console.error('Error al guardar mensaje:', err);
    }
  });
  
  // Cuando el cliente se desconecta
  socket.on('disconnect', () => {
    console.log('Cliente desconectado');
  });
});

// Servir archivos estáticos en producción
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../', 'client', 'index.html'));
  });
}

// Puerto e inicio del servidor
const PORT = process.env.PORT || 5000;

server.listen(PORT, async () => {
  console.log(`Servidor iniciado en puerto ${PORT}`);
  // Inicializar usuarios según el entorno
  if (process.env.INITIALIZE_USERS === 'true' || process.env.NODE_ENV !== 'production') {
    await initializeUsers();
  }
});