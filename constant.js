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
exports.logout = "_#LOGOUT#_";
