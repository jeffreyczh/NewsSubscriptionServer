NewsSubscriptionServer
======================

A server to update RSS for the user

<h2>Techniques Applied</h2>
Node.js, Mongodb

<h2>Tags</h2>
node.js, mongodb, socket, RSS, server, <a href='#authentication'>authentication security</a>, net(nodejs module), crypto(nodejs module)

<h2>Very Brief Introduction</h2>
<ul>
<li>The server is implemented with socket in <em>Node.js</em></li>
<li>It queries the database(<em>MongoDB</em>) running on another instance</li>
<li>Log in authentication is provided</li>
<li>Some modules for testing are also available in the folder "testModule", which may be good as a reference for you to develop this server, as well as clients related to this (The modules are implemented in node.js, though, but I think it could still be a hint for you to implement in another language/framework)</li>
<li>Any questions/suggestions/modifications are welcome</li>
<li>:) Thank you!</li>
</ul>

<h2>Quick Navigation</h2>
<a href='#before-you-begin'>Before You Begin...</a> --- <a href='#authentication'>Authentication</a> --- <a href='#rss-update'>RSS Update</a> --- 
<a href='#how-to-implement-clients'>How to Implement Clients</a>

<h2>More...</h2>
<h3>Before You Begin...</h3>
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
    </ul>
</li>
</ul>

<h3>Authentication</h3>
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

<h3>RSS Update</h3>
<ul>
<li>The build-in node.js <b>http</b> module is applied to send GET request to the RSS source</li>
<li>Each request contains the header 'If-Modified-Since' for version comparison use</li>
<li>For those RSS source that does not support 'last-modified' header, its content will be hashed with MD5</li>
<li>Two external modules: <a href='https://github.com/JacksonTian/bufferhelper'>bufferhelper</a> 
and <a href='https://github.com/ashtuchkin/iconv-lite'>icon-lite</a> are used for character encodings conversion of the RSS content</li>
</ul>

<h3>How to Implement Clients</h3>
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
			content (optional): an object with the key: <em>urls</em> and the corresponding value: <em>an array list</em> that has the urls of those RSS you need to have updates of. 
			If the content is not specified, the server will update all the RSS stored in the database</li>
			<li>Response (It won't be a response if a RSS has no update): <br/>
			msgType: constant.update<br/>
			content: an object with the keys: <em>name</em> (the customized name given by the user for a RSS), 
			<em>url</em>, <em>content</em> (the updated content), <em>lastChecked</em> (the last-checked time stamp in GMT)</li>
		</ol>
	</li>

</ul>

