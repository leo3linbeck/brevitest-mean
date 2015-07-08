'use strict';

// Users service used for communicating with the users REST endpoint
angular.module('superusers').factory('swalConfirm', [
    function () {
        return {
            swal: function(callParams, callFunc, swalParams) {
                /*globals swal */
                swal({title: swalParams.title, text: swalParams.text, type: swalParams.type, showCancelButton: swalParams.showCancelButton, confirmButtonColor: swalParams.confirmButtonColor, confirmButtonText: swalParams.confirmButtonText, cancelButtonText: swalParams.cancelButtonText, closeOnConfirm: swalParams.closeOnConfirm, closeOnCancel: swalParams.closeOnCancel}, function (confirmed) {
                    if (!confirmed)
                            return;
                    callFunc(callParams);
                });
            }
        };
    }
]);
