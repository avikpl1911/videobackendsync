import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // Replace with your frontend origin
    methods: ["GET", "POST"], // Allowed methods
  },
});
const aroom = {};

app.use(cors({ origin: "*" }));
io.on("connection", (socket) => {
  console.log("a user connected", socket.id);
  var roomid = 0;
  socket.on("createroom", async ({ userid, foundName, src, time,isplaying }) => {
    roomid = Date.now();
    aroom[`${roomid}`] = {
      ownerid: userid,
      src: src,
      time: time,
      isplaying: isplaying
    };
    socket.data.username = foundName;
    socket.join(`${roomid}`);
    const users = await io.in(`${roomid}`).fetchSockets();
    var usrgetarr = [];
    users.forEach((usr) => {
      usrgetarr.push({
        userid: usr.id,
        username: usr.data.username,
      });
    });
    io.in(`${roomid}`).emit("userupdate", {
      roomid: `${roomid}`,
      roomdata: aroom[`${roomid}`],
      userarr: usrgetarr,
    });
  });

  socket.on("changesource",(src)=>{
    aroom[`${roomid}`].time = 0
    io.in(`${roomid}`).emit("recievetime", 0);
    aroom[`${roomid}`].src = src
    io.in(`${roomid}`).emit("recievesource",src)

  })



  socket.on("joinroom", async ({rid, name}) => {
    
    if (aroom[`${rid}`]) {
        console.log("hello")
      socket.join(`${rid}`);
      roomid = `${rid}`;
      socket.data.username = name;
      console.log("hello")
      const users = await io.in(`${rid}`).fetchSockets();
      var usrgetarr = [];
      users.forEach((usr) => {
        usrgetarr.push({
          userid: usr.id,
          username: usr.data.username,
        });
      });
      io.in(`${rid}`).emit("userupdate", {
        roomid: `${rid}`,
        roomdata: aroom[`${rid}`],
        userarr: usrgetarr,
      });
    } else {
      socket.disconnect();
    }
  });

  socket.on("sendtime", (time) => {
    if (socket.id == aroom[`${roomid}`].ownerid) {
      console.log(time, socket.id);
      aroom[`${roomid}`].time = time;
      io.in(`${roomid}`).emit("recievetime", time);
      console.log(aroom[`${roomid}`]);
    }
  });

  socket.on("isplaying",(isplaying)=>{
       aroom[`${roomid}`].isplaying = isplaying
       io.in(`${roomid}`).emit(`getplaying`,isplaying)
  })

  socket.on("disconnect", async () => {
    if (aroom[`${roomid}`] && aroom[`${roomid}`].ownerid == socket.id) {
        io.in(`${roomid}`).emit("disconnectclientml","hello");
      delete aroom[`${roomid}`];
      io.in(`${roomid}`).emit("disconnectclientml","hello");
      const users = await io.in(`${roomid}`).fetchSockets();
      users.forEach((s) => {
        s.leave(`${roomid}`);
        s.disconnect()
      });
    } else {
      if (roomid !== 0) {
        socket.leave(`${roomid}`);
        const users = await io.in(`${roomid}`).fetchSockets();
        var usrgetarr = [];
        users.forEach((usr) => {
          usrgetarr.push({
            userid: usr.id,
            username: usr.data.username,
          });
        });
        io.in(`${roomid}`).emit("userupdate", {
          roomid: `${roomid}`,
          roomdata: aroom[`${roomid}`],
          userarr: usrgetarr,
        });
      }
    }
    console.log(aroom , "why");
  });
});
// app.get("/socket.io/", (req, res) => {
//   res.send("hle");
// });

server.listen(9000);
