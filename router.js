/*
 * The module for grouping and distributing handlers
 */

 function route(handle, msgType, socket, userName, postData) {
	 if (typeof handle[msgType] === 'function') {
		 handle[msgType](socket, userName, postData);
	 } else {
		 console.log('No request handler found for the message type: ' + msgType);
	 }
 }

 exports.route = route;