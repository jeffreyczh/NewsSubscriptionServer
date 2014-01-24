/*
 * For testing password encryption and decryption
 * The algorithms applied are as same as the one in pwdHashing.js
 */

 var crypto = require("crypto");

crypto.randomBytes(128, function(e, randomKey) {
	if (e) throw e;
	/*var key = randomKey.toString('base64');
	console.log('Key:' + key);
	encryptPwd('testing1', key);*/
	var encryptedPwd = "+Ahzf941gDc3igFXE4sV/Q==";
	var key = "u+efPFrVTeYlo3mRQ3WyDVDQhO2QxxblBO3yID9leXJsDCl647LdNmD82cqJm/lgPIeCP/COZ4qBds7tEMwVRPGXqcujc5lLnq7ZQl5Hj6e+R8S9cJzKWBE3b094g7xKwtc236RuuuObpK9ckoREm7Yf+vXBrJvzJZBeN2TbTPM=";
	decryptPwd(encryptedPwd, key, function(pwd) {
		console.log('plain password:' + pwd);
	});
});




 function encryptPwd(password, key) {
	var cipher = crypto.createCipher("aes256", key);
	var encrypted = cipher.update(password, 'utf8', 'base64') + cipher.final('base64');
	console.log('Encryption finish!');
	console.log('Encrypted Password:' + encrypted);
}

/**
  * Decrypt the encrypted password using the previous generated key
  * [callback] takes the decrypted password as the only argument
  */
function decryptPwd(encryptedPwd, key, callback) {
	var decipher = crypto.createDecipher('aes256', key);
	var plainPwd = decipher.update(encryptedPwd, 'base64', 'utf8') + decipher.final('utf8');
	if (typeof(callback) === 'function') {
		callback(plainPwd);
	}
}

