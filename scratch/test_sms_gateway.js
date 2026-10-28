const https = require('https');
const querystring = require('querystring');

// 1. initAuthNumber.do 호출하여 encryptedText, iv 획득
const postData = querystring.stringify({
  user_name: '테스트',
  user_hp: '01074991011',
  ref: 'findid'
});

const req1 = https.request({
  hostname: 'xn--jj0b479bhta.kr',
  port: 443,
  path: '/wkwhrma/api/initAuthNumber.do',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'Accept': 'application/json, text/plain, */*; charset=UTF-8',
    'Content-Length': Buffer.byteLength(postData)
  },
  rejectUnauthorized: false
}, (res1) => {
  let body1 = '';
  res1.on('data', d => body1 += d);
  res1.on('end', () => {
    console.log('Step 1 initAuthNumber:', body1);
    const json1 = JSON.parse(body1);
    if (json1.resultcode === 200 && json1.encryptedText && json1.iv) {
      // 2. send_sms.asp 호출
      const smsPath = `/selfhelpAPI/send_sms.asp?encryptedText=${encodeURIComponent(json1.encryptedText)}&iv=${encodeURIComponent(json1.iv)}`;
      console.log('Step 2 calling SMS gateway:', smsPath);

      https.get({
        hostname: 'selfhelp.edu-ok.co.kr',
        port: 443,
        path: smsPath,
        rejectUnauthorized: false
      }, (res2) => {
        let body2 = '';
        res2.on('data', d => body2 += d);
        res2.on('end', () => {
          console.log('Step 2 SMS Gateway Response:');
          console.log(body2);
        });
      });
    }
  });
});

req1.write(postData);
req1.end();
