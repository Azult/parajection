// Watches for invocations of a specific Objective-C method.

var classesPattern = '{{ classes_Pattern }}'.toLowerCase()
var methodsPattern = '{{ methods_Pattern }}'.toLowerCase()
var argsPattern = '{{ args_Pattern }}'.toLowerCase()
var returnsPattern = '{{ returns_Pattern }}'.toLowerCase()
var dump_args = ('{{ dump_args }}'.toLowerCase() === 'true')
var dump_return = ('{{ dump_return }}'.toLowerCase() === 'true')
var dump_backtrace = ('{{ dump_backtrace }}'.toLowerCase() === 'true')

for (var aClass in ObjC.classes) {
  try{
    if (aClass.toLowerCase().indexOf(classesPattern) != -1) {
      var ownMethods = ObjC.classes[aClass].$ownMethods;
      ownMethods.forEach(function(matchMethod) {
        if (matchMethod.toLowerCase().includes(methodsPattern)){
          send({
              status: 'success',
              error_reason: NaN,
              type: 'watch-class-methods-var-returns',
              data: 'Found address for class : ' + aClass + ' and method : ' + matchMethod
          });
          var hook = eval('ObjC.classes.'+aClass+'["'+matchMethod+'"]');
          Interceptor.attach(hook.implementation, {
            onEnter: function (args) {
            var receiver = new ObjC.Object(args[0]);
            var message = '[' + receiver.$className + ' ' + ObjC.selectorAsString(args[1]) +
                '] (Kind: ' + receiver.$kind + ') (Super: ' + receiver.$superClass + ')';

            // if we should include a backtrace to here, do that.
            if (dump_backtrace) {

                message = message + '\nBacktrace:\n\t' +
                    Thread.backtrace(this.context, Backtracer.ACCURATE)
                        .map(DebugSymbol.fromAddress).join('\n\t')
            }

            send({
                status: 'success',
                error_reason: NaN,
                type: 'watch-class-methods-var-returns',
                data: 'Called: ' + message
            });

            if (dump_args) {
              var i = 0;
              try{
                for (var i = 2; i < 4; i++) {
                  var obj = ObjC.Object(args[i]);
                  var arguments = obj.toString();
                  send({
                      status: 'success',
                      error_reason: NaN,
                      type: 'watch-class-methods-var-returns',
                      data: 'Argument dump: [ Class: ' + aClass + ', Method: ' + matchMethod + ', Arguments : ' + arguments + ']'
                  });
                }
            }catch(err){
              send({
                  status: 'error',
                  error_reason: 'Argument dump error: [' + err + ']',
                  type: 'watch-class-methods-var-returns',
                  data: NaN
              });
            }
          }
        },
          onLeave: function (retval) {
              if (dump_return) {

                  send({
                      status: 'success',
                      error_reason: NaN,
                      type: 'watch-class-methods-var-returns',
                      data: 'Retval: ' + retval.toString()
                  });
                }
              }
          });
        };
      })
    }
  }catch(err){
    send({
        status: 'error',
        error_reason: 'Unable to find address due to '+ err,
        type: 'watch-class-methods-var-returns',
        data: 'Error: ' + err
    });
  }
}
send({
    status: 'Ready',
    error_reason: NaN,
    type: 'watch-class-methods-var-returns',
    data: ''
});
