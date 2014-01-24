NewsSubscriptionServer
======================

A server to update RSS for the user

<h2>Techniques Applied</h2>
Node.js, Mongodb

<h2>Tags</h2>
node.js, mongodb, socket, RSS, server, authentication security, net(nodejs module), crypto(nodejs module)

<h2>Very Brief Introduction</h2>
The server is implemented with socket in <em>Node.js</em>.<br />
It queries the database(<em>MongoDB</em>) running on another instance.<br />
Log in authentication is provided.<br />
Some modules for testing are also available in the folder "testModule", which may be good as a reference for you to develop this server, as well as clients related to this.<br />
Any questions/suggestions/modifications are welcome.<br />
:) (Is it possible to insert emoticons?)

<h2>More...</h2>
<h3>Authentication</h3>
<ul>
<li>The authentication is implemented with the 'crypto' module.</li>
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
