// To-Do :- Assignments Deadlines

//  track assignment deadlines.

const wa = require("@open-wa/wa-automate");
const { create, decryptMedia, ev } = wa;
const { default: PQueue } = require("p-queue");
const fs = require("fs");
const express = require("express");
const axios = require("axios");

const helpOnInPM = ["hello", "hi", "hii", "hey", "heyy", "#help", "#menu"];
const helpOnInGroup = ["#help", "#menu"];
const stoicapi = require("./stoicapi.json");

const helpText =
  process.env.HELP_TEXT ||
  `Commands:
#attendance : Tag everyone for Attendance Roll call  

#pending : displays all pending tasks with deadlines

#randomquote : generates random stoic quote

#spam: tag everyone in a message in a group (only works in a group)

#join https://chat.whatsapp.com/shdkashdh: joing a group with invite link

#leave: i hope you dont use this (only works in a group if sent by an admin)

#help:to display commands
#menu:to display commands

Add '#nospam' in group description to stop spam commands

Made with ❤️ By Udit Takkar (https://github.com/Udit-takkar)
`;

const leaveText = process.env.LEAVE_TEXT || "See You Again";

const server = express();
const PORT = 8000;
const queue = new PQueue({
  concurrency: 2,
  autoStart: false,
});
/**
 * WA Client
 * @type {null | import("@open-wa/wa-automate").Client}
 */
let cl = null;

/**
 * Process the message
 * @param {import("@open-wa/wa-automate").Message} message
 */
async function procMess(message) {
  console.log(message.author, message.content);
  if (message.type === "chat") {
    if (
      message.isGroupMsg &&
      helpOnInGroup.includes(message.body.toLowerCase())
    ) {
      await cl.sendText(message.chatId, helpText);
    } else if (
      !message.isGroupMsg &&
      helpOnInPM.includes(message.body.toLowerCase())
    ) {
      await cl.sendText(message.from, helpText);
    } else if (message.isGroupMsg && message.body.toLowerCase() === "#spam") {
      if (
        message.chat.groupMetadata.desc &&
        message.chat.groupMetadata.desc.includes("#nospam")
      ) {
        await cl.sendText(message.chatId, "Spam protected group");
      } else {
        const text = `hello ${message.chat.groupMetadata.participants.map(
          (participant) =>
            `\n🌚 @${
              typeof participant.id === "string"
                ? participant.id.split("@")[0]
                : participant.user
            }`
        )}`;
        await cl.sendTextWithMentions(message.chatId, text);
      }
    } else if (
      message.isGroupMsg &&
      message.body.toLowerCase() === "#attendance"
    ) {
      const text = `Attendance Alert${message.chat.groupMetadata.participants.map(
        (participant) =>
          `\n attendance @${
            typeof participant.id === "string"
              ? participant.id.split("@")[0]
              : participant.user
          }`
      )}`;
      await cl.sendTextWithMentions(message.chatId, text);
    } else if (message.body.startsWith("#randomquote")) {
      const quote = stoicapi[Math.floor(Math.random() * stoicapi.length)];
      const quoteMessage = `${quote.quote} \n \t\t\t-${quote.author}`;

      await cl.sendText(message.chatId, quoteMessage);
    } else if (message.body.toLowerCase() === "#pending") {
      axios
        .get("http://localhost:3000/task")
        .then((res) => {
          // console.log(res.data);

          const taskList = `Pending Tasks \n ${res.data.map(
            (task) => ` \n ${task.task}  ${task.deadline}`
          )}`;
          cl.sendText(message.chatId, taskList);
        })

        .catch((err) => {
          console.log(err);
        });
    } else if (message.body.startsWith("#add")) {
      const messageArray = message.body.split(" ");
      const task = messageArray[1];
      const [date, month] = [messageArray[2], messageArray[3]];
      axios
        .post("http://localhost:3000/task", {
          task: task,
          deadline: `${date}-${month}`,
        })
        .then((res) => console.log("success"))
        .catch(er);
    } else if (message.body.startsWith("#join https://chat.whatsapp.com/")) {
      //add quote here
      await cl.joinGroupViaLink(message.body);
      await cl.reply(message.chatId, "Joined group", message.id);
    } else if (message.body.toLowerCase() === "#nospam") {
      await cl.reply(
        message.chatId,
        "Add #nospam in group description",
        message.id
      );
    } else if (message.isGroupMsg && message.body.toLowerCase() === "#leave") {
      const user = message.chat.groupMetadata.participants.find(
        (pat) => pat.id === message.author
      );
      if (user && user.isAdmin) {
        await cl.sendText(message.chatId, leaveText);
        await cl.leaveGroup(message.chat.id);
      } else {
        await cl.reply(message.chatId, "You're not an admin!", message.id);
      }
    }
  }
}
/**
 * Add message to process queue
 */
const processMessage = (message) =>
  queue.add(async () => {
    try {
      await procMess(message);
    } catch (e) {
      console.log(e);
    }
  });

/**
 * Initialize client
 * @param {import("@open-wa/wa-automate").Client} client
 */
async function start(client) {
  cl = client;
  queue.start();
  // const unreadMessages = await client.getAllNewMessages();
  // unreadMessages.forEach(processMessage);
  // client.onMessage(processMessage);
  client.onAnyMessage((message) => processMessage(message));
}

ev.on("qr.**", async (qrcode) => {
  const imageBuffer = Buffer.from(
    qrcode.replace("data:image/png;base64,", ""),
    "base64"
  );
  fs.writeFileSync("./public/qr_code.png", imageBuffer);
});

create({
  qrTimeout: 0,
  cacheEnabled: false,
}).then((client) => start(client));

server.use(express.static("public"));
server.listen(PORT, () =>
  console.log(`> Listining on http://localhost:${PORT}`)
);

process.on("exit", () => {
  if (fs.existsSync("./session.data.json")) {
    fs.unlinkSync("./session.data.json");
  }
});
