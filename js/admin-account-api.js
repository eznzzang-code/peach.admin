/* Server-backed AdminAccountApi connected to proc/account_proc.asp */
(function (g) {
  'use strict';
  const error = (message, code = 'INVALID') => Object.assign(new Error(message), { code });
  const digits = v => String(v || '').replace(/\D/g, '');
  const rules = {
    digits,
    validPhone: v => /^01[016789]\d{7,8}$/.test(digits(v)),
    validPassword: v => typeof v === 'string' && v.length >= 8 && v.length <= 20 && /[A-Za-z]/.test(v) && /\d/.test(v),
    validName: v => typeof v === 'string' && !!v.trim() && v.trim().length <= 40
  };

  async function callApi(action, params = {}) {
    const body = new URLSearchParams();
    body.append('action', action);
    Object.keys(params).forEach(k => {
      if (params[k] !== undefined && params[k] !== null) {
        body.append(k, String(params[k]));
      }
    });
    const res = await fetch('proc/account_proc.asp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body: body.toString()
    });
    const json = await res.json();
    if (!json || json.success !== true) {
      throw error((json && json.message) || '요청을 처리하지 못했습니다.', (json && json.code) || 'INVALID');
    }
    return json;
  }

  const api = {
    async getProfile() {
      const r = await callApi('get_profile');
      return { id: r.id, name: r.name, phone: r.phone || '' };
    },
    async updateProfile({ name }) {
      if (!rules.validName(name)) throw error('이름을 1~40자로 입력해 주세요.');
      const r = await callApi('update_profile', { name: name.trim() });
      return { id: r.id, name: r.name, phone: r.phone || '' };
    },
    async getInvitation() {
      const r = await callApi('get_invitation');
      return r.invitation || null;
    },
    async issueInvitation(expectedVersion) {
      const r = await callApi('issue_invitation', { expectedVersion: expectedVersion || '' });
      return r.invitation;
    },
    async verifyInvitation(code) {
      const r = await callApi('verify_invitation', { code: String(code || '').trim() });
      return { token: r.token, version: r.version };
    },
    async validateInvitation(grant) {
      await callApi('validate_invitation', { token: (grant && grant.token) || '' });
      return true;
    },
    async sendPhoneCode(phone) {
      const r = await callApi('send_phone_code', { phone: digits(phone) });
      return { challengeId: r.challengeId, expiresIn: r.expiresIn || 180, retryAfter: r.retryAfter || 60 };
    },
    async verifyPhoneCode({ phone, code, challengeId }) {
      const r = await callApi('verify_phone_code', { phone: digits(phone), code: String(code || '').trim(), challengeId: challengeId || '' });
      return { verified: r.verified === true, proof: r.proof, expiresIn: r.expiresIn || 300 };
    },
    async updatePhone({ phone, verificationProof }) {
      const r = await callApi('update_phone', { phone: digits(phone), verificationProof: verificationProof || '' });
      return { id: r.id, name: r.name, phone: r.phone || '' };
    },
    async changePassword({ currentPassword, newPassword }) {
      const r = await callApi('change_password', { currentPassword, newPassword });
      return { changed: r.changed === true };
    }
  };

  function phoneFlow(adapter, now = () => Date.now()) {
    let epoch = 0, sent = '', challenge = null, expires = 0, retry = 0, verified = '', proof = null, proofExpires = 0, pending = false, count = 0;
    function edit(phone) {
      if (digits(phone) !== sent) {
        epoch++; sent = ''; challenge = null; expires = 0; retry = 0; verified = ''; proof = null; proofExpires = 0; pending = false; count = 0;
      }
    }
    return {
      edit,
      async send(phone) {
        phone = digits(phone);
        if (!rules.validPhone(phone)) throw error('휴대폰 번호 형식을 확인해 주세요.');
        if (pending) throw error('요청을 처리 중입니다.');
        if (sent === phone && retry > now()) throw error('잠시 후 인증번호를 다시 발송해 주세요.');
        if (sent === phone && count >= 5) throw error('발송 횟수를 초과했습니다. 잠시 후 다시 시도해 주세요.');
        edit(phone);
        const ticket = ++epoch;
        pending = true; verified = ''; proof = null;
        try {
          const r = await adapter.sendPhoneCode(phone);
          if (ticket !== epoch) throw error('번호가 변경되었습니다. 다시 인증해 주세요.');
          if (!r?.challengeId) throw error('인증번호를 발송하지 못했습니다.');
          sent = phone;
          challenge = r.challengeId;
          expires = now() + Math.min(180, Math.max(1, Number(r.expiresIn) || 180)) * 1000;
          retry = now() + Math.max(1, Number(r.retryAfter) || 60) * 1000;
          count++;
          return { expiresIn: Math.ceil((expires - now()) / 1000) };
        } finally {
          if (ticket === epoch) pending = false;
        }
      },
      async verify(phone, code) {
        phone = digits(phone);
        if (pending) throw error('요청을 처리 중입니다.');
        if (phone !== sent || !challenge) throw error('새 번호로 인증번호를 먼저 발송해 주세요.');
        if (expires <= now()) throw error('인증번호 유효시간이 지났습니다. 다시 발송해 주세요.');
        if (!/^\d{4,6}$/.test(code)) throw error('인증번호 4자리를 입력해 주세요.');
        const ticket = epoch;
        pending = true;
        try {
          const r = await adapter.verifyPhoneCode({ phone, code, challengeId: challenge });
          if (ticket !== epoch) throw error('번호가 변경되었습니다. 다시 인증해 주세요.');
          if (r?.verified !== true || !r.proof) throw error('인증번호가 확인되지 않았습니다.');
          verified = phone;
          proof = r.proof;
          proofExpires = now() + Math.min(300, Math.max(1, Number(r.expiresIn) || 300)) * 1000;
          return true;
        } finally {
          if (ticket === epoch) pending = false;
        }
      },
      proof(phone) {
        if (verified !== digits(phone) || !proof || proofExpires <= now()) throw error('변경할 새 휴대폰 번호의 인증을 완료해 주세요.');
        return proof;
      },
      remaining() {
        return Math.max(0, Math.ceil((expires - now()) / 1000));
      }
    };
  }

  g.AdminAccountRules = { ...rules, phoneFlow };
  g.AdminAccountApi = g.AdminAccountApi || api;
})(window);

