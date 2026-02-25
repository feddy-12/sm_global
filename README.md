
# GE-Express | Sistema de Gestión de Paquetería

Este sistema ha sido diseñado para optimizar la logística de paquetería en Guinea Ecuatorial, proporcionando una interfaz moderna, robusta y escalable.

## 🚀 Arquitectura del Sistema
El sistema sigue un patrón **MVC (Modelo-Vista-Controlador)** desacoplado:
- **Frontend**: Desarrollado en React 18+ con TypeScript y Tailwind CSS para una experiencia de usuario rápida y fluida (SPA).
- **Backend (Referencia)**: Preparado para una API REST en PHP (Vanilla o Laravel) conectada a MySQL.
- **Inteligencia**: Integración con Google Gemini AI para sugerencias de precios y reportes estratégicos.

## 📦 Características Principales
- **Autenticación Dual**: Control de acceso para Administradores y Operadores.
- **Gestión 360°**: CRUD completo de clientes y paquetes con historial de trazabilidad.
- **Seguimiento Público**: Los clientes pueden consultar su paquete mediante código sin necesidad de login.
- **Optimización Local**: Pre-configurado con provincias de Guinea Ecuatorial y moneda FCFA.

## 🛠 Instalación (Backend PHP/MySQL)
1. Importar el archivo `database.sql` en su servidor MySQL (phpMyAdmin o CLI).
2. Configurar la conexión en su archivo `config.php` o `.env`.
3. Desplegar los archivos en el servidor Apache/Nginx.

## 🛡 Seguridad y Escalabilidad
- **Prevención SQLi**: Uso obligatorio de Sentencias Preparadas (PDO en PHP).
- **Escalabilidad**: Estructura de base de datos preparada para el módulo de sucursales e integración con APIs de pago móvil (Muni/Getesa Money).
- **Diseño Responsive**: Totalmente funcional en tablets y móviles para personal de almacén.

---
*Desarrollado como una solución profesional lista para el mercado de logística en África Central.*
