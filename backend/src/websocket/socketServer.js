const { Server } = require('socket.io');

class SocketServer {
   initialize(httpServer) {
      this.io = new Server(httpServer, {
         cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:3000',
            methods: ['GET', 'POST']
         }
      });

      this.io.on('connection', (socket) => {
         console.log(`🔌 Cliente conectado: ${socket.id}`);

         socket.on('disconnect', () => {
            console.log(`❌ Cliente desconectado: ${socket.id}`);
         });
      });

      console.log("✅ WebSocket Server inicializado");
   }

   emitDeviceUpdated(device) {
      if (!this.io) return;

      console.log(`📡 WS → device:updated | ${device.device_id}`);
      this.io.emit("device:updated", device);
   }
}

module.exports = new SocketServer();
