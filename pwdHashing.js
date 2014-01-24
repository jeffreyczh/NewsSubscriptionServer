/*
 * This module provides functions related to secure the password.
 */
var crypto = require("crypto");
/**
  * Hash a password with the given salt
  * The derived key is encoded with 'base64'
  * [callback] takes the derived key as the only argument
  */
function hashPwd(password, salt, callback) {
	var iterations = 1500;
	var keylen = 256;
	crypto.pbkdf2(password, salt, iterations, keylen, function(err, derivedKey) {
		var key = derivedKey.toString('base64');
		if (typeof(callback) === 'function') {
			callback(key);
		}
	});
}

/**
  * Generate a salt and
  * use this salt to hash the given password
  * This function is usually used to generate the hash for
  * the data base to store
  * The fuction is just for adding new testing user
  * so the created hashed password will be export to a file called 'pwd'
  * Please check the file for the hased password
  */
function generateHashedPwd() {
	var password = 'testPwd1';
	crypto.randomBytes(128, function(e, randomKey) {
		var salt = randomKey.toString('base64');
		var iterations = 1500;
		var keylen = 256;
		hashPwd(password, salt, function(derivedKey) {
			var data = 'Key:' + derivedKey + '\r\n' + 'Salt:' + salt;
			require('fs').writeFileSync('pwd', data);
			console.log('Done! Please check the \'pwd\' file for the hash and salt.');
		});
	});
	console.log('You could force to quit if the \'Done\' message is shown...');
	setTimeout(function(){}, 5000);
}

// generateHashedPwd();

/**
  * Encrypt a password with the given key.
  * Clients should use the same algorithm so that 
  * the server can decrypt properly
  * Techniques applied: AES-256, with encoding: base64
  * and the key is 128-bit long, with encoding: base64
  * The key is provided by the server
  * NOTE: This function is just for reference while implementing clients
  *       It is never used in this server
  */
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


exports.hashPwd = hashPwd;
exports.decryptPwd = decryptPwd;