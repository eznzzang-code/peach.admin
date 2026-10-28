const https = require('https');
const querystring = require('querystring');

function testFindId(params, label) {
  const postData = querystring.stringify(params);
  const req = https.request({
    hostname: 'xn--jj0b479bhta.kr',
    port: 443,
    path: '/wkwhrma/login/findIdExcute.do',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'Accept': 'application/json, text/plain, */*; charset=UTF-8',
      'Content-Length': Buffer.byteLength(postData)
    },
    rejectUnauthorized: false
  }, (res) => {
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => {
      console.log(`[${label}] Status: ${res.statusCode}, Body: ${body}`);
    });
  });
  req.write(postData);
  req.end();
}

// 1. p_mobile=01074991011 & authNumber=1594
testFindId({ p_mobile: '01074991011', authNumber: '1594' }, '1. p_mobile without hyphen');

// 2. p_mobile=010-7499-1011 & authNumber=1594
testFindId({ p_mobile: '010-7499-1011', authNumber: '1594' }, '2. p_mobile with hyphen');

// 3. user_hp=01074991011 & user_name=테스트 & authNumber=1594
testFindId({ user_hp: '01074991011', user_name: '테스트', authNumber: '1594' }, '3. user_hp & user_name');

// 4. mobile=01074991011 & authNumber=1594
testFindId({ mobile: '01074991011', authNumber: '1594' }, '4. mobile & authNumber');

// 5. p_mobile=01074991011 & p_authNumber=1594
testFindId({ p_mobile: '01074991011', p_authNumber: '1594' }, '5. p_authNumber');
