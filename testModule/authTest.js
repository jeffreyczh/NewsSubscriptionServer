/*
 * Test the authentication
 * This can also be used for your reference to implement the client
 */

var net = require('net');
var crypto = require("crypto");
var constant = require('../constant');
var newsUtil = require('../newsUtil');
var pwdHashing = require('../pwdHashing');
/* Host and port of the server */
var HOST = '54.236.248.91';
var PORT = 1215;

var client = new net.Socket();

client.setEncoding('utf8');

client.connect(PORT, HOST, function() {
    console.log('CONNECTED TO: ' + HOST + ':' + PORT);
});

// Add a 'data' event handler for the client socket
// data is what the server sent to this socket
client.on('data', function(chunk) {
	var token = newsUtil.getContent(chunk, constant.token);
	console.log('Token received:' + token);
	var en_pwd = encryptPwd('testPwd1', token);
	var userObj = {
		userName: 'testUser1',
		password: en_pwd
	};
	var json_str = JSON.stringify(userObj);
	console.log('Auth informatin I am going to provide:' + json_str);
	client.write(constant.token + json_str + constant.endOfData);
    client.destroy();  
});

// Add a 'close' event handler for the client socket
client.on('close', function() {
    console.log('Connection closed');
});

/**
  * The function to encrypt the password with the given token
  * The algorithm is the same as the one in pwdHashing.js
  */
function encryptPwd(password, key) {
	var cipher = crypto.createCipher("aes256", key);
	var encrypted = cipher.update(password, 'utf8', 'base64') + cipher.final('base64');
	return encrypted;
}
