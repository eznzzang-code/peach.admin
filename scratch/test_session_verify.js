const https = require('https');
const querystring = require('querystring');

// 1단계: initAuthNumber 호출하고 JSESSIONID 쿠키 추출
const postData1 = querystring.stringify({
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
    'Content-Length': Buffer.byteLength(postData1)
  },
  rejectUnauthorized: false
}, (res1) => {
  let body1 = '';
  res1.on('data', d => body1 += d);
  res1.on('end', () => {
    console.log('initAuthNumber Response:', body1);
    const setCookie = res1.headers['set-cookie'];
    console.log('Set-Cookie:', setCookie);

    let jsessionId = '';
    if (setCookie) {
      const match = setCookie[0].match(/JSESSIONID=([^;]+)/);
      if (match) jsessionId = match[1];
    }
    console.log('Extracted JSESSIONID:', jsessionId);

    // 2단계 findIdExcute를 동일한 JSESSIONID 쿠키로 호출 테스트
    // (예: 5832 테스트)
    const postData2 = querystring.stringify({
      p_mobile: '01074991011',
      authNumber: '5832'
    });

    const req2 = https.request({
      hostname: 'xn--jj0b479bhta.kr',
      port: 443,
      path: '/wkwhrma/login/findIdExcute.do',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Accept': 'application/json, text/plain, */*; charset=UTF-8',
        'Cookie': `JSESSIONID=${jsessionId}`,
        'Content-Length': Buffer.byteLength(postData2)
      },
      rejectUnauthorized: false
    }, (res2) => {
      let body2 = '';
      res2.on('data', d => body2 += d);
      res2.on('end', () => {
        console.log('findIdExcute with Same Session Response:');
        console.log(body2);
      });
    });

    req2.write(postData2);
    req2.end();
  });
});

req1.write(postData1);
req1.end();
