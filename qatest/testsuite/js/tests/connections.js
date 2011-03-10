YUI().use('test', function(Y) {

  var suite = new Y.Test.Suite("Connections Suite");

  suite.add(new Y.Test.Case({

    name : "IN.API.Connections",
    
    _should : {
      error : {
        "should fail if triying to retrieve connections for more than one id" : true
      }
    },

    "should return api name and resource": function ()
    {
      Y.Assert.areEqual('connections.get', IN.API.Connections('me').name());
      Y.Assert.areEqual('/people/{IDS}/connections:({FIELDS})', IN.API.Connections('me').resource()); 
    },

    "should return connections for self" : function ()
    {
      IN.API.Connections("me").result(function(result){
        this.resume(function(){
          Y.Assert.isNotUndefined(result.values, "Results should be defined");
          Y.Assert.isString(result.values[0].firstName, "Should return first name");
          Y.Assert.isString(result.values[0].lastName, "Should return last name");
          Y.Assert.isNumber(result._total, "Should return connection totals");
        });
      }, this);
      this.wait(LinkedIn.Test.TIMEOUT);
    },

    "should return connections using field selectors": function()
    {
      IN.API.Connections("me").fields("firstName", "lastName")
        .result(function(connections){
          this.resume(function(){
            Y.Assert.isNotUndefined(connections.values, "Connections should be defined");
            Y.Assert.isString(connections.values[0].firstName, "Must bring firstName");
            Y.Assert.isUndefined(connections.values[0].headline, "Must not bring headline");    
          });
        },this);

      this.wait(LinkedIn.Test.TIMEOUT);
    },

    "should fail if triying to retrieve connections for more than one id" : function ()
    {
      IN.API.Connections("id1","id2").
        result(function(data){
          YAHOO.util.Assert.fail("must not call result()");
        });
    },

    "should call error() if asked for wrong fields" : function ()
    {
      IN.API.Connections('me').fields('foo', 'bar')
        .error(function(data){
          this.resume(function(){});
        }, this)
        .result(function(data){
          Y.Assert.fail('must not call result() but error()');
        }, this);

      this.wait(LinkedIn.Test.TIMEOUT);
    }
  }));

  LinkedIn.Test.Visuals.addVisuals(Y.Test.Runner);
  Y.Test.Runner.add(suite);
  Y.Test.Runner.run();  
});
