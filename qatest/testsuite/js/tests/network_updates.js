YUI().use('test', function(Y) {

  var suite = new Y.Test.Suite("Network Updates Suite");

  suite.add(new Y.Test.Case({

    name : "IN.API.Network",

    _should : {
      error : {
        "should fail for 3rd party updates" : true
      }
    },

    "should return api name and resource" : function()
    {
      Y.Assert.areEqual('networkupdates.get', IN.API.NetworkUpdates('me').name());
      Y.Assert.areEqual('/people/{IDS}/network/updates:({FIELDS})', IN.API.NetworkUpdates('me').resource());
    },
    
    "should return member updates for self" : function ()
    {
      IN.API.NetworkUpdates("me").result(function(result){
        this.resume(function(){
          Y.Assert.isNotUndefined(result.values, "Must return updates");
          Y.Assert.isNotUndefined(result.values[0].updateContent, "Must return updateContent");
        });
      }, this);

      this.wait(LinkedIn.Test.TIMEOUT);
    },

    "should return member updates using field selectors" : function ()
    {
      IN.API.NetworkUpdates("me").fields("updateType")
        .result(function(data){
          this.resume(function(){
            Y.Assert.isNotUndefined(data.values, "Must return member updates");
            Y.Assert.isNotUndefined(data.values[0].updateType, "Must return update-type");
            Y.Assert.isUndefined(data.values[0].updateContent, "Must not return updateContent");
          });
      }, this);

      this.wait(LinkedIn.Test.TIMEOUT);
    },

    "should call error() if given wrong field names" : function ()
    {
      IN.API.NetworkUpdates('me').fields('foo', 'bar')
        .error(function(data){
          this.resume(function(){});
        }, this)
        .result(function(data){
          Y.Assert.fail('should call error() not result()');
        });

      this.wait(LinkedIn.Test.TIMEOUT);  
      
    },
    
    "should fail for 3rd party updates" : function ()
    {
      IN.API.NetworkUpdates("not-me").result(function(data){
        Y.Assert.fail("Should not call result()");
      }, this);
    }
  }));
  LinkedIn.Test.Visuals.addVisuals(Y.Test.Runner);
  Y.Test.Runner.add(suite);
  Y.Test.Runner.run();  
});