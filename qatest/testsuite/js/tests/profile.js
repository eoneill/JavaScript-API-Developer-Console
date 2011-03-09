YUI().use('test', function(Y) {

  var suite = new Y.Test.Suite("Profile Suite");

  suite.add(new Y.Test.Case({

    name : "IN.API.Profile",

    _should : {
      error : {
        "should fail if no ID given" : true
      }
    },

    "should return api name and resource" : function()
    {
      Y.Assert.areEqual("people.get", IN.API.Profile("me").name(), "Wrong API name");
      Y.Assert.areEqual("/people::({IDS}){ISPUBLIC}:({FIELDS})", IN.API.Profile("me").resource(), "Wrong API resource");    
    },

    "should return self profile" : function ()
    {
      IN.API.Profile("me").fields("firstName", "lastName", "connections", "industry")
      .result(function(result){
        this.resume(function(){
          Y.Assert.isNotUndefined(result.values, "Profile should be defined");
          Y.Assert.isString(result.values[0].firstName, "Should return first name");
          Y.Assert.isString(result.values[0].lastName, "Should return last name");
          Y.Assert.isNumber(result.values[0].connections._total, "Should return connection totals");
        });
      }, this);

      this.wait(LinkedIn.Test.TIMEOUT); 
    },

    "should call error() if given wrong field selectors" : function ()
    {
      IN.API.Profile("me").fields('firstName', 'experience')
        .error(function(result){
          this.resume(function(){});
        }, this)
        .result(function(result){
          Y.Assert.fail("should call error() not result()");
        }, this);

      this.wait(LinkedIn.Test.TIMEOUT);
    },
    
    "should return self profile with field selectors" : function ()
    {
      IN.API.Profile("me").fields("firstName", "industry", "connections")
      .result(function(result){
        this.resume(function(){
          Y.Assert.isNotUndefined(result.values, "Profile should be defined");
          Y.Assert.isString(result.values[0].firstName, "Should return first name");
          Y.Assert.isUndefined(result.values[0].lastName, "Should not bring last name");
          Y.Assert.isString(result.values[0].industry, "Should return 'industry'");
          Y.Assert.isNumber(result.values[0].connections._total, "Should return connection totals");
        });
      }, this);

      this.wait(LinkedIn.Test.TIMEOUT);
    },
    
    "should fail if no ID given" : function ()
    {
      IN.API.Profile().result(function(result){
        YAHOO.util.Assert.fail('Should not call result()');
      }, this);
    },
    
    "should return an empty collection if no profile was found" : function ()
    {
      IN.API.Profile("not-found").result(function(data){
        this.resume($.noop());
      }, this).
      error(function(data){
        Y.Assert.fail("should call result() not error()");
      });
      this.wait(LinkedIn.Test.TIMEOUT);
    }
  }));
  
  LinkedIn.Test.Visuals.addVisuals(Y.Test.Runner);
  Y.Test.Runner.add(suite);
  Y.Test.Runner.run();
});