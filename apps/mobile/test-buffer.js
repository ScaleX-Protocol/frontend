const { Buffer } = require('buffer');
const b = Buffer.from([1, 2, 3, 4]);
console.log(typeof b.readUIntLE);
