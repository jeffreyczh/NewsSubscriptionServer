#NewsSubscriptionServer

A server to update RSS for the user

##Techniques Applied
Node.js, Mongodb

##Tags
node.js, mongodb, socket, RSS, server, <a href='#authentication'>authentication security</a>, net(nodejs module), crypto(nodejs module),  <a href='#push-notification--dynamic-interval-adjusting'>push notification</a>

##Very Brief Introduction
* The server is implemented with socket in <em>Node.js</em>
* It queries the database(<em>MongoDB</em>) running on another instance
* Log in authentication is provided
* Push notification can be enabled
* Interval for the server to check for updates can be auto-adjusted. You are encouraged to provide a more advanced algorithm to dynamically adjust the interval
* Some modules for testing are also available in the folder "testModule", which may be good as a reference for you to develop this server, as well as <a href='#how-to-implement-clients'>clients</a> related to this (The modules are implemented in node.js, though, but I think it could still be a hint for you to implement in another language/framework)
* Any questions/suggestions/modifications are welcome
* :) Thank you!

##Quick Navigation
<a href='#before-you-begin'>Before You Begin...</a> --- <a href='#authentication'>Authentication</a> --- <a href='#rss-update'>RSS Update</a> --- 
<a href='#push-notification--dynamic-interval-adjusting'>Push Notification & Dynamic Interval Adjusting</a> --- <a href='#how-to-implement-clients'>How to Implement Clients</a>

##More...
###Before You Begin...
<ul>
<li>You may need two instances, with one running the server, and another one running MongoDB</li>
<li>This project is tested on Amazon EC2 cloud platform</li>
<li>The project assumes that the database is organized as:
    <ul>
	<li>Name of the database: news</li>
	<li>Collections: 
		<ul>
			<li>users: authentication information of all users</li>
			<li>favs: favorite RSS list of all users</li>
			<li>userConfig: Configuration of an user</li>
		</ul>
	</li>
	<li>Fields in 'users': 
		<ul>
			<li>userName</li>
			<li>password(hashed)</li>
			<li>salt</li>
		</ul>
	<li>Fields in 'favs': 
		<ul>
			<li>userName</li>
			<li>url(the url of a RSS source)</li>
			<li>name(customized name for this RSS)</li>
			<li>lastModified(for the 'If-Modified-Since' header to use to check if there is update)</li>
			<li>md5(MD5 of the content for comparison, usually used when the 'If-Modified-Since' header is not available)</li>
			<li>lastChecked</li>
		</ul>
	</li>
	<li>Fields in 'userConfig':
		<ul>
			<li>userName</li>
			<li>push(boolean, indicate if the push notification has been turned on/off)</li>
		</ul>
	</li>
    </ul>
</li>
</ul>

###Authentication
<ul>
<li>The authentication is implemented with the 'crypto' module</li>
<li>Salt is used to hash the password.<br /> 
    So in the data base, user information is stored as: userName, password(hashed) and salt</li>
<li>When the client logs in, the server will generate a token and give this token for the client
    to encrypt the password.<br />The server will then decrypt it and hash the plain password with the salt
    and compare with the one in data base.</li>
<li>Techniques here: 
    <ul>
      <li>Password hashing: pbkdf2, with 1500 iterations and 128-bit salt. Hash length: 256 bits</li>
      <li>Password encryption: AES-256, with 128-bit strong randomKey(the token)</li>
    </ul>
</li>
</ul>

###RSS Update
<ul>
<li>The build-in node.js <b>http</b> module is applied to send GET request to the RSS source</li>
<li>Each request contains the header 'If-Modified-Since' for version comparison use</li>
<li>For those RSS source that does not support 'last-modified' header, its content will be hashed with MD5</li>
<li>Two external modules: <a href='https://github.com/JacksonTian/bufferhelper'>bufferhelper</a> 
and <a href='https://github.com/ashtuchkin/iconv-lite'>icon-lite</a> are used for character encodings conversion of the RSS content</li>
</ul>

###Push Notification & Dynamic interval adjusting
<ul>
<li>The server can check for updates periodically and push the update to client if the update is available</li>
<li>The period for the server to check updates is different for each RSS item. 
The period can be auto-adjusted based on how often the RSS is updated by the source</li>
<li>The current algorithm for dynamic interval adjusting is pretty simple. It is developed just based on my feelings:</li>
	<ul>
		<li>Compare the last-modifed time</li>
		<li>If it is modifed within 30 minutes, set the checking interval to 1 minute</li>
		<li>Set the interval to 5 mins for the modified interval 30 min ~ 1 h</li>
		<li>Then 15 mins for 1 ~ 6 h, 1 h for 6 ~ 24 h, 2 h for more than a day</li>
		<li>Check the <em>autoInterval.js</em> file for the code</li>
	</ul>
<li>You are encouraged to develop a more advaned algorithm to adjust the interval.</li>
</ul>

###How to Implement Clients
<ul>
	<li>Examples of client-side implementation are in '/testModule'</li>
	<li>Socket is used for connection</li>
	<li>Message is in the format of JSON strings. The JSON object contains two feilds: 
		<ul>
			<li>msgType: the type of the message. It must be one of the strings specified in the contant.js file</li>
			<li>content: the content of the message. Its type depends on what kind the request is. Please see below for detail</li>
		</ul>
	</li>
	<li><b>Login:</b>
		<ol>
			<li>After successfully connecting to the server, the client should be ready to accept the token from the server. The message from the server: <br/>
			msgType: constant.token<br/>
			content: the token string encoded in base64</li>
			<li>Encrypt the password input from the user with the given token. AES-256 should be used for the encryption. The encrypted password should be encoded in base64 as well.
			Then send the encrypted password to the server with: <br/>
			msgType: constant.login<br/>
			content: an object with two keys: <em>userName</em> and <em>password</em></li>
			<li>Accept the login result from the server: <br/>
			msgType: constant.login<br/>
			content: a boolean: <em>true</em> if succeed, <em>false</em> if fail</li>
		</ol>
	</li>
	<li><b>Ask for updates:</b>
		<ol>
			<li>The client can ask for the updates with the message in the format of:<br/>
			msgType: constant.update<br/>
			content (optional): an object with the key: <em>urls</em> with the corresponding value: <em>an array list</em> that has the urls of those RSS you need to have updates of. 
			If the array list is empty, the server will update all the RSS stored in the database</li>
			<li>Response: <br/>
			msgType: constant.update<br/>
			content: an object with the keys: <em>name</em> (the customized name given by the user for a RSS), 
			<em>url</em>, <em>content</em> (the updated content, will be empty if there is no update for this RSS item), <em>lastChecked</em> (the last-checked time stamp in GMT)</li>
		</ol>
	</li>
	<li><b>Modify the favourite list:</b>
		<ul>
			<li>Add, modify or remove one or multiple RSS to/from the database is allowed</li>
			<li>msgType: <em>constant.add</em> for adding new RSS to the list, 
				     <em>constant.modify</em> for modifying existing RSS in the list, and 
				     <em>constant.remove</em> for removing existing RSS from the list</li>
			<li>content: an <em>array list</em> of objects. The object could be formatted as:
				<ul>
					<li>For adding & modifying: with key <em>url</em> and <em>name</em></li>
					<li>For removing: with key <em>url</em></li>
				</ul>
			</li>
			<li>Response from the server will have the <em>msgType</em> the same to the requesting message type. The <em>content</em> is an object containing 1. <em>result</em>, a boolean indicating if the request is successfully proceeded, and 2. <em>errorMsg</em>, a string to show the error message if the <em>result</em> is fault. It is an empty string if the <em>result</em> is true.</li>
		</ul>
	</li>
	<li><b>Enable/Disable Push Notification:</b>
		<ul>
			<li>Client can turn on/off push notification</li>
			<li>msgType: <em>constant.push</em></li>
			<li>content: boolean, true or false to turn on/off</li>
		</ul>
	</li>
	<li><b>Logout:</b>
		<ul>
			<li>For now, just simply close the socket of the client to end the connection</li>
			<li>More features of logout handling might be added in the future</li>
		</ul>
	</li>

</ul>

