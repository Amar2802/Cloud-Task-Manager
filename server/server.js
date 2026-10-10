require("dotenv").config();

const express = require("express");
const cors = require("cors");
const dns = require("node:dns");

dns.setServers(["8.8.8.8"]);

const mongoose = require("mongoose");
const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "CloudTask API is running",
    status: "healthy",
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "cloudtask-api",
    database:
      mongoose.connection.readyState === 1
        ? "connected"
        : "disconnected",
  });
});

app.use("/api/tasks", require("./routes/tasks"));

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing from the .env file");
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`CloudTask API running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Startup failed:", error.message);
    process.exit(1);
  }
}

startServer();
