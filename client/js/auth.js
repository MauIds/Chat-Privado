// URL base de la API - Configuración dinámica
const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5000'  // URL para desarrollo local
  : 'https://chat-privado-m71c.onrender.com';  // URL para producción en Render

// Función para realizar login
async function login(password) {
  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ password })
    });

    const data = await response.json();
    
    if (response.ok) {
      return {
        success: true,
        data
      };
    } else {
      return {
        success: false,
        message: data.msg || 'Error de autenticación'
      };
    }
  } catch (error) {
    console.error('Error en login:', error);
    return {
      success: false,
      message: 'Error de conexión al servidor'
    };
  }
}

// Función para obtener información del otro usuario
async function getPartnerInfo(userId, token) {
  try {
    const response = await fetch(`${API_URL}/api/auth/partner/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      return {
        success: true,
        data
      };
    } else {
      return {
        success: false,
        message: data.msg || 'Error al obtener información'
      };
    }
  } catch (error) {
    console.error('Error al obtener partner:', error);
    return {
      success: false,
      message: 'Error de conexión al servidor'
    };
  }
}

// Guardar la sesión en localStorage
function saveSession(userData) {
  localStorage.setItem('chatSession', JSON.stringify({
    token: userData.token,
    userId: userData.userId,
    userName: userData.userName,
    isAuthenticated: true,
    timestamp: new Date().getTime()
  }));
}

// Cargar la sesión desde localStorage
function loadSession() {
  const sessionData = localStorage.getItem('chatSession');
  if (sessionData) {
    const session = JSON.parse(sessionData);
    
    // Verificar si la sesión ha expirado (24 horas)
    const now = new Date().getTime();
    const sessionTime = session.timestamp || 0;
    const sessionAge = now - sessionTime;
    const sessionLimit = 24 * 60 * 60 * 1000; // 24 horas
    
    if (sessionAge < sessionLimit) {
      return session;
    } else {
      // Borrar sesión expirada
      localStorage.removeItem('chatSession');
    }
  }
  return null;
}

// Borrar la sesión al cerrar sesión
function clearSession() {
  localStorage.removeItem('chatSession');
}

// Cargar/guardar preferencia de tema
function loadThemePreference() {
  return localStorage.getItem('darkMode') === 'true';
}

function saveThemePreference(isDark) {
  localStorage.setItem('darkMode', isDark);
}