// Watches a Java class  and reports on method invocations.

var Throwable = Java.use('java.lang.Throwable');


var dump_args = ('{{ dump_args }}'.toLowerCase() === 'true');
var dump_return = ('{{ dump_return }}'.toLowerCase() === 'true');
var dump_backtrace = ('{{ dump_backtrace }}'.toLowerCase() === 'true');

var search_class = '{{ search_class }}'.toLowerCase(); // The class to search
var search_var = '{{ search_var }}'.toLowerCase();
//Lets find all the classes containing the search_class
var classes = Java.enumerateLoadedClassesSync().filter(function (class_name) {

    if (class_name.toLowerCase().indexOf(search_class) != -1) {
        return class_name;
    }
});

classes.forEach(function(class_name) {
  try{
    var target_class = Java.use(class_name);
  }
  catch(err){
    return
  }
  // Get the methods this class has and filter for unique ones.
  var methods = target_class.class.getDeclaredMethods().map(function (method) {

      // eg: public void com.example.fooBar(int,int)
      var full_method_signature = method.toGenericString();

      // strip any 'throws' the method may have
      if (full_method_signature.indexOf(' throws ') !== -1) {
          full_method_signature = full_method_signature.substring(0, full_method_signature.indexOf(' throws '));
      }

      // remove the scope and return type
      var method_only_delimiter_location = full_method_signature.lastIndexOf(' ');
      var class_and_method_name = full_method_signature.slice(method_only_delimiter_location)

      // remove the classname
      var method_name_with_signature = class_and_method_name.replace(' ' + class_name+ '.', '');
      // remove the signature
      var method_name_only = method_name_with_signature.split('(')[0];

      return method_name_only;

  }).filter(function (value, index, self) {

      // filter to unique values only
      return self.indexOf(value) === index;
  });

  send({
      status: 'success',
      error_reason: NaN,
      type: 'watch-class-var',
      data: 'Found ' + class_name + ' with ' + methods.length + ' methods (excl: overloads)',
  });

  methods.map(function (method) {

      try{
        var overload_count = target_class[method].overloads.length;
      }
      catch(err){
        return
      }
      // Hook all of the overloads found for this class.method
      // TODO: Make this a function that can be used in both this class
      // watcher as well as the specific method watcher. Or, simply
      // change the command to optionally specify a specific method.
      for (var i = 0; i < overload_count; i++) {

          send({
              status: 'success',
              error_reason: NaN,
              type: 'watch-class',
              data: 'Hooking overload: ' + (i + 1) + ' for ' + method
          });

          // Hook the overload.
          target_class[method].overloads[i].implementation = function () {
              // if we should include a backtrace to here, do that.
              var message = ""
              if (dump_backtrace) {

                  message = '\nBacktrace:\n\t' + Throwable.$new().getStackTrace()

                      .map(function (stack_trace_element) {

                          return stack_trace_element.toString() + '\n\t';
                      }).join('');
              }

              // send({
              //     status: 'success',
              //     error_reason: NaN,
              //     type: 'watch-class',
              //     data: message
              // });

              if (dump_args) {

                  // Loop the arguments and dump the values.toString()
                  for (var h = 0; h < arguments.length; h++) {
                    if (arguments[h].toString().indexOf(search_var) != -1)
                      send({
                          status: 'success',
                          error_reason: NaN,
                          type: 'watch-class',
                          data: target_class + '.' + method + ' - Arg ' + h + ': ' + (arguments[h] || '(none)').toString() + message
                      });
                  }
              }

              // continue with the original method and capture the return value
              var return_value = this[method].apply(this, arguments);

              if ((dump_return) && (return_value.toString().indexOf(search_var) != -1)) {

                  send({
                      status: 'success',
                      error_reason: NaN,
                      type: 'watch-class',
                      data: target_class + '.' + method + ' - Returned : ' + (return_value || '(none)').toString() + message
                  });
              }

              // finally, return
              return return_value;
          }
      }
  });

});
