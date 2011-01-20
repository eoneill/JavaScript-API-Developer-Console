/**
 * Provides application functionality for JavaScript API Developer Console test environment
 * @author      Eugene ONeill (eoneill)
 * @maintainer  Eugene ONeill (eoneill)
 * @requires    jQuery (http://jquery.com/),
 *              jQuery UI (http://jqueryui.com/),
 *              jQuery Cookie Plugin (https://github.com/carhartl/jquery-cookie),
 *              CodeMirror (http://codemirror.net/)
 **/

/* set up console for logging */
if (!window.console || !window.console.log) {
 window.console = window.console || {};
 window.console.log = window.console.log || function(){};
}
/* override default console.log */
window.console.oldLog = window.console.log;
window.console.log = function(){
 if(arguments.length > 0) {
   $("#clearlog").show("fast");
   $("#logging").append("<li>"+arguments[0].replace(/\n/g,"<br/>")+"</li>");
   console.oldLog(arguments[0]);
 }
};

;(function($) { // protect script and preserve jQuery $ alias
  /* minimum height that a container should be (in px) */
  var MIN_CONTAINER_HEIGHT = 300;
  /* height to expand the result bar */
  var EXPAND_HEIGHT = 100;
  /*
   * cache some DOM elements
   *  these are some frequently used DOM elements, it is helpful to
   *  cache these to prevent multiple DOM look-ups
   *  (not entirely necessary as Sizzle will cache most of these)
   */
  var $accordion = $("#sidebar-accordion");
  var $sandbox = $("#sandbox");
  var $codeConsole =$("#code-console");
  var $contractSandbox = $("#contract-sandbox");
  var $errorContainer = $("#error-container");
  var $tinyURLContainer = $("#tiny-url-container");
  var $tinyURL = $("#tiny-url");
  var loc = window.location;
  /* these DOM elements won't be available until ajax completes */
  var $frameworkSelector;
  var $frameworkCustom;
  var $frameworkCustomURL;
  var $apiKey;
  var $apiVersion;
  var $apiOnLoad;
  var $apiAuth;
  var $apiCredentials;
  var $apiDebug;
  var $moreOptions;
  
  var originalCode = "";
  
  var saved = {}; // use this to hold cookies/preferences
  
  /* create CodeMirror editor */
  var consoleEditor = CodeMirror.fromTextArea("code-console", {
    height    : "350px",
    parserfile: ["parsexml.js", "parsecss.js", "tokenizejavascript.js", "parsejavascript.js", "parsehtmlmixed.js"],
    stylesheet: ["css/codemirror/xmlcolors.css", "css/codemirror/jscolors.css", "css/codemirror/csscolors.css"],
    path      : "js/codemirror/"
  });
  var $codeMirror = $(".CodeMirror-wrapping", "#console-container");
  
  /*
   * helper function to reset the environment
   *  this helps ensure that subsequent runs will work properly
   */
  var cleanUpEnvironment = function() {
    console.log("cleaning up...");
    /* remove generated sandbox */
    $("iframe","#sandbox").remove();
    /* hide previous TinyURL */
    $tinyURLContainer.hide("fast");
    /* remove previous error messages */
    removeAllErrorMessages();
  };
  
  /*
   * helper function to toggle custom url input field
   */
  var toggleCustomURL = function( animationSpeed ) {
    if( $frameworkSelector.val() !== "custom" ) {
      $frameworkCustom.hide( animationSpeed );
    }
    else {
      $frameworkCustom.show( animationSpeed );
    }
  };
  
  /*
   * helper function to return the portion of the hash before an &
   * - this will be the "example" file to load into the console
   */
  var getExampleFromHash = function() {
    var example;
    if( loc.hash ) {
      example = loc.hash.replace("#","");
      if( example !== "" ) {
        example = example.split("&");
        return example[0];
      }
    }
    return "";
  };
  
  /*
   * helper function to load example file via ajax
   */
  var loadExample = function( loadData ) {
    var undefined;    // don't rely on global undefined
    if( loadData !== "" && loadData !== "#" && 
        loadData !== undefined && loadData !== "undefined" )
    {
      loadData = loadData.split("&");
      exampleURL = loadData[0];
      if(loadData.length > 1) {
        try {
          var loadData = $.parseJSON( unescape(loadData[1]) );  // need to unescape the hash
          restorePreferences(loadData); // replace options form with hash prefs
        }
        catch(e) {
          throwErrorMessage("error1002","the URL is malformed. Could not retreive preferences.");
        }
      }
      /* set a message in the console */
      consoleEditor.setCode("loading example...");
  	  removeErrorMessage("error1000");
  	  
      if( exampleURL.search("c=") === -1 ) { // no custom code was provided
        /* load example file */
        $.ajax({
        	url     : exampleURL,
        	success : function(data) {
        	  /* write example to console on success */
        	  consoleEditor.setCode(data);
        	  originalCode = data;
        	},
        	error   : function(xhr, status, e) {
        	  var errorMessage = "failed to load example: "+exampleURL
        	                      +"\nstatus: "+xhr.status+" "+xhr.statusText;
        	  throwErrorMessage("error1000",errorMessage);
            consoleEditor.setCode(errorMessage);
        	}
        });
      }
      else if ( exampleURL !== "" && exampleURL !== "#" ) {
        consoleEditor.setCode( unescape( exampleURL.replace("c=","") ) );
      }
    }
  };
  
  /*
   * helper function to throw an error message
   */
  var throwErrorMessage = function( id, message ) {
    var $errID = $("#"+id, $errorContainer);
    console.log("Error: "+message);
    $errorContainer.show("fast");
    if( $errID.length > 0 ) {
      $(".error-message", $errID).html(message);
    }
    else {
      $errorContainer.append('<div class="ui-widget" id="'+id+'"><div class="ui-state-error ui-corner-all"><p><span class="ui-icon ui-icon-alert"></span><strong>Error:</strong> <span class="error-message">'+message.replace(/\n/g,"<br/>")+'</span></p></div></div>');
    }
  }
  
  /*
   * helper function to remove an error message
   */
  var removeErrorMessage = function( id ) {
    var $errID = $("#"+id, $errorContainer);
    $errID.remove();
  }
  
  /*
   * helper function to remove all error messages
   */
  var removeAllErrorMessages = function() {
    $errorContainer.hide("fast").html("").show("fast");
  }
  
  /*
   * helper function to resize containers to window
   */
  var setContainerSize = function(){
    var winHeight = $(window).height();
    var headerHeight = $("h1").height();
    var containerPadding = 2 * parseInt($("#container").css("padding-top"), 10);
    var approx = 100;
    var height = Math.floor( (winHeight - headerHeight - containerPadding - approx) / 2 );
    
    if( height <= MIN_CONTAINER_HEIGHT ) {
      height = MIN_CONTAINER_HEIGHT;
      $contractSandbox.hide("fast");
    }
    else {
      $contractSandbox.show("fast");
    }
    
    $codeMirror.height(height);
    $sandbox.height(height);
  };
  
  /*
   * helper function to remove log events
   */
  var clearLog = function() {
    $("#logging").html("");
    $("#clearlog").hide("fast");
  };
  
  /*
   * helper function to generate a TinyURL via ajax json
   */
  var getTinyURL = function( longURL, success ) {
    var URL = "http://json-tinyurl.appspot.com/?url=" + encodeURIComponent(longURL) + "&callback=?";
  	if(URL.length >= 2048) {
  	  throwErrorMessage("error1004","TinyURL cannot be generated. Potential loss of data due to URL length limitations. Consider creating an example file.")
  	}
  	else {
  	  $.getJSON(URL, function(data){
        success && success(data.tinyurl);
      });
    }
  };
  
  /*
   * helper function to move preferences from cookies/hashes into the Options Form
   */
  var restorePreferences = function( saved ) {
    if( saved.framework ) {
      $frameworkSelector.val(saved.framework);
    }
    if( saved.frameworkurl ){
      $frameworkCustomURL.val( saved.frameworkurl );
    }
    if( saved.apikey ){
      $apiKey.val( saved.apikey );
    }
    if( saved.apiversion ) {
      $apiVersion.val( saved.apiversion );
    }
    if( saved.onload ) {
      $apiOnLoad.val( saved.onload );
    }
    if( saved.extensions ) {
      $apiExtensions.val( saved.extensions );
    }
    if( saved.apiauth ) {
      $apiAuth.attr("checked", saved.apiauth);
    }
    if( saved.apidebug ) {
      $apiDebug.attr("checked", saved.apidebug);
    }
    if( saved.apicredentials ) {
      $apiCredentials.attr("checked", saved.apicredentials);
    }
  };
  
  /* load in cookies */
  if( $.cookie("apiconsole") ) {
    /* read JSON data into object */
    try {
      saved = $.parseJSON( $.cookie("apiconsole") );
    }
    catch(e) {
      throwErrorMessage("error1001","could not load options from cookies");
    }
  }
  if( loc.hash ) {
    var prefs = loc.hash.replace("#","").split("&");
    if(prefs.length>1) {
      try {
        prefs = $.parseJSON( unescape(prefs[1]) );  // need to unescape the hash
        $.extend(saved, prefs); // replace cookie prefs with hash prefs
      }
      catch(e) {
        throwErrorMessage("error1002","the URL is malformed. Could not retreive preferences.");
      }
    }
  }
  
  /*
   * Initialize Accordion Sidebar (jQuery UI)
   */
  $accordion.accordion({ 
    active: false,      // start accordion in a collapsed state (need to do this for dynamic content)
    clearStyle: true,   // this is needed to work well with dynamic content
    collapsible: true   // allow all accordions to be collapsed (for active to work right)
  });
  
  /*
   * Load Framework selection via ajax
   */
  $("#framework").load( "frameworks.html", function() {
    $frameworkSelector = $("#framework-selector");
    $frameworkCustom = $("#framework-custom");
    $frameworkCustomURL = $("#framework-url-custom");
    $codeConsole = $("#code-console");
    $apiKey = $("#api-key");
    $apiAuth = $("#api-auth");
    $apiOnLoad = $("#api-onload");
    $apiVersion = $("#api-version");
    $apiCredentials = $("#api-credentials");
    $apiExtensions = $("#api-extensions");
    $apiDebug = $("#api-debug");
    
    /* restore preferences */
    restorePreferences(saved);
    
    /* Hide the custom input if a framework is selected */
    toggleCustomURL();
    
    /* now that we have the content loaded, we can expand the accordion */
    $accordion.accordion('activate',0);
    
    // cache "more options" and hide initially
    $moreOptions = $(".more", $(this));
    $moreOptions.hide();
    
    /* wrap up options */
    $(".more-link", $(this)).click(function() {
      var tmp = $(this).attr("alt");
      $moreOptions.toggle("fast");
      $(this).attr("alt", $(this).text());
      $(this).text(tmp);
      return false;
    });
    
    /* toggle the custom input when needed */
    $frameworkSelector.change( function() { toggleCustomURL("fast") } );
  });
  
  /*
   * Load the list of examples via ajax
   */
  $("#examples").load("examples/examples.html", function() {
    /* collapse category groups */
    $(".example-group", "#examples").hide();
    
    /*  add category event handler (click) */
    $("a.category", "#examples").click( function() {
      var id = $(this).attr("href");
      id = id.split("#");   // we only want the hash, not the whole URL
      id = "#" + id[1];     // we have to do this run-around for IE
      $(id).toggle("fast"); // toggle category group
      return false;         // stop default action
    });
    
    /* add event handler to load examples into code area */
    $("a",".example-group").click( function() {
      var href = $(this).attr("href");
      loadExample( href );
      loc.hash="#"+href;
      return false;
    });
  });
  
  /* stylize buttons (jQuery UI) */
  $("a", "#button-container").button();
  
  /* make the container pretty (jQuery UI)*/
  $("#container").addClass("ui-widget ui-widget-content ui-corner-all");
  
  /*
   * event handler for Run click
   */
  $("#runcode").click( function() {
    var connectURL = $frameworkSelector.val();
    var apiKey = $apiKey.val();
    var apiAuthorize = ($apiAuth.attr("checked")) ? "true" : "false";
    var apiOnLoad = $apiOnLoad.val();
    var apiVersion = $apiVersion.val();
    var apiCredentials = ($apiCredentials.attr("checked")) ? "true" : "false";
    var apiExtensions = $apiExtensions.val();
    var apiDebug = ($apiDebug.attr("checked")) ? "1" : "0";
    var params = "api_key: "+apiKey+"\n"
                  +"authorize: "+apiAuthorize+"\n"
                  +"credentials_cookie: "+apiCredentials+"\n"
                  +"debug: "+apiDebug+"\n";
    
    var runCode = consoleEditor.getCode();
    var exampleData = getExampleFromHash();
    /* store preferences in JSON formatted string */
    var preferences = '{'
          +'"framework":"'+$frameworkSelector.val()+'",'
          +'"frameworkurl":"'+$frameworkCustomURL.val()+'",'
          +'"apikey":"'+apiKey+'",'
          +'"apiversion":"'+apiVersion+'",'
          +'"onload":"'+apiOnLoad+'",'
          +'"extensions":"'+apiExtensions+'",'
          +'"apicredentials":'+apiCredentials+"," // note this is bool (no "")
          +'"apiauth":'+apiAuthorize+"," // note this is bool (no "")
          +'"apidebug":'+apiDebug // note this is bool (no "")
        +'}';
    
    console.log("----------------");
    cleanUpEnvironment();
    console.log("Processing...");
    
    if(apiVersion !== "none") {
      params += "version: "+apiVersion+"\n";
    }
    if(apiOnLoad !== "") {
      params += "onLoad: "+apiOnLoad+"\n";
    }
    if(apiExtensions !== "") {
      params += "extensions: "+apiExtensions+"\n";
    }
    
    /* save settings to cookie (as JSON) */
    $.cookie( "apiconsole", preferences, { path: '/', expires: 365 } );
    
    if(runCode != originalCode) {
      exampleData = "c="+escape(runCode);
    }
    loc.hash = "#" + exampleData + "&" + preferences;
    
    /* generate a TinyURL */
    getTinyURL(loc.href, function(tinyurl){
      $tinyURL.text(tinyurl).attr("href",tinyurl);
      $tinyURLContainer.show("fast");
    });
    
    /* was a custom URL provided? */
    if(connectURL === "custom") {
      connectURL = $frameworkCustomURL.val();
      console.log("using custom framework: "+connectURL);
      if(connectURL === "") {
        connectURL = $("option", $frameworkSelector).first().val();
        console.log("no framework provided...\nfalling back to Production framework:\n"+connectURL)
      }
    }
    else {
      connectURL = connectURL.replace("#thiserver#",window.location.hostname);
      console.log("using framework: "+connectURL);
    }
    
    // TODO: form validation
    // should probably verify that a URL and API key were provided
    // but maybe we should let the API handle these cases for testing
    
    /* build the sandbox iframe */
    try {
      console.log("injecting API JavaScript framework...");
      $sandbox.html("").append('<iframe id="sandboxrunner" src="sandbox.html">')
        .find("iframe") // bring jquery focus to iframe
        .bind("load",function(){  // attach onload event
          var iframe = document.getElementById("sandboxrunner");
          // run the framework code
          try {
            console.log("running in Sandbox...");
            iframe.contentWindow.run(runCode, connectURL, params);
          }
          catch(e) {
            throwErrorMessage("error1004","Failed to execute code via Sandbox\n"+e);
          }
        });
    }
    catch(e) {
      throwErrorMessage("error1003","Failed to inject Framework");
    }
    return false;
  });
  
  /* event handler for Save click */
  $("#savecode").click( function() {
    console.log("feature not implemented");
    return false;
  });
  
  /* event handler for Clean Up click */
  $("#cleanup").click( function() {
    cleanUpEnvironment();
    return false;
  });
  
  /* event handler for Clear Log click */
  $("#clearlog").click( function() {
    clearLog();
    return false;
  });
  
  /* event handlers to expand and contract the sandbox */
  $("#expand-sandbox").click(function(){
    $contractSandbox.show("fast");
    $sandbox.height( $sandbox.height()+EXPAND_HEIGHT );
    $("html, body").animate({scrollTop: $sandbox.height()}, "slow");
    return false;
  });
  $contractSandbox.click(function(){
    var height = $sandbox.height()-EXPAND_HEIGHT;
    if( height <= MIN_CONTAINER_HEIGHT ) {
      height = MIN_CONTAINER_HEIGHT;
      $(this).hide("fast");
    }
    $sandbox.height( height );
    return false;
  });
  
  /* hover state for static button (jQuery UI stuff) */
  $("#icons li").hover(
    function() { $(this).addClass("ui-state-hover"); },
  	function() { $(this).removeClass("ui-state-hover"); }
  );
  
  /* set container size and bind to window resize */
  setContainerSize();
  $(window).resize( setContainerSize );
  
  /* onload events */
  $(window).bind("load",function(){ // bind to onload event to prevent race-condition with CodeMirror
    /* load in an example file */
    var hash = getExampleFromHash();
    if(hash !== "") {
      loadExample(hash);
    }
  });
})(jQuery); // preserve jQuery $ alias