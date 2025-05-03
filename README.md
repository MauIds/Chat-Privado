# 🚀 Chat-App Kubernetes

## 📝 Descripción
¡Bienvenido a Chat-App! Una aplicación de chat en tiempo real que permite la comunicación entre dos usuarios desarrollada con JavaScript, HTML y CSS con una base de datos MongoDB Atlas.


## ✨ Características
- 💬 Chat en tiempo real entre usuarios
- 🔒 Mensajes almacenados en MongoDB Atlas
- 📱 Diseño responsivo para todos los dispositivos
- 🌐 Despliegue en Kubernetes
- 📊 Monitoreo integrado con Render

## 🛠️ Tecnologías
- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express
- **Base de datos**: MongoDB Atlas
- **Despliegue**: Kubernetes (AWS EKS/Azure AKS/Google GKE/RedHat)
- **CI/CD**: GitHub Actions
- **Empaquetado**: Helm Charts
- **Plataforma de despliegue y monitoreo**: Render

## 🚀 Despliegue
Esta aplicación está desplegada utilizando Kubernetes para automatizar la implementación y administración de contenedores. Usamos Helm Charts para definir e instalar la aplicación.


## 🔄 CI/CD Pipeline
Este proyecto implementa un pipeline DevOps completo:

1. **Desarrollo**: Cambios en el código
2. **Control de versiones**: GitHub
3. **CI/CD**: GitHub Actions para pruebas y build automático
4. **Despliegue**: Helm en Kubernetes
5. **Monitoreo**: Prometheus y Grafana

## 📊 Monitoreo
Utilizamos la plataforma Render para el despliegue y monitoreo de nuestra aplicación:

- **Logs en tiempo real**: Visualización de logs de construcción y actividad de usuarios
- **Métricas integradas**: Monitoreo de uso de CPU, memoria y rendimiento
- **Panel de control**: Interfaz sencilla para supervisar el estado de la aplicación

### ¿Por qué Render en lugar de Prometheus y Grafana?

Como equipo pequeño con recursos limitados, optamos por Render porque:
- 🆓 Permite despliegue gratuito para proyectos pequeños
- 🔄 Ofrece integración automática de logs y métricas sin configuración adicional
- 📚 Tiene una curva de aprendizaje menor comparado con Prometheus/Grafana
- ⏱️ Nos permite enfocarnos en el desarrollo en lugar de configurar infraestructura compleja


