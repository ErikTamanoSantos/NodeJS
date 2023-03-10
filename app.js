const express = require('express')
const fs = require('fs/promises')
const url = require('url')
const post = require('./post.js')
const { v4: uuidv4 } = require('uuid')
const mysql = require("mysql2")

// Wait 'ms' milliseconds
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Start HTTP server
const app = express()

// Set port number
const port = process.env.PORT || 3000

// Publish static files from 'public' folder
app.use(express.static('public'))

// Activate HTTP server
const httpServer = app.listen(port, appListen)
function appListen() {
  console.log(`Listening for HTTP queries on: http://localhost:${port}`)
}

// Set URL rout for POST queries
app.post('/dades', getDades)
async function getDades(req, res) {
  let receivedPOST = await post.getPostObject(req)
  let result = { status: "KO", result: "Unkown type" }

  var textFile = await fs.readFile("./public/consoles/consoles-list.json", { encoding: 'utf8' })
  var objConsolesList = JSON.parse(textFile)

  if (receivedPOST) {
    if (receivedPOST.type == "testConnection") {
      await wait(1000);
      result = { status: "OK"}
    }
    if (receivedPOST.type == "getListData") {
      await wait(1000);
      let listData = await queryDatabase(`SELECT id, name FROM users`)
      result = { status: "OK", result: listData }
    }
    if (receivedPOST.type == "getFormData") {
      await wait(1000);
      let data = await queryDatabase(`SELECT * FROM users WHERE id='${receivedPOST.id}'`)
      result = { status: "OK", result: data[0] }
    }
    if (receivedPOST.type == "addUser") {
      await wait(1000);
      if (/[0-9]/.test(receivedPOST.name)) {
        result = { status: "KO", result: "Nom no vàlid" }
      } else if (/[0-9]/.test(receivedPOST.lastName)) {
        result = { status: "KO", result: "Cognom no vàlid" }
      } else if (!receivedPOST.email.match(/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)) {
        result = { status: "KO", result: "Email no vàlid" }
      } else if (!/[0-9]/.test(receivedPOST.phone)) {
        result = { status: "KO", result: "Telèfon no vàlid" }
      } else if (/[0-9]/.test(receivedPOST.city)) {
        result = { status: "KO", result: "Ciutat no vàlida" }
      } else {
        let email = await queryDatabase(`SELECT COUNT(*) as counter FROM users WHERE email = "${receivedPOST.email}"`)
        if (email[0].counter != 0) {
          result = { status: "KO", result: "Email no disponible" }
        } else {
          let phone = await queryDatabase(`SELECT COUNT(*) as counter FROM users WHERE phoneNum = "${receivedPOST.phone}"`)
          if (phone[0].counter != 0) {
            result = { status: "KO", result: "Telèfon no disponible" }
          } else {
            await queryDatabase(`INSERT INTO users (name, lastName, email, phoneNum, address, city) VALUES ('${receivedPOST.name}', '${receivedPOST.lastName}', '${receivedPOST.email}', '${receivedPOST.phone}', '${receivedPOST.address}', '${receivedPOST.city}')`)
            result = { status: "OK", result: "Insert complete" }
          }
        }
      }
    }
    if (receivedPOST.type == "UpdateUser") {
      await wait(100);
      if (/[0-9]/.test(receivedPOST.name)) {
        result = { status: "KO", result: "Nom no vàlid" }
      } else if (/[0-9]/.test(receivedPOST.lastName)) {
        result = { status: "KO", result: "Cognom no vàlid" }
      } else if (!receivedPOST.email.match(/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)) {
        result = { status: "KO", result: "Email no vàlid" }
      } else if (!/[0-9]/.test(receivedPOST.phone)) {
        result = { status: "KO", result: "Telèfon no vàlid" }
      } else if (/[0-9]/.test(receivedPOST.city)) {
        result = { status: "KO", result: "Ciutat no vàlida" }
      } else {
        let email = await queryDatabase(`SELECT COUNT(*) as counter FROM users WHERE email = "${receivedPOST.email}" AND id != '${receivedPOST.id}'`)
        if (email[0].counter != 0) {
          result = { status: "KO", result: "Email no disponible" }
        } else {
          let phone = await queryDatabase(`SELECT COUNT(*) as counter FROM users WHERE phoneNum = "${receivedPOST.phone}" AND id != '${receivedPOST.id}'`)
          if (phone[0].counter != 0) {
            result = { status: "KO", result: "Telèfon no disponible" }
          } else {
            await queryDatabase(`UPDATE users SET name = '${receivedPOST.name}', lastName = '${receivedPOST.lastName}', email = '${receivedPOST.email}', phoneNum = '${receivedPOST.phone}', address = '${receivedPOST.address}', city = '${receivedPOST.city}' WHERE id = '${receivedPOST.id}'`)
            result = { status: "OK", result: "Update complete" }
          }
        }
      }
    }
    /*
    if (receivedPOST.type == "consola") {
      var objFilteredList = objConsolesList.filter((obj) => { return obj.name == receivedPOST.name })
      await wait(1500)
      if (objFilteredList.length > 0) {
        result = { status: "OK", result: objFilteredList[0] }
      }
    }
    if (receivedPOST.type == "marques") {
      var objBrandsList = objConsolesList.map((obj) => { return obj.brand })
      await wait(1500)
      let senseDuplicats = [...new Set(objBrandsList)]
      result = { status: "OK", result: senseDuplicats.sort() } 
    }
    if (receivedPOST.type == "marca") {
      var objBrandConsolesList = objConsolesList.filter ((obj) => { return obj.brand == receivedPOST.name })
      await wait(1500)
      // Ordena les consoles per nom de model
      objBrandConsolesList.sort((a,b) => { 
          var textA = a.name.toUpperCase();
          var textB = b.name.toUpperCase();
          return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
      })
      result = { status: "OK", result: objBrandConsolesList } 
    }
    */
  }

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(result))
}

// Run WebSocket server
const WebSocket = require('ws')
const wss = new WebSocket.Server({ server: httpServer })
const socketsClients = new Map()
console.log(`Listening for WebSocket queries on ${port}`)

// What to do when a websocket client connects
wss.on('connection', (ws) => {

  console.log("Client connected")

  // Add client to the clients list
  const id = uuidv4()
  const color = Math.floor(Math.random() * 360)
  const metadata = { id, color }
  socketsClients.set(ws, metadata)

  // Send clients list to everyone
  sendClients()

  // What to do when a client is disconnected
  ws.on("close", () => {
    socketsClients.delete(ws)
  })

  // What to do when a client message is received
  ws.on('message', (bufferedMessage) => {
    var messageAsString = bufferedMessage.toString()
    var messageAsObject = {}

    try { messageAsObject = JSON.parse(messageAsString) }
    catch (e) { console.log("Could not parse bufferedMessage from WS message") }

    if (messageAsObject.type == "bounce") {
      var rst = { type: "bounce", message: messageAsObject.message }
      ws.send(JSON.stringify(rst))
    } else if (messageAsObject.type == "broadcast") {
      var rst = { type: "broadcast", origin: id, message: messageAsObject.message }
      broadcast(rst)
    } else if (messageAsObject.type == "private") {
      var rst = { type: "private", origin: id, destination: messageAsObject.destination, message: messageAsObject.message }
      private(rst)
    }
  })
})

// Send clientsIds to everyone
function sendClients() {
  var clients = []
  socketsClients.forEach((value, key) => {
    clients.push(value.id)
  })
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      var id = socketsClients.get(client).id
      var messageAsString = JSON.stringify({ type: "clients", id: id, list: clients })
      client.send(messageAsString)
    }
  })
}

// Send a message to all websocket clients
async function broadcast(obj) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      var messageAsString = JSON.stringify(obj)
      client.send(messageAsString)
    }
  })
}

// Send a private message to a specific client
async function private(obj) {
  wss.clients.forEach((client) => {
    if (socketsClients.get(client).id == obj.destination && client.readyState === WebSocket.OPEN) {
      var messageAsString = JSON.stringify(obj)
      client.send(messageAsString)
      return
    }
  })
}

// Perform a query to the database
function queryDatabase(query) {

  return new Promise((resolve, reject) => {
    var connection = mysql.createConnection({
      host: process.env.MYSQLHOST || "localhost",
      port: process.env.MYSQLPORT || 3306,
      user: process.env.MYSQLUSER || "root",
      password: process.env.MYSQLPASSWORD || "",
      database: process.env.MYSQLDATABASE || "test"
    });

    connection.query(query, (error, results) => {
      if (error) reject(error);
      resolve(results)
    });

    connection.end();
  })
}