const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const mongoose = require("mongoose");
const User = require("./models/User");
const Group = require("./models/Group");
const Message = require("./models/Message");
const bot = require("./bot/bot");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

require("dotenv").config();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true });

const globalGroup = "global";

io.on("connection", (socket) => {
  socket.on("register", async ({ username, password }) => {
    const userExists = await User.findOne({ username });
    if (userExists) return socket.emit("registerError", "Username taken.");
    const role = username === "owner" ? "owner" : "all";
    const newUser = new User({ username, password, role, verified: username === "owner" });
    await newUser.save();
    socket.emit("registered", { username });
  });

  socket.on("login", async ({ username, password }) => {
    const user = await User.findOne({ username, password });
    if (!user) return socket.emit("loginError", "Invalid credentials.");
    socket.username = username;
    socket.role = user.role;
    socket.join(globalGroup);
    socket.emit("joined", { username, role: user.role, verified: user.verified });
    io.to(globalGroup).emit("message", { from: "System", text: `${username} joined.` });
  });

  socket.on("chat", async (msg) => {
    if (!socket.username) return;
    const user = await User.findOne({ username: socket.username });
    if (!user || user.banned) return;
    const response = await bot(msg, socket.username, socket.role, io);
    if (response) io.to(globalGroup).emit("message", { from: "Bot", text: response });
    else io.to(globalGroup).emit("message", { from: socket.username, text: msg });
  });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));