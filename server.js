// server.js
const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(path.join(__dirname, "public")));

let users = new Map(); // ws -> { name, color }

function broadcast(message, excludeWs = null) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client !== excludeWs) {
      client.send(JSON.stringify(message));
    }
  });
}

function sendToUser(targetName, message) {
  for (let [ws, user] of users.entries()) {
    if (user.name === targetName && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
      return true;
    }
  }
  return false;
}

wss.on("connection", (ws) => {
  ws.on("message", (msg) => {
    const data = JSON.parse(msg);

    // Представление пользователя
    if (data.type === "intro") {
      users.set(ws, { name: data.name, color: data.color });
      const names = [...users.values()].map((u) => u.name);

      if (names.length === 1) {
        ws.send(JSON.stringify({ type: "system", text: "Добро пожаловать. Вы первый в чате." }));
      } else {
        ws.send(JSON.stringify({ type: "system", text: `Добро пожаловать. В чате уже: ${names.join(", ")}` }));
        broadcast({ type: "system", text: `К нам присоединился ${data.name}` }, ws);
      }

      broadcast({ type: "users", list: names });
    }

    // Сообщения
    if (data.type === "message") {
      const user = users.get(ws);
      if (!user) return;

      // Личное сообщение (если указан получатель)
      if (data.to) {
        const sent = sendToUser(data.to, {
          type: "private",
          from: user.name,
          color: user.color,
          text: data.text,
        });

        // Отправителю — подтверждение личного сообщения
        if (sent) {
          ws.send(JSON.stringify({
            type: "private",
            from: `Вы → ${data.to}`,
            color: user.color,
            text: data.text,
          }));
        } else {
          ws.send(JSON.stringify({ type: "system", text: `Пользователь ${data.to} не найден.` }));
        }
      } else {
        // Обычное сообщение для всех
        broadcast({
          type: "message",
          name: user.name,
          color: user.color,
          text: data.text,
        });
      }
    }
  });

  ws.on("close", () => {
    const user = users.get(ws);
    if (user) {
      users.delete(ws);
      broadcast({ type: "system", text: `${user.name} нас покинул.` });
      broadcast({ type: "users", list: [...users.values()].map((u) => u.name) });
    }
  });
});

const PORT = 3000;
server.listen(PORT, () => console.log(`✅ Сервер запущен: http://localhost:${PORT}`));
