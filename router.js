/*
 * The module for grouping and distributing handlers
 */
 var constant = require('./constant');

 function route(handle, socket, db, userName, pushConfigObj, msgType, msgContent) {
	 if (typeof handle[msgType] === 'function') {
		 if (msgType === constant.update || msgType === constant.modify) {
			 handle[msgType](socket, db, userName, msgContent);
		 }
		 handle[msgType](socket, db, userName, pushConfigObj, msgContent);
	 } else {
		 console.log('No request handler found for the message type: ' + msgType);
	 }
 }

 exports.route = route;