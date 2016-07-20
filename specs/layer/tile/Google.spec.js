describe('L.Google', function () {
  it('exists', function () {
    L.Google.should.be.ok;
  });

  describe('statics', function () {

    describe('isGoogleMapsReady', function () {

      beforeEach(function () {
        delete window.google
      });

      it('exists', function () {
        window.google = {}
        L.Google.isGoogleMapsReady.should.be.ok;
      });

      it('just google', function () {
        window.google = {}
        L.Google.isGoogleMapsReady().should.not.be.ok;
      });

      it('just google, and maps', function () {
        window.google = {maps:{}}
        L.Google.isGoogleMapsReady().should.not.be.ok;
      });

      it('has all', function () {
        window.google = {maps:{Map:{}}}
        L.Google.isGoogleMapsReady().should.be.ok;
      });
    });
  });

  describe('Class', function () {
    describe('initialize', function () {
      var instance = null;

      beforeEach(function () {
        delete window.google
        instance = new L.Google();
      });

      it('check instance ready and type', function () {
        window.google = {maps:{Map:{}}}
        instance.initialize('test', {});
        instance._type.should.be.eql('test');
        instance._googleApiPromise
        .then(function () {
          instance._ready.should.be.ok;
        });
      });
    });
  });
});
