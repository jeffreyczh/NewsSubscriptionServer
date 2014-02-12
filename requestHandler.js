/**
  * Handlers for the requests
  */

function updateNow(socket, userName, postData) {
	console.log('update now !!!');
}

function logout(socket) {
	socket.end();
}

exports.updateNow = updateNow;
exports.logout = logout;