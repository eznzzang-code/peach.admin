/* Browser-only publishing demo. No app database, delivery system or live API is changed. */
window.ResourceStore = (function () {
  'use strict';
  var database;
  function open() {
    if (database) return database;
    database = new Promise(function (resolve, reject) {
      if (!window.indexedDB) return reject(new Error('이 브라우저에서는 시연 저장소를 사용할 수 없습니다.'));
      var req = indexedDB.open('peach-admin-resource-demo-v1', 1);
      req.onupgradeneeded = function () { req.result.createObjectStore('resources', {keyPath: 'key'}); };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
      req.onblocked = function () { reject(new Error('다른 관리자 탭을 닫은 후 다시 시도해 주세요.')); };
    });
    return database;
  }
  async function transaction(mode, run) {
    var db = await open();
    return new Promise(function (resolve, reject) {
      var tx = db.transaction('resources', mode), result;
      var req = run(tx.objectStore('resources'));
      req.onsuccess = function () { result = req.result; };
      tx.oncomplete = function () { resolve(result); };
      tx.onerror = function () { reject(tx.error || new Error('저장하지 못했습니다.')); };
      tx.onabort = function () { reject(tx.error || new Error('저장이 취소되었습니다.')); };
    });
  }
  return {
    putMany: function (records) { return open().then(function(db){return new Promise(function(resolve,reject){var tx=db.transaction('resources','readwrite');records.forEach(function(record){tx.objectStore('resources').put(record);});tx.oncomplete=function(){resolve();};tx.onerror=function(){reject(tx.error);};tx.onabort=function(){reject(tx.error||new Error('저장 취소'));};});}); },
    get: function (key) { return transaction('readonly', function (store) { return store.get(key); }); },
    all: function () { return transaction('readonly', function (store) { return store.getAll(); }); },
    put: function (record) { return transaction('readwrite', function (store) { return store.put(record); }); }
  };
})();
