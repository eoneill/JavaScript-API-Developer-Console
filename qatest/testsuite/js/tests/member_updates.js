YUI().use('test', function(Y) {

  var suite = new Y.Test.Suite("Member Updates Suite");

  suite.add(new Y.Test.Case({

    name : "IN.API.MemberUpdates",
    
    _should : {
      error : {
        "should fail if triying to retrieve connections for more than one id" : true
      }
    },

    "should return api name and resource" : function()
    {
      Y.Assert.areEqual('memberupdates.get', IN.API.MemberUpdates('me').name());
      Y.Assert.areEqual('/people/{IDS}/network/updates:({FIELDS})', IN.API.MemberUpdates('me').resource());
    },
    
    "should return member updates for self" : function ()
    {
      IN.API.MemberUpdates("me").result(function(data){
        this.resume(function(){
          Y.Assert.isNotUndefined(data.values, "Must not return 'undefined'");
          Y.Assert.isNotUndefined(data.values[0].updateContent, "Must return 'updateContent'");
        });
      }, this);

      this.wait(LinkedIn.Test.TIMEOUT);
    },
    
    "should return member updates using field selectors" : function ()
    {
      IN.API.MemberUpdates("me").fields("updateType")
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
      IN.API.MemberUpdates('me').fields('foo', 'bar')
        .error(function(data){
          this.resume(function(){});
        }, this)
        .result(function(data){
          Y.Assert.fail('should call error() not result()');
        });

      this.wait(LinkedIn.Test.TIMEOUT);  
      
    }
  }));
  LinkedIn.Test.Visuals.addVisuals(Y.Test.Runner);
  Y.Test.Runner.add(suite);
  Y.Test.Runner.run();  
});
