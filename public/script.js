const ws = new WebSocket(`ws://${window.location.host}`);
const nameInput = document.getElementById("name");
const colorInput = document.getElementById("color");
const joinBtn = document.getElementById("join");
const input = document.getElementById("input");
const sendBtn = document.getElementById("send");
const messagesDiv = document.getElementById("messages");
const usersDiv = document.getElementById("users");

let username = null;
let targetUser = null;

joinBtn.onclick = () => {
  const name = nameInput.value.trim();
  if (!name) return alert("Введите имя!");
  username = name;
  ws.send(JSON.stringify({ type: "intro", name, color: colorInput.value }));

  nameInput.disabled = true;
  colorInput.disabled = true;
  joinBtn.disabled = true;
  input.disabled = false;
  sendBtn.disabled = false;
  input.focus();
};

sendBtn.onclick = sendMessage;
input.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

function sendMessage() {
  const text = input.value.trim();
  if (!text) return;
  const msg = { type: "message", text };
  if (targetUser) msg.to = targetUser;
  ws.send(JSON.stringify(msg));
  input.value = "";
}

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === "system") addMessage(data.text, "gray");
  if (data.type === "message") addMessage(`${data.name}: ${data.text}`, data.color);
  if (data.type === "private") addMessage(`(ЛС) ${data.from}: ${data.text}`, data.color);
  if (data.type === "users") updateUsers(data.list);
};

function addMessage(text, color = "black") {
  const div = document.createElement("div");
  div.textContent = text;
  div.style.color = color;
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function updateUsers(list) {
  usersDiv.innerHTML = "<b>Участники:</b><br>";
  list.forEach((name) => {
    const div = document.createElement("div");
    div.textContent = name;
    if (name === username) div.style.fontWeight = "bold";
    div.onclick = () => {
      if (targetUser === name) {
        targetUser = null;
        addMessage(`Вы больше не пишете лично ${name}`, "gray");
      } else if (name !== username) {
        targetUser = name;
        addMessage(`Теперь вы пишете лично ${name}`, "gray");
      }
    };
    usersDiv.appendChild(div);
  });
}
