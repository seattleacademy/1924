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
var sensors = {};
var counter = 0;

const SerialPort = require('serialport')
options = { baudRate: 115200, dataBits: 8, parity: 'none', stopBits: 1, flowControl: 0 };

const port = new SerialPort('/dev/ttyUSB0', options)
const ByteLength = require('@serialport/parser-byte-length')

//console.log(port)
port.on('error', function(err) {
    console.error('Error: ', err.message)
})
var counter = 0;
port.once('open', () => {
    console.log('open')
    const parser = port.pipe(new ByteLength({ length: 80 }))
    parser.on('data', (data) => {
        let buffer = new Uint8Array(data).buffer;
        let dataView = new DataView(buffer);
        console.log(dataView.getUint16(17))
        readAgain = setTimeout(() => port.write(Buffer.from([142, 100])), 1000);

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
function dock() {
    console.log('dock')
    port.write(Buffer.from([143]));
}
function halt() {
    console.log('halt')
    port.write(Buffer.from([146, 0, 0, 0, 0]));
}

function getSensors() {
    console.log('getSensors')
    port.write(Buffer.from([142, 100]));

}

function drive(left, right) {
    const buffer = new ArrayBuffer(5);
    const view = new DataView(buffer);
    view.setInt8(0, 145) // drive command
    view.setInt16(1, left); // 2s complement for left wheel
    view.setInt16(3, right); // 2s complement for right wheel
    port.write(Buffer.from(buffer));
}

function shutdown() {
    start(); //put in passive mode
    setTimeout(stop,250); //put in off mode
    //Assuming that close flushes, check this assumption
    setTimeout(()=>{port.close(() => { process.exit(0) })},1000)
    //port.close(() => { process.exit(0) });
}

setTimeout(start, 0);
setTimeout(getSensors, 100);
setTimeout(safe, 300);
setTimeout(drive, 500, 100, -100);
setTimeout(drive, 1500, -100, 100);
//setTimeout(dock, 2500);

setTimeout(shutdown, 5000);

// setTimeout(start, 2500);
// setTimeout(stop, 3000);
//setTimeout(sensors, 2500);

app.all('/drive', function(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    //if (robotData.mode == "passive") robot.safeMode();
    //console.log(req.body);


    console.log(req.query, JSON.parse(req.body))
    let v = req.query;
    if (Object.keys(v).length == 0) v = JSON.parse(req.body);
    console.log(v);
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

app.use('', express.static('public', { 'index': false }), serveIndex('public', { 'icons': false }))

var server = http.createServer(app);
const serverPort = 3001;
server.listen(serverPort);
console.log('listening on port', serverPort)

app.all('/all', function(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.send(JSON.stringify(sensors));
});