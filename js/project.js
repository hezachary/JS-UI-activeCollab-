function fnLoadJS(aryLoadJS) {
  var loadJS = aryLoadJS.pop();
  var d = loadJS[0];
  var s = loadJS[1];
  var attr = loadJS[2];
  var valid = loadJS[3](); 
  var loaded = loadJS[4](); 
  if(valid && !loaded){
      var allDoc = d.getElementsByTagName(s);
      var js, fjs = allDoc[allDoc.length - 1];
      if (!d.getElementById(attr.id)){
        js = d.createElement(s);
        for(i in attr){
            js.setAttribute([i], attr[i]);
        }
        fjs.parentNode.insertBefore(js, fjs);
      }
  }else if(!valid && !loaded){
    aryLoadJS.push(loadJS);
  }
  
  if(aryLoadJS.length){
    setTimeout(function(){
        fnLoadJS(aryLoadJS);
    }, 100);
  }
  
}

var aryLoadJS = [];
var activeCollabAPI = document.getElementById('activeCollabAPI');
aryLoadJS.push([document, 'script', {id:'project-load', src: activeCollabAPI._wwwroot + 'js/project_load.js' + '?time=' + (new Date().getTime())}, function(){ return typeof jQuery.tools == 'undefined' ? false : true;}, function(){return false;}]);
aryLoadJS.push([document, 'script', {id:'jquery-tools-sdk', src:'//cdn.jquerytools.org/1.2.7/full/jquery.tools.min.js'}, function(){ return typeof jQuery == 'undefined' ? false : true;}, function(){ return typeof jQuery.tools == 'undefined' ? false : true;}]);
aryLoadJS.push([document, 'script', {id:'jquery-sdk', src:'//ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js'}, function(){return true;}, function(){return typeof jQuery == 'undefined' ? false : true;}]);
aryLoadJS.push([document, 'link', {id:'api-ui', type:'text/css',rel:'stylesheet', href: activeCollabAPI._wwwroot + 'css/ui.css' + '?time=' + (new Date().getTime())}, function(){return true;}, function(){return false;}]);
fnLoadJS(aryLoadJS);