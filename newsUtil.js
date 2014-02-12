/*
 * Some helper functions here
 */
var constant = require('./constant');

 /**
   * Generate a JSON string for communication
   * Returns the JSON string
   * msgType: the type of the message, see constant.js for the values
   * content: the message content that will be wrapped. It could be a string or object
   */
 function generateMsg(msgType, content) {
	var msgObj = {
		msgType: msgType,
		content: content
	};
	return JSON.stringify(msgObj);
 }


 exports.generateMsg = generateMsg;