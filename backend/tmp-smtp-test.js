const http = require('http');
const registerBody = JSON.stringify({ name: 'MailWave User', email: 'msbala368@gmail.com', password: 'Sakthi@2005' });
const loginBody = JSON.stringify({ email: 'msbala368@gmail.com', password: 'Sakthi@2005' });

function request(path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'localhost',
      port: 5000,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        ...headers,
      },
    };
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

(async () => {
  try {
    const registerRes = await request('/api/auth/register', registerBody);
    console.log('REGISTER STATUS', registerRes.status);
    console.log(registerRes.body);
    const loginRes = await request('/api/auth/login', loginBody);
    console.log('LOGIN STATUS', loginRes.status);
    console.log(loginRes.body);
    const parsed = JSON.parse(loginRes.body || '{}');
    const token = parsed.token;
    if (!token) return console.error('No token returned');
    const smtpRes = await request('/api/emails/test-smtp', JSON.stringify({}), { Authorization: `Bearer ${token}` });
    console.log('SMTP STATUS', smtpRes.status);
    console.log(smtpRes.body);
  } catch (err) {
    console.error('ERROR', err.message);
  }
})();
