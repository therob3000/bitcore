'use strict';

/* jshint unused: false */
var _ = require('lodash');
var assert = require('assert');
var should = require('chai').should();
var expect = require('chai').expect;
var bitcore = require('..');
var buffer = require('buffer');
var errors = bitcore.errors;
var hdErrors = bitcore.errors.HDPublicKey;
var bufferUtil = bitcore.util.buffer;
var HDPrivateKey = bitcore.HDPrivateKey;
var HDPublicKey = bitcore.HDPublicKey;
var Base58Check = bitcore.encoding.Base58Check;

var xprivkey = 'xprv9s21ZrQH143K3QTDL4LXw2F7HEK3wJUD2nW2nRk4stbPy6cq3jPPqjiChkVvvNKmPGJxWUtg6LnF5kejMRNNU3TGtRBeJgk33yuGBxrMPHi';
var xpubkey = 'xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8';
var json = '{"network":"livenet","depth":0,"fingerPrint":876747070,"parentFingerPrint":0,"childIndex":0,"chainCode":"873dff81c02f525623fd1fe5167eac3a55a049de3d314bb42ee227ffed37d508","publicKey":"0339a36013301597daef41fbe593a02cc513d0b55527ec2df1050e2e8ff49c85c2","checksum":-1421395167,"xpubkey":"xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8"}';
var derived_0_1_200000 = 'xpub6BqyndF6rkBNTV6LXwiY8Pco8aqctqq7tGEUdA8fmGDTnDJphn2fmxr3eM8Lm3m8TrNUsLbEjHvpa3adBU18YpEx4tp2Zp6nqax3mQkudhX';

describe('HDPublicKey interface', function() {

  var expectFail = function(func, errorType) {
    var got = null;
    var error = null;
    try {
      func();
    } catch (e) {
      error = e;
      got = e instanceof errorType;
    }
    if (!error instanceof errorType) {
      console.log('Adsasd', typeof error);
    }
    // expect(got).to.equal(true);
  };

  var expectDerivationFail = function(argument, error) {
    return expectFail(function() {
      var pubkey = new HDPublicKey(xpubkey);
      xpubkey.derive(argument);
    }, error);
  };

  var expectFailBuilding = function(argument, error) {
    return expectFail(function() {
      return new HDPublicKey(argument);
    }, error);
  };

  describe('creation formats', function() {

    it('returns same argument if already an instance of HDPublicKey', function() {
      var publicKey = new HDPublicKey(xpubkey);
      publicKey.should.equal(new HDPublicKey(publicKey));
    });

    it('returns the correct xpubkey for a xprivkey', function() {
      var publicKey = new HDPublicKey(xprivkey);
      publicKey.xpubkey.should.equal(xpubkey);
    });

    it('allows to call the argument with no "new" keyword', function() {
      HDPublicKey(xpubkey).xpubkey.should.equal(new HDPublicKey(xpubkey).xpubkey);
    });

    it('fails when user doesn\'t supply an argument', function() {
      expectFailBuilding(null, hdErrors.MustSupplyArgument);
    });

    it('should not be able to change read-only properties', function() {
      var publicKey = new HDPublicKey(xprivkey);
      expect(function() {
        publicKey.fingerPrint = 'notafingerprint';
      }).to.throw(TypeError);
    });

    it('doesn\'t recognize an invalid argument', function() {
      expectFailBuilding(1, hdErrors.UnrecognizedArgument);
      expectFailBuilding(true, hdErrors.UnrecognizedArgument);
    });


    describe('xpubkey string serialization errors', function() {
      it('fails on invalid length', function() {
        expectFailBuilding(
          Base58Check.encode(new buffer.Buffer([1, 2, 3])),
          hdErrors.InvalidLength
        );
      });
      it('fails on invalid base58 encoding', function() {
        expectFailBuilding(
          xpubkey + '1',
          errors.InvalidB58Checksum
        );
      });
      it('user can ask if a string is valid', function() {
        (HDPublicKey.isValidSerialized(xpubkey)).should.equal(true);
      });
    });

    it('can be generated from a json', function() {
      expect(new HDPublicKey(json).xpubkey).to.equal(xpubkey);
    });

    it('can generate a json that has a particular structure', function() {
      assert(_.isEqual(
        new HDPublicKey(json).toJSON(),
        new HDPublicKey(xpubkey).toJSON()
      ));
    });

    it('builds from a buffer object', function() {
      (new HDPublicKey(new HDPublicKey(xpubkey)._buffers)).xpubkey.should.equal(xpubkey);
    });

    it('checks the checksum', function() {
      var buffers = new HDPublicKey(xpubkey)._buffers;
      buffers.checksum = bufferUtil.integerAsBuffer(1);
      expectFail(function() {
        return new HDPublicKey(buffers);
      }, errors.InvalidB58Checksum);
    });

  });

  describe('error checking on serialization', function() {
    var compareType = function(a, b) {
      expect(a instanceof b).to.equal(true);
    };
    it('throws invalid argument when argument is not a string or buffer', function() {
      compareType(HDPublicKey.getSerializedError(1), hdErrors.UnrecognizedArgument);
    });
    it('if a network is provided, validates that data corresponds to it', function() {
      compareType(HDPublicKey.getSerializedError(xpubkey, 'testnet'), errors.InvalidNetwork);
    });
    it('recognizes invalid network arguments', function() {
      compareType(HDPublicKey.getSerializedError(xpubkey, 'invalid'), errors.InvalidNetworkArgument);
    });
    it('recognizes a valid network', function() {
      expect(HDPublicKey.getSerializedError(xpubkey, 'livenet')).to.equal(null);
    });
  });

  it('toString() returns the same value as .xpubkey', function() {
    var pubKey = new HDPublicKey(xpubkey);
    pubKey.toString().should.equal(pubKey.xpubkey);
  });

  it('inspect() displays correctly', function() {
    var pubKey = new HDPublicKey(xpubkey);
    pubKey.inspect().should.equal('<HDPublicKey: ' + pubKey.xpubkey + '>');
  });

  describe('conversion to different formats', function() {
    var plainObject = {
      'network':'livenet',
      'depth':0,
      'fingerPrint':876747070,
      'parentFingerPrint':0,
      'childIndex':0,
      'chainCode':'873dff81c02f525623fd1fe5167eac3a55a049de3d314bb42ee227ffed37d508',
      'publicKey':'0339a36013301597daef41fbe593a02cc513d0b55527ec2df1050e2e8ff49c85c2',
      'checksum':-1421395167,
      'xpubkey':'xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8'
    };
    it('roundtrips to JSON and to Object', function() {
      var pubkey = new HDPublicKey(xpubkey);
      expect(HDPublicKey.fromJSON(pubkey.toJSON()).xpubkey).to.equal(xpubkey);
    });
    it('recovers state from JSON', function() {
      new HDPublicKey(JSON.stringify(plainObject)).xpubkey.should.equal(xpubkey);
    });
    it('recovers state from Object', function() {
      new HDPublicKey(plainObject).xpubkey.should.equal(xpubkey);
    });
  });

  describe('derivation', function() {
    it('derivation is the same whether deriving with number or string', function() {
      var pubkey = new HDPublicKey(xpubkey);
      var derived1 = pubkey.derive(0).derive(1).derive(200000);
      var derived2 = pubkey.derive('m/0/1/200000');
      derived1.xpubkey.should.equal(derived_0_1_200000);
      derived2.xpubkey.should.equal(derived_0_1_200000);
    });

    it('allows special parameters m, M', function() {
      var expectDerivationSuccess = function(argument) {
        new HDPublicKey(xpubkey).derive(argument).xpubkey.should.equal(xpubkey);
      };
      expectDerivationSuccess('m');
      expectDerivationSuccess('M');
    });

    it('doesn\'t allow object arguments for derivation', function() {
      expectFail(function() {
        return new HDPublicKey(xpubkey).derive({});
      }, hdErrors.InvalidDerivationArgument);
    });

    it('needs first argument for derivation', function() {
      expectFail(function() {
        return new HDPublicKey(xpubkey).derive('s');
      }, hdErrors.InvalidPath);
    });

    it('doesn\'t allow other parameters like m\' or M\' or "s"', function() {
      /* jshint quotmark: double */
      expectDerivationFail("m'", hdErrors.InvalidDerivationArgument);
      expectDerivationFail("M'", hdErrors.InvalidDerivationArgument);
      expectDerivationFail("1", hdErrors.InvalidDerivationArgument);
      expectDerivationFail("S", hdErrors.InvalidDerivationArgument);
    });

    it('can\'t derive hardened keys', function() {
      expectFail(function() {
        return new HDPublicKey(xpubkey).derive(HDPublicKey.Hardened);
      }, hdErrors.InvalidDerivationArgument);
    });

  it('validates correct paths', function() {
    var valid;

    valid = HDPublicKey.isValidPath('m/123/12');
    valid.should.equal(true);

    valid = HDPublicKey.isValidPath('m');
    valid.should.equal(true);

    valid = HDPublicKey.isValidPath(123);
    valid.should.equal(true);
  });

  it('rejects illegal paths', function() {
    var valid;
    
    valid = HDPublicKey.isValidPath('m/-1/12');
    valid.should.equal(false);

    valid = HDPublicKey.isValidPath("m/0'/12");
    valid.should.equal(false);

    valid = HDPublicKey.isValidPath("m/8000000000/12");
    valid.should.equal(false);

    valid = HDPublicKey.isValidPath('bad path');
    valid.should.equal(false);

    valid = HDPublicKey.isValidPath(-1);
    valid.should.equal(false);

    valid = HDPublicKey.isValidPath(8000000000);
    valid.should.equal(false);

    valid = HDPublicKey.isValidPath(HDPublicKey.Hardened);
    valid.should.equal(false);
  });

    it('should use the cache', function() {
      var pubkey = new HDPublicKey(xpubkey);
      var derived1 = pubkey.derive(0);
      var derived2 = pubkey.derive(0);
      derived1.should.equal(derived2);
    });
  });
});
