// Inicialización de la aplicación con Alpine.js
document.addEventListener('alpine:init', () => {
    Alpine.data('app', () => ({
      isAuthenticated: false,
      userId: null,
      userName: null,
      partnerName: null,
      password: '',
      authError: null,
      messages: [],
      newMessage: '',
      darkMode: false,
      socket: null,
      token: null,
      
      init() {
        // Intentar cargar la sesión
        const session = loadSession();
        if (session && session.isAuthenticated) {
          this.isAuthenticated = true;
          this.userId = session.userId;
          this.userName = session.userName;
          this.token = session.token;
          
          // Cargar datos y conectar socket
          this.initializeChat();
        }
        
        // Cargar preferencia de tema
        this.darkMode = loadThemePreference();
      },
      
      async initializeChat() {
        try {
          // Obtener información del otro usuario
          const partnerResponse = await getPartnerInfo(this.userId, this.token);
          if (partnerResponse.success) {
            this.partnerName = partnerResponse.data.partnerName;
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
        
        const response = await login(this.password);
        
        if (response.success) {
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
          this.authError = response.message;
        }
      },
      
      logout() {
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
          const response = await fetch(`${API_URL}/api/messages`, {
            headers: {
              'Authorization': `Bearer ${this.token}`
            }
          });
          
          if (response.ok) {
            this.messages = await response.json();
          }
        } catch (error) {
          console.error('Error al cargar mensajes:', error);
        }
      },
      
      connectSocket() {
        // Conectar al servidor de socket
        this.socket = io(API_URL);
        
        // Unirse a la sala
        this.socket.emit('join', { userId: this.userId });
        
        // Escuchar nuevos mensajes
        this.socket.on('message', (message) => {
          const exists = this.messages.some(m => m.id === message.id);
          if (!exists) {
            this.messages.push(message);
            this.$nextTick(() => this.scrollToBottom());
          }
        });
      },
      
      sendMessage() {
        const messageText = this.newMessage.trim();
        if (messageText && this.isAuthenticated && this.socket) {
          // Enviar mensaje a través del socket
          this.socket.emit('sendMessage', {
            senderId: this.userId,
            sender: this.userName,
            text: messageText
          });
          
          // Limpiar campo de texto
          this.newMessage = '';
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
        const date = new Date(timestamp);
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
      }
    }));
  });