/**
 * Manejador de señalización WebRTC y Chat Clínico en Tiempo Real (Tarea 8.1.2)
 * Permite que Médico y Paciente se conecten en la misma sala virtual (/sala/:id),
 * intercambien ofertas/respuestas SDP, candidatos ICE, estado de cámara/micrófono y mensajes de chat.
 */

const salasActivas = new Map(); // roomId -> Map(socketId -> datosUsuario)

const configurarVideollamadaSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`[Socket] Cliente conectado: ${socket.id}`);

    socket.on('unirse-sala', ({ roomId, usuario }) => {
      if (!roomId) return;
      const salaId = String(roomId).trim();
      socket.join(salaId);
      socket.data.roomId = salaId;
      socket.data.usuario = usuario || { nombre: 'Participante', rol: 'USUARIO' };

      if (!salasActivas.has(salaId)) {
        salasActivas.set(salaId, new Map());
      }
      const participantesSala = salasActivas.get(salaId);

      // Obtener lista de participantes que ya estaban en la sala antes de este socket
      const otrosParticipantes = [];
      for (const [idExistente, info] of participantesSala.entries()) {
        if (idExistente !== socket.id) {
          otrosParticipantes.push({ socketId: idExistente, usuario: info });
        }
      }

      participantesSala.set(socket.id, socket.data.usuario);

      console.log(
        `[Socket] Usuario (${socket.data.usuario.rol || 'USUARIO'}: ${socket.data.usuario.nombre || socket.id}) conectado a la sala ${salaId} (Total en sala: ${participantesSala.size})`
      );

      // Enviar al recién llegado quiénes están ya en la sala
      socket.emit('usuarios-en-sala', { participantes: otrosParticipantes });

      // Avisar a los demás en la sala que entró un nuevo participante
      socket.to(salaId).emit('usuario-conectado', {
        socketId: socket.id,
        usuario: socket.data.usuario
      });
    });

    // Señalización WebRTC: Oferta SDP
    socket.on('webrtc-offer', ({ roomId, offer, to }) => {
      if (to) {
        io.to(to).emit('webrtc-offer', {
          from: socket.id,
          offer,
          usuario: socket.data.usuario
        });
      } else if (roomId) {
        socket.to(String(roomId)).emit('webrtc-offer', {
          from: socket.id,
          offer,
          usuario: socket.data.usuario
        });
      }
    });

    // Señalización WebRTC: Respuesta SDP
    socket.on('webrtc-answer', ({ roomId, answer, to }) => {
      if (to) {
        io.to(to).emit('webrtc-answer', {
          from: socket.id,
          answer,
          usuario: socket.data.usuario
        });
      } else if (roomId) {
        socket.to(String(roomId)).emit('webrtc-answer', {
          from: socket.id,
          answer,
          usuario: socket.data.usuario
        });
      }
    });

    // Señalización WebRTC: Candidatos de red ICE
    socket.on('webrtc-ice-candidate', ({ roomId, candidate, to }) => {
      if (!candidate) return;
      if (to) {
        io.to(to).emit('webrtc-ice-candidate', {
          from: socket.id,
          candidate
        });
      } else if (roomId) {
        socket.to(String(roomId)).emit('webrtc-ice-candidate', {
          from: socket.id,
          candidate
        });
      }
    });

    // Sincronización de estado de micrófono, cámara y pantalla compartida
    socket.on('estado-medios', ({ roomId, camaraActiva, micActivo, compartiendoPantalla }) => {
      const salaId = String(roomId || socket.data.roomId || '');
      if (!salaId) return;
      socket.to(salaId).emit('estado-medios-remoto', {
        from: socket.id,
        camaraActiva,
        micActivo,
        compartiendoPantalla
      });
    });

    // Chat clínico en tiempo real dentro de la sala
    socket.on('mensaje-chat', ({ roomId, texto, autor, rol, hora }) => {
      const salaId = String(roomId || socket.data.roomId || '');
      const mensajeLimpio = String(texto || '').trim();
      if (!salaId || !mensajeLimpio) return;

      const payload = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        senderSocketId: socket.id,
        texto: mensajeLimpio.slice(0, 500),
        autor: String(autor || socket.data.usuario?.nombre || 'Participante').slice(0, 100),
        rol: String(rol || socket.data.usuario?.rol || 'USUARIO'),
        hora: hora || new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
      };

      io.to(salaId).emit('nuevo-mensaje-chat', payload);
    });

    const limpiarSalidaDeSala = () => {
      const salaId = socket.data.roomId;
      if (salaId && salasActivas.has(salaId)) {
        const participantesSala = salasActivas.get(salaId);
        participantesSala.delete(socket.id);
        if (participantesSala.size === 0) {
          salasActivas.delete(salaId);
        }
        socket.to(salaId).emit('usuario-desconectado', {
          socketId: socket.id,
          usuario: socket.data.usuario
        });
      }
    };

    socket.on('salir-sala', () => {
      limpiarSalidaDeSala();
      if (socket.data.roomId) {
        socket.leave(socket.data.roomId);
        socket.data.roomId = null;
      }
    });

    socket.on('disconnect', () => {
      limpiarSalidaDeSala();
      console.log(`[Socket] Cliente desconectado: ${socket.id}`);
    });
  });
};

module.exports = configurarVideollamadaSocket;
