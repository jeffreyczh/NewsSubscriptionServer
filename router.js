/*
 * The module for grouping and distributing handlers
 */

 function route(handle, socket, db, userName, msgType, msgContent) {
	 if (typeof handle[msgType] === 'function') {
		 handle[msgType](socket, db, userName, msgContent);
	 } else {
		 console.log('No request handler found for the message type: ' + msgType);
	 }
 }

 exports.route = route;