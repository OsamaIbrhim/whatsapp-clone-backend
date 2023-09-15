// importing
import express from "express";
import mongoose from "mongoose";
import Messages from "./dbMessages.js";
import Pusher from "pusher";
import cors from "cors";

// app config
const app = express();
const port = process.env.PORT || 9000;
const pusher = new Pusher({
  appId: "1670818",
  key: "8bfddba49d8fafb404d5",
  secret: "843b44b9046e33a385dc",
  cluster: "eu",
  useTLS: true,
});

// middleware
app.use(express.json());
app.use(cors());

// DB config
const connictionURL =
  "mongodb+srv://osamaibrahim:lS2mIFxDA1QShnYZ@cluster0.1jg6gwe.mongodb.net/whatsappdb?retryWrites=true&w=majority";
mongoose.connect(connictionURL, {});
const db = mongoose.connection;
db.once("open", () => {
  console.log("db connected");

  const msgCollection = db.collection("messagecontents");

  const changeStream = msgCollection.watch();
  changeStream.on("change", (change) => {
    console.log(change);

    if (change.operationType == "insert") {
      const messageDetails = change.fullDocument;

      pusher.trigger("message", "inserted", {
        name: messageDetails.name,
        message: messageDetails.message,
        timestamp: messageDetails.timestamp,
        received: messageDetails.received,
      });
    } else {
      console.log("Error triggering Pusher");
    }
  });
});

// ???

// api routes
app.get("/messages/viwe", async (req, res) => {
  const messages = await Messages.find();
  try {
    res.status(200).send(messages);
  } catch (e) {
    res.status(500).send(e);
  }
});

app.post("/messages/new", async (req, res) => {
  const message = new Messages({
    ...req.body,
  });

  try {
    await message.save();
    res.status(201).send(message);
  } catch (e) {
    res.status(500).send(e);
  }
});

// listen
app.listen(port, () => console.log(`Listening on localhost:${port}`));
