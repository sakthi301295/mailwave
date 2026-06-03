const bcrypt = require('bcryptjs');
const hash = '$2a$12$CuyJvMohm7IwukgpxtMRcuGMDPz.15MxidACkWgM1u/ekC299v6DC';
const candidates = ['Test1234!','Sakthi@2005','sakthi2005','msbala368@gmail.com','password','12345678','MailWave123','Sakthi2005'];
for (const pwd of candidates) {
  console.log(pwd, bcrypt.compareSync(pwd, hash));
}
