exports.serial = { baudRate: 115200, dataBits: 8, parity: 'none', stopBits: 1, flowControl: 0 };
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

function fromSignedInt16(high, low) {
    let num = ((high & 127) << 8) + (low & 255);
    return (high & 128) ? num - 32768 : num;
}

function fromUnsignedInt16(high, low) {
    return ((high & 255) << 8) + (low & 255);
}

function fromSignedInt8(byte) {
    let num = byte & 127;
    return (byte & 128) ? num - 128 : num;
}
const SerialPort = require('serialport')
// SerialPort.list().then(
//   ports => ports.forEach(console.log),
//   err => console.error(err)
// )
const port = new SerialPort('/dev/ttyUSB0',exports.serial)
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
console.log('hi2346789')

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
    console.log('halt',signedInt16(-100))

    port.write(Buffer.from([146,0,0,0,0]));
}

function forward() {
    console.log('forward')
    port.write(Buffer.from([146,0,100,0,100]));
}

function backward() {
    console.log('backward')
    //console.log(signedInt16(-100))
    buff = []
    buff = buff.concat([146],signedInt16(-100),signedInt16(100))
    console.log(buff);
    port.write(Buffer.from(buff));
}

function drive(left,right){
	console.log('drive',left,right);
    //console.log(signedInt16(-100))
    buff = []
    buff = buff.concat([145],signedInt16(left),signedInt16(right))
    console.log(buff);
    port.write(Buffer.from(buff));
}

//setTimeout(reset,1000)
setTimeout(start, 500);
setTimeout(safe, 1000);
setTimeout(drive, 2000,100,-100);
setTimeout(drive, 3000,-100,100);
setTimeout(halt, 4000);
setTimeout(stop, 5000);
//setTimeout(clean, 12000);

process.stdin.resume();//so the program will not close instantly

function exitHandler(options, exitCode) {
    if (options.cleanup) console.log('clean');
    if (exitCode || exitCode === 0) console.log(exitCode);
    if (options.exit) process.exit();
}

//do something when app is closing
process.on('exit', exitHandler.bind(null,{cleanup:true}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, {exit:true}));
process.on('SIGUSR2', exitHandler.bind(null, {exit:true}));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));