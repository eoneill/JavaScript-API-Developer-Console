YUI().use('test', function(Y) {

  var suite = new Y.Test.Suite("Raw Suite");

  suite.add(new Y.Test.Case({

    name : "IN.API.Raw",

    //These test actually create activities and share so they are ignored by default
    _should: {
      ignore: {
        "should perform raw POST call (Activity Update)" : true,
        "should perform raw POST call (Share)" : true,
        "should perform raw PUT call" : true
      }
    },
    
    "should return api name and resource" : function()
    {
      Y.Assert.areEqual("raw", IN.API.Raw().name(), "Wrong API name");
      Y.Assert.areEqual("/{RAW}", IN.API.Raw("dummy").resource(), "Wrong API resource");
    },

    "should perform raw GET call" : function ()
    {
      IN.API.Raw("/people/~").method("GET").
        result(function(data){
          this.resume(function(){
            Y.Assert.isNotUndefined(data, "Should not return undefined");
          });
        }, this);

      this.wait(LinkedIn.Test.TIMEOUT);
    },

    "should perform raw POST call (Activity Update)" : function ()
    {
      var BODY = { 'content-type':'linkedin-html', 'body':'hurray!' };

      IN.API.Raw("/people/~/person-activities")
            .method("POST")
            .body(JSON.stringify(BODY))
            .result(function(response){
              this.resume(function(){});
            }, this)
            .error(function(response){
              this.resume(function(){
                Assert.fail("Not 2xx response");
              });
            }, this);
      this.wait(LinkedIn.Test.TIMEOUT);
    },
    
    "should perform raw POST call (Share)" : function ()
    {
      var BODY =  { "content": { "submitted-url": "http://www.google.com", "title": "this search engine is neat" }, "visibility": {"code": "anyone"}, "comment": "nice link" };

      IN.API.Raw("/people/~/shares")
            .method("POST")
            .body(JSON.stringify(BODY))
            .result(function(response){
              this.resume(function(){
                //passed
              });
            }, this)
            .error(function(response){
              this.resume(function(){
                Assert.fail("Not 2xx response");
              });
            }, this);
      this.wait(LinkedIn.Test.TIMEOUT);
    },

    "should perform raw PUT call" : function ()
    {
      var STATUS_BODY = "\"Testing javascript API\""

      IN.API.Raw('/people/~/current-status')
        .method("PUT")
        .body(STATUS_BODY)
        .result(function(data){
          this.resume(function(){
            //passed
          });
        }, this)
        .error(function(data){
          this.resume(function(){
            Assert.fail("Not 2xx response");  
          })
        }, this);
      this.wait(LinkedIn.Test.TIMEOUT);
    }
  }));

  LinkedIn.Test.Visuals.addVisuals(Y.Test.Runner);
  Y.Test.Runner.add(suite);
  Y.Test.Runner.run();
});