/*
 * The module for constant setting
 */

/* 
 * Message type
 * Agreements between the server and the client
 * Put these agreements in front of every requests for the server to route
 */
exports.token = "_#TOKEN#_"; // ask for token for the client to encrypt the password before every login
exports.login = "_#LOGIN#_";
exports.update = "_#UPDATE#_"; // update the specified RSS immediately
exports.add = "_#ADD#_"; // add a RSS
exports.modify = "_#MODIFY#_"; // modify an existing RSS
exports.remove = "_#REMOVE#_"; // remove an RSS