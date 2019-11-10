var WebSocketServer = require('ws').Server;
var http = require('http');
var express = require('express');
var serveIndex = require('serve-index')

var app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.text({ type: "*/*" }))

var robotData = {};
robotData.counter = 0;
robotData.timestamp = Date.now();
robotData.phoneSensors = {};
var networkInterfaces = require('os').networkInterfaces();
robotData.address = networkInterfaces.wlan0[0].address;
robotData.port = robotData.address.split('.')[3] + '001';
robotData.mac = networkInterfaces.wlan0[0].mac;
robotData.odometer = 0;
phoneSensors = {};

//----------- Helpful Functions -----------

function signedInt16(num) {
    let high = Math.abs(num) >> 8 & 127,
        low = num & 255;
    if (num < 0) {
        high = 255 - high;
        if (!low) {
            high++;
            if (high > 255) high = 128;
        }
    }
    return [high, low];
}

function signedInt8(num) {
    let byte = Math.abs(num) & 127;
    if (num < 0) byte = 256 - byte;
    return (byte > 255) ? 128 : byte;
}


const SerialPort = require('serialport')
options = { baudRate: 115200, dataBits: 8, parity: 'none', stopBits: 1, flowControl: 0 };

const port = new SerialPort('/dev/ttyUSB0', options)
//console.log(port)
port.on('error', function(err) {
    console.error('Error: ', err.message)
})

port.once('open', () => {
    console.log('open')
    port.on('data', function(data) {
        //console.log('Data:', data)
        console.log(data.toString('ascii'))
    })
});

function start() {
    console.log('start')
    port.write(Buffer.from([128]));
}

function safe() {
    console.log('safe')
    port.write(Buffer.from([132]));
}

function full() {
    console.log('safe')
    port.write(Buffer.from([133]));
}

function stop() {
    console.log('stop')
    port.write(Buffer.from([173]));
}

function reset() {
    console.log('reset')
    port.write(Buffer.from([7]));
}

function clean() {
    console.log('clean')
    port.write(Buffer.from([135]));
}

function halt() {
    console.log('halt', signedInt16(-100))

    port.write(Buffer.from([146, 0, 0, 0, 0]));
}

function drive(left, right) {
    console.log('drive', left, right);
    //console.log(signedInt16(-100))
    buff = []
    buff = buff.concat([145], signedInt16(left), signedInt16(right))
    console.log(buff);
    port.write(Buffer.from(buff));
}

setTimeout(start, 500);
setTimeout(safe, 1000);

app.all('/drive', function(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    //if (robotData.mode == "passive") robot.safeMode();
    console.log(req.body);
    let v = req.query || JSON.parse(req.body)
    drive(v.left, v.right);
    res.send(sensors);
    // console.log(JSON.stringify(sensors, null, 4));

});
app.all('/phone', function(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    phoneSensors = req.query || JSON.parse(req.body);
    //console.log(phoneSensors);
    for (key in phoneSensors) {
        sensors[key] = phoneSensors[key]; // copies each property to the objCopy object
    }
    res.send(JSON.stringify(sensors));
});

app.all('/sensors', function(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.send(sensors);
});
var sensors = {};
counter = 0;
//app.use(express.static(__dirname + '/public'));
app.use('', express.static('public', { 'index': false }), serveIndex('public', { 'icons': false }))
app.use('/bot3', express.static('public', { 'index': false }), serveIndex('public', { 'icons': false }))

var server = http.createServer(app);
const serverPort = 3001;
server.listen(serverPort);
console.log('listening on port', serverPort)

app.all('/all', function(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.send(JSON.stringify(sensors));
});

var wss = new WebSocketServer({ server: server });
wss.on('connection', function(ws) {
    var id = setInterval(function() {
        ws.send(JSON.stringify(sensors), function() { /* ignore errors */ });
    }, 1000);
    console.log('connection to client');
    ws.on('close', function() {
        console.log('closing client');
        clearInterval(id);
    });
});