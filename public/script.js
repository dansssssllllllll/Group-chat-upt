const socket = io();
function register() {
  socket.emit("register", {
    username: document.getElementById("user").value,
    password: document.getElementById("pass").value
  });
}
function login() {
  socket.emit("login", {
    username: document.getElementById("user").value,
    password: document.getElementById("pass").value
  });
}
function send() {
  socket.emit("chat", document.getElementById("msg").value);
}
socket.on("message", (data) => {
  const box = document.getElementById("chatbox");
  if (box) {
    const div = document.createElement("div");
    div.textContent = `${data.from}: ${data.text}`;
    box.appendChild(div);
  }
});