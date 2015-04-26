'use strict';

angular.module('assays').directive('bsDropdown', function ($compile, $log) {
    return {
        restrict: 'E',
        scope: {
            items: '=dropdownData',
            doSelect: '&selectVal',
            selectedItem: '=preselectedItem'
        },
        link: function (scope, element, attrs) {
            var html = '';
            switch (attrs.menuType) {
                case 'button':
                    html += '<div class="btn-group"><button type="button" class="btn button-label btn-default">{{selectedItem.name}}</button><button class="btn btn-default dropdown-toggle" data-toggle="dropdown"><span class="caret"></span></button>';
                    break;
                default:
                    html += '<div class="dropdown"><a class="dropdown-toggle" role="button" data-toggle="dropdown"  href="javascript:;">{{selectedItem.name}}<b class="caret"></b></a>';
                    break;
            }
            html += '<ul class="dropdown-menu"><li ng-repeat="item in items"><a tabindex="-1" data-ng-click="selectVal(item.name)">{{item.name}}</a></li></ul></div>';
            element.append($compile(html)(scope));
            scope.bSelectedItem = scope.items.find(function(e) {return (e.name === scope.selectedItem.name);});
            scope.selectVal = function (itemName) {
                switch (attrs.menuType) {
                    case 'button':
                        angular.element('button.button-label').html(itemName);
                        break;
                    default:
                        angular.element('a.dropdown-toggle').html('<b class="caret"></b> ' + itemName);
                        break;
                }
                scope.doSelect({
                    selectedVal: scope.items.find(function(e) {return (e.name === itemName);})
                });
            };
            scope.selectVal(scope.bSelectedItem.name);
        }
    };
});
