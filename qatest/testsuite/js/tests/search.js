YUI().use('test', function(Y) {

  var suite = new Y.Test.Suite("Search Suite");

  suite.add(new Y.Test.Case({

    name : "IN.API.PeopleSearch",
    
    _should:{
      error:{
        "should fail for other than 'me'" : true,
        "should fail for strings as params" : true
      },
      ignore: {
        "should perform faceted search" : false,
        "should perform empty faceted search" : false
      }
    },
    
    "should return api name and resource" : function()
    {
      Y.Assert.areEqual("peoplesearch.get", IN.API.PeopleSearch().name(), "Wrong API name");
      Y.Assert.areEqual("/people-search:(people:({FIELDS}),num-results)", IN.API.PeopleSearch().resource(), "Wrong API resource");
    },

    "should search by field" : function ()
    {
      IN.API.PeopleSearch().params({"industry":"Marketing"}).
        result(function(data){
          this.resume(function(){
            Y.Assert.isNotUndefined(data, "Should not return undefined");
          });
        }, this);

      this.wait(LinkedIn.Test.TIMEOUT);
    },

    "should fail for other than 'me'" : function ()
    {
      IN.API.PeopleSearch("other-id").result(function(data){
        Y.Assert.fail("should never call result");
      });
    },

    "should call error() for unexistent fields" : function ()
    {
      IN.API.PeopleSearch().fields('foo', 'bar').error(function(data){
        this.resume(function(){});
      }, this).
      result(function(data){
        Y.Assert.fail('should call error() instead of result()');
      });

      this.wait(LinkedIn.Test.TIMEOUT);
    },

    "should call error() if given unexistent fields" : function () 
    {
      IN.API.PeopleSearch().fields('foo', 'bar').error(function(data){
        this.resume(function(){});
      }, this).
      result(function(data){
        Y.Assert.fail("should call error() not result()");
      });

      this.wait(LinkedIn.Test.TIMEOUT);
    },

    "should fail for strings as params" : function () 
    {
      IN.API.PeopleSearch().params('foo', 'bar').result(function(data){
        Y.Assert.fail("Should not call result()");
      }, this);
    },

    // FACETS

    "should perform faceted search" : function ()
    {
      IN.API.PeopleSearch()
            .fields("firstName", "lastName")
            .facets("name", "code").result(function(data) {
              this.resume(function(){
                Y.Assert.isNotUndefined(data, "Should not return undefined");
              })
            }, this);

      this.wait(LinkedIn.Test.TIMEOUT);
    },

    "should perform empty faceted search" : function ()
    {
      IN.API.PeopleSearch()
            .fields("firstName", "lastName").facets().result(function(data) {
              this.resume(function(){
                Y.Assert.isNotUndefined(data, "Should not return undefined");
              })
            }, this);

      this.wait(LinkedIn.Test.TIMEOUT);
    },

    "should fail for unexistent facets" : function ()
    {
      IN.API.PeopleSearch()
            .fields("firstName", "lastName").facets("not-a-facet")
            .result(function() {
              Y.Assert.fail('Should not call result() but error()');
            })
            .error(function(data){
              this.resume(function(){});
            },this);

      this.wait(LinkedIn.Test.TIMEOUT);
    }
  }));

  LinkedIn.Test.Visuals.addVisuals(Y.Test.Runner);
  Y.Test.Runner.add(suite);
  Y.Test.Runner.run();
});
