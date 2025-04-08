// Verificar si API_URL ya está definido (desde auth.js)
if (typeof API_URL === 'undefined') {
  // Si no está definido, definirlo igual que en auth.js
  const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000'  // URL para desarrollo local
    : 'https://chat-privado-m71c.onrender.com';  // URL para producción en Render
  
  console.log('API_URL definido en app.js:', API_URL);
}
// Inicialización de la aplicación con Alpine.js
document.addEventListener('alpine:init', () => {
  Alpine.data('app', () => ({
    isAuthenticated: false,
    userId: null,
    userName: null,
    partnerName: null,
    password: '',
    authError: null,
    messages: [], // Asegurándonos de que siempre es un array
    newMessage: '',
    darkMode: false,
    socket: null,
    token: null,
    
    init() {
      console.log('Inicializando aplicación Alpine');
      // Intentar cargar la sesión
      const session = loadSession();
      if (session && session.isAuthenticated) {
        console.log('Sesión cargada:', { userId: session.userId, userName: session.userName });
        this.isAuthenticated = true;
        this.userId = session.userId;
        this.userName = session.userName;
        this.token = session.token;
        
        // Cargar datos y conectar socket
        this.initializeChat();
      } else {
        console.log('No hay sesión activa');
      }
      
      // Cargar preferencia de tema
      this.darkMode = loadThemePreference();
    },
    
    async initializeChat() {
      try {
        console.log('Inicializando chat');
        // Obtener información del otro usuario
        const partnerResponse = await getPartnerInfo(this.userId, this.token);
        if (partnerResponse.success) {
          this.partnerName = partnerResponse.data.partnerName;
          console.log('Partner cargado:', this.partnerName);
        } else {
          console.error('Error al cargar partner:', partnerResponse.message);
        }
        
        // Cargar mensajes anteriores
        await this.loadMessages();
        
        // Conectar al socket
        this.connectSocket();
        
        // Desplazarse al último mensaje
        this.$nextTick(() => this.scrollToBottom());
      } catch (error) {
        console.error('Error al inicializar chat:', error);
      }
    },
    
    async authenticate() {
      if (!this.password.trim()) {
        this.authError = 'Por favor, ingresa una contraseña';
        return;
      }
      
      try {
        console.log('Intentando autenticación');
        const response = await login(this.password);
        
        if (response.success) {
          console.log('Autenticación exitosa:', { userId: response.data.userId });
          this.isAuthenticated = true;
          this.userId = response.data.userId;
          this.userName = response.data.userName;
          this.token = response.data.token;
          this.password = '';
          this.authError = null;
          
          // Guardar sesión
          saveSession(response.data);
          
          // Inicializar chat
          this.initializeChat();
        } else {
          console.error('Error de autenticación:', response.message);
          this.authError = response.message;
        }
      } catch (error) {
        console.error('Error en proceso de autenticación:', error);
        this.authError = 'Error de conexión al servidor';
      }
    },
    
    logout() {
      console.log('Cerrando sesión');
      // Desconectar socket
      if (this.socket) {
        this.socket.disconnect();
      }
      
      // Reiniciar estado
      this.isAuthenticated = false;
      this.userId = null;
      this.userName = null;
      this.partnerName = null;
      this.token = null;
      this.messages = [];
      
      // Borrar sesión
      clearSession();
    },
    
    async loadMessages() {
      try {
        console.log('Cargando mensajes con token:', this.token);
        
        // Verificar que tenemos un token válido
        if (!this.token) {
          console.error('No hay token para cargar mensajes');
          return;
        }
        
        const response = await fetch(`${API_URL}/api/messages`, {
          headers: {
            'Authorization': `Bearer ${this.token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('Mensajes recibidos:', data);
          
          // Asegurarse de que messages sea un array
          if (Array.isArray(data)) {
            this.messages = data;
            console.log('Total de mensajes cargados:', this.messages.length);
          } else if (data.messages && Array.isArray(data.messages)) {
            this.messages = data.messages;
            console.log('Total de mensajes cargados (anidados):', this.messages.length);
          } else {
            console.error('Formato de datos incorrecto:', data);
            this.messages = []; // Inicializar como array vacío si los datos no son válidos
          }
        } else {
          console.error('Error al cargar mensajes. Estado:', response.status);
          this.messages = []; // Inicializar como array vacío en caso de error
        }
      } catch (error) {
        console.error('Error al cargar mensajes:', error);
        this.messages = []; // Inicializar como array vacío en caso de error
      }
    },
    
    connectSocket() {
      try {
        console.log('Conectando socket a:', API_URL);
        
        // Verificar que no exista una conexión previa
        if (this.socket) {
          console.log('Desconectando socket previo');
          this.socket.disconnect();
          this.socket = null;
        }
        
        // Conectar al servidor de socket con autenticación
        this.socket = io(API_URL, {
          auth: {
            token: this.token
          }
        });
        
        // Escuchar evento de conexión
        this.socket.on('connect', () => {
          console.log('Socket conectado exitosamente:', this.socket.id);
          
          // Unirse a la sala
          this.socket.emit('join', { 
            userId: this.userId,
            token: this.token 
          });
        });
        
        // Escuchar errores de conexión
        this.socket.on('connect_error', (error) => {
          console.error('Error de conexión del socket:', error);
        });
        
        // Escuchar nuevos mensajes
        this.socket.on('message', (message) => {
          console.log('Mensaje recibido:', message);
          
          if (!message || typeof message !== 'object') {
            console.error('Formato de mensaje inválido:', message);
            return;
          }
          
          const messageId = message.id || `temp-${Date.now()}`;
          
          // Verificar si el mensaje ya existe
          const exists = this.messages.some(m => m.id === messageId);
          if (!exists) {
            // Asegurarnos de que tiene un ID
            const newMessage = {
              ...message,
              id: messageId
            };
            
            this.messages.push(newMessage);
            console.log('Mensaje añadido al chat, total:', this.messages.length);
            this.$nextTick(() => this.scrollToBottom());
          } else {
            console.log('Mensaje duplicado, ignorando');
          }
        });
        
        // Escuchar desconexiones
        this.socket.on('disconnect', (reason) => {
          console.log('Socket desconectado:', reason);
        });
      } catch (error) {
        console.error('Error al configurar socket:', error);
      }
    },
    
    sendMessage() {
      const messageText = this.newMessage.trim();
      if (!messageText) return;
      
      if (!this.isAuthenticated) {
        console.error('No autenticado para enviar mensajes');
        return;
      }
      
      if (!this.socket) {
        console.error('Socket no disponible');
        this.connectSocket(); // Intentar reconectar
        return;
      }
      
      if (!this.socket.connected) {
        console.error('Socket no conectado, intentando reconectar');
        this.connectSocket();
        return;
      }
      
      try {
        const messageData = {
          senderId: this.userId,
          sender: this.userName,
          text: messageText,
          timestamp: new Date().toISOString()
        };
        
        console.log('Enviando mensaje:', messageData);
        
        // Enviar mensaje a través del socket
        this.socket.emit('sendMessage', messageData);
        
        // Limpiar campo de texto
        this.newMessage = '';
      } catch (error) {
        console.error('Error al enviar mensaje:', error);
      }
    },
    
    scrollToBottom() {
      const chatMessages = document.getElementById('chat-messages');
      if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }
    },
    
    toggleDarkMode() {
      this.darkMode = !this.darkMode;
      saveThemePreference(this.darkMode);
    },
    
    formatTime(timestamp) {
      if (!timestamp) return '';
      
      try {
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) {
          console.error('Timestamp inválido:', timestamp);
          return '';
        }
        
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        
        // Si el mensaje es de hoy, solo mostrar la hora
        const today = new Date();
        if (date.toDateString() === today.toDateString()) {
          return `${hours}:${minutes}`;
        }
        
        // Si el mensaje es de otro día, mostrar fecha y hora
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        return `${day}/${month} ${hours}:${minutes}`;
      } catch (error) {
        console.error('Error al formatear timestamp:', error);
        return '';
      }
    }
  }));
});