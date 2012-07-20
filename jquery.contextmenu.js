/*!
 * jQuery ContextMenu
 * http://www.userdot.net/#!/jquery
 *
 * Copyright 2011, UserDot www.userdot.net
 * Licensed under the GPL Version 3 license.
 * Version 1.0.0
 *
 */
(function($) {
    var classes = {
        popupDiv : 'uctxMenu',
        separator : 'separator',
        hover : 'hover',
        disabled : 'disabled'
    },
    defaults = {
        menu : null,
        mouseButton : 'right',
        isMenu : true,
        minWidth : 120,
        maxWidth : 0,
        delay : 500,
        keyboard : true,
        hoverIntent : true,
        onSelect : function(item) {},
        onLoad : function() {},
        onShow : function() {},
        onHide : function() {}
    },
    menus = [],
    methods = {
        init : function(options) {
            options = $.extend({}, defaults, options);
            if (!options.menu) {
                return false;
            }	
            var $menu;
            if ((typeof(options.menu) === 'object') && (options.menu.constructor.toString().match(/array/i) !== null || options.menu.length)) {
                $menu = $('<div/>').append(buildMenu(options.menu));
                $('body').append($menu);
                $menu.data('uctxDynamic', true);
            }
            else {
                $menu = $(document.getElementById(options.menu));
                $menu.data('uctxDynamic', false);
                $menu.data('uctxOriginal', $menu.clone());
            }
            return this.each(function() {
                var $this = $(this),
                eventNamespace;		
                if (!$this.data('uctxMenu')) {			
                    eventNamespace = "uctxContext-" + (new Date().getTime());
                    $this.data('uctxEventNamespace', eventNamespace)
                    .data('uctxOptions', options)
                    .data('uctxMenu', $menu)
                    .data('uctxEnable', true);
                    $menu.data('isMenu', options.isMenu);			
                    if (! $menu.data('uctxOwners')) {
                        $menu.data('uctxOwners', []);
                    }			
                    $menu.data('uctxOwners').push($this);		
                    menus.push($menu);		
                    if (options.isMenu) {
                        methods.refresh.call($this);
                    }
                    else {
                        $menu.hide();
                        $menu.css({
                            'position' : 'absolute', 
                            'z-index' : 99999
                        });			
                    }
                    $this.bind((((options.mouseButton === 'right') ? 'contextmenu' : 'click') + '.' + eventNamespace), function(e){		
                        if (! $this.data('uctxEnable')) {
                            return true;
                        }
                        methods.show.apply($this, [e.pageX, e.pageY, options.showAnimation]);		
                        if (options.isMenu && options.keyboard) {			
                            $(window).bind('keydown.' + eventNamespace, function(even){
                                var $currentItem;
                                switch (event.keyCode) {
                                    case 27:
                                        $(document).trigger('click.' + eventNamespace);
                                        break;
                                    case 40:
                                        if ($menu.find('li.' + classes.hover).length === 0) {
                                            $menu.find('li:not(.disabled):first').addClass(classes.hover);
                                        }
                                        else {
                                            $currentItem = $menu.find('li.' + classes.hover + ':last');
                                            $currentItem.parent().find('li.' + classes.hover).removeClass(classes.hover).nextAll('li:not(.disabled)').eq(0).addClass(classes.hover);
                                            if ($currentItem.parent().find('li.' + classes.hover).length === 0) {
                                                $currentItem.parent().find('li:not(.disabled):first').addClass(classes.hover);
                                            }
                                        }
                                        return false;
                                    case 38:
                                        if ($menu.find('li.' + classes.hover).length === 0) {
                                            $menu.find('li:not(.disabled):first').nextAll().eq(-1).addClass(classes.hover);
                                        }
                                        else {
                                            $currentItem = $menu.find('li.' + classes.hover + ':last');
                                            $currentItem.parent().find('li.' + classes.hover).removeClass(classes.hover).prevAll('LI:not(.disabled)').eq(0).addClass(classes.hover);
                                            if ($currentItem.parent().find('li.' + classes.hover).length === 0) {
                                                $currentItem.parent().find('li:first').nextAll().eq(-1).addClass(classes.hover);
                                            }
                                        }
                                        return false;
                                    case 39:
                                        if ($menu.find('li.' + classes.hover + ' ul').length > 0) {
                                            $menu.find('li.' + classes.hover + ':last').find('ul:first').show().offset(forceViewport({
                                                top: $menu.find('li.' + classes.hover + ':last').offset().top
                                            }, $menu.find('li.' + classes.hover + ':last').find('ul:first')));
                                            $menu.find('li.' + classes.hover + ':last ul:first li:not(.disabled):first').addClass(classes.hover);
                                        }
                                        return false;
                                    case 37:
                                        if (!$menu.find('li.' + classes.hover + ':last').parent().parent().hasClass(classes.popupDiv)) {
                                            $menu.find('li.' + classes.hover + ':last').removeClass(classes.hover).parent().hide();
                                        }
                                        return false;
                                }
                                return true;
                            });
                        }
                        else {
                            if (options.keyboard) {
                                $(window).bind('keydown.' + eventNamespace, function(even){
                                    if (event.keyCode === 27) {
                                        $(document).trigger('click.' + eventNamespace);
                                    }
                                });
                            }
                        }			
                        $('li', $menu).each(function() { 
                            $(this).click(function() {
                                if (!$(this).hasClass(classes.disabled)) {
                                    options.onSelect.call(this, {
                                        id : $(this).attr('id'),
                                        action : $('a:first', this).attr('href').substr(1)
                                    });
                                }
                            });
                        });
                        $(document).bind('click.' + eventNamespace, function(e){
                            $(window).unbind('keydown.' + eventNamespace);
                            $(document).unbind('click.' + eventNamespace);
                            $('li', $menu).unbind('click');
                            methods.hide.call();
                        });		
                        options.onShow.call(this);
                        return false;
                    });
                }		
                options.onLoad.call(this);
            });
        },
        refresh : function(options) {	
            var opts;
            return this.each(function() {
                var $this = $(this),
                $menu = $this.data('uctxMenu'),
                calculatedWidth,
                $widthTest;		
                if ($this.data('uctxMenu').data('isMenu')) {
                    opts = $.extend($this.data('uctxOptions'), options);
                    if (opts.hoverIntent && ! $.fn.hoverIntent) {
                        opts.hoverIntent = false;
                    }
                    $menu.removeClass(classes.popupDiv);
                    $('li', $menu).removeClass(classes.hover);
                    $('span', $menu).remove();
                    $menu.addClass(classes.popupDiv);
                    $widthTest = $('<div/>').addClass(classes.popupDiv).appendTo('body');		
                    $('ul', $menu).each(function() {
                        $widthTest.html('');
                        calculatedWidth = 0;	
                        $widthTest.html($(this).html());
                        calculatedWidth = $widthTest.width() + 16; 
                        if (calculatedWidth < opts.minWidth) {
                            calculatedWidth = opts.minWidth;
                        }
                        if (calculatedWidth > opts.maxWidth && opts.maxWidth > 0){
                            calculatedWidth = opts.maxWidth;
                        }	
                        $(this).width(calculatedWidth);
                        $(this).children('li').children('ul').css('left', calculatedWidth);
                    });
                    $widthTest.remove(); 
                    $('li:has(ul)', $menu).each(function(){
                        if (! $(this).hasClass(classes.disabled)) {
                            $('a:first', this).append($('<span/>'));
                            if (opts.hoverIntent) {
                                $(this).hoverIntent({
                                    over : function() {
                                        $('ul:first', this).show().offset(forceViewport({
                                            top: $(this).offset().top
                                        }, $('ul:first',this)));
                                    }, 
                                    out : function() {
                                        $('ul:first', this).hide();
                                    }, 
                                    timeout : opts.delay
                                });
                            }
                            else {
                                $(this).hover(function() {
                                    $('ul:first', this).show().offset(forceViewport({
                                        top: $(this).offset().top
                                    }, $(this).find('ul:first')));
                                }, function() {
                                    $('ul:first', this).hide();
                                });
                            }
                        }						
                    });
                    $('li', $menu).each(function() {
                        $(this).click(function() {
                            if ($('ul', this).length < 1) {
                                $('li', $menu).unbind('click');
                                $menu.hide();
                            }
                            return false;
                        });
                        $(this).hover(function() {
                            $(this).parent().find('li.' + classes.hover).removeClass(classes.hover);
                            $(this).addClass(classes.hover);
                        }, function() {
                            $(this).removeClass(classes.hover);
                        });
                    });
                }
            });
        },
        restore : function() {
            return this.each(function() {
                var $this = $(this),
                $menu = $this.data('uctxMenu');
                $this.unbind('.' + $this.data('uctxEventNamespace'));
                $(window).unbind('keydown.' + $this.data('uctxEventNamespace'));
                $(document).unbind('click.' + $this.data('uctxEventNamespace'));
                $.each($menu.data('uctxOwners'), function(index) {
                    if ($this[0] === this) {
                        $menu.data('uctxOwners').splice(index, 1);
                    }
                });
                if ($menu.data('uctxOwners').length < 1) {
                    $.each(menus, function(index) {
                        if ($menu[0] === this) {
                            menus.splice(index, 1);
                        }
                    });
                    if ($menu.data('uctxDynamic')) {
                        $menu.remove();
                    }
                    else {
                        $menu.removeClass(classes.popupDiv);
                        $menu.replaceWith($menu.data('uctxOriginal'));
                    }
                }
                $this.removeData('uctxEventNamespace');
                $this.removeData('uctxMenu');
                $this.removeData('uctxOptions');
                $this.removeData('uctxEnable');		
            });
        },
        show : function(x, y) {	
            if (!x || !y) {
                $.error('The position for the menu has not been specified');
                return false;
            }
            var $menu = $(this).first().data('uctxMenu');
            methods.hide.apply(this);
            $menu.show();
            $menu.data('uctxMenu', $(this));
            $menu.offset(forceViewport({
                top : y, 
                left: x
            }, $menu, true));	
            return this;	
        },
        hide : function() {
            $.each(menus, function() {
                $('.' + classes.hover, this).removeClass(classes.hover);
                $('ul:first ul', this).hide();
                if ($(this).data('uctxMenu')) {
                    $(this).data('uctxMenu').data('uctxOptions').onHide.call($(this).data('uctxMenu'));
                    $(this).removeData('uctxMenu');
                }
                $(this).hide();
            });
            return this;
        },
        disable : function(item) {
            if (item) {
                var $menu = $(this).data('uctxMenu');
                if (item.charAt(0) === '#') {
                    $('li' + item.replace(/ /g,'_'), $menu).addClass(classes.disabled);
                }
                else {
                    $('a[href="' + item + '"]', $menu).parent().addClass(classes.disabled);
                }
            }
            else {
                $(this).data('uctxEnable', false);
            }
            return this;
        },
        enable : function(item) {
            if (item) {
                var $menu = $(this).data('uctxMenu');
                if (item.charAt(0) === '#') {
                    $('li' + item.replace(/ /g,'_'), $menu).removeClass(classes.disabled);
                }
                else {
                    $('a[href="' + item + '"]', $menu).parent().removeClass(classes.disabled);
                }
            }
            else {
                $(this).data('uctxEnable', true);
                $('li', this).each(function() {
                    $(this).removeClass(classes.disabled);
                });
            }
            return this;	
        }
    },
    forceViewport = function(position, o, mouse) {
        if (position.top) {
            if ((position.top + o.height() - $(window).scrollTop()) > $(window).height()) {
                if (mouse) {
                    position.top = position.top - o.height();
                }
                else {
                    position.top = $(window).height() + $(window).scrollTop() - o.height();
                }
            }
            if (position.top < $(window).scrollTop()) {
                position.top = $(window).scrollTop();
            }
        }
        if (position.left) {
            if ((position.left + o.width() - $(window).scrollLeft() > $(window).width())) {
                position.left = $(window).width() - o.width() + $(window).scrollLeft();
            }
            if (position.left < $(window).scrollLeft()) {
                position.left = $(window).scrollLeft();
            }
        }
        return position;
    },
    buildMenu = function(children) {
        var ul = $('<ul/>'), entry, item, li;
        if (children) {
            for (entry in children) {
                item = children[entry];
                li = $('<li/>').attr('id' , item.id.replace(/ /g,'_')).append($('<a/>').attr('href', item.action?('#' + item.action):'#').text(item.text));
                if (item.image) {
                    li.prepend($('<img/>').attr('src', item.image));
                }
                if (item.separator) {
                    li.addClass(classes.separator);
                }
                ul.append( li );
                if (item.children) {
                    li.append(buildMenu(item.children));
                }
            }
        }
        return ul;
    };
    $.fn.contextMenu = function(method) {
        if (methods[method]) {
            return methods[ method ].apply(this, Array.prototype.slice.call(arguments, 1));
        }
        else if (typeof method === 'object' || ! method) {
            return methods.init.apply(this, arguments);
        }
        else {
            $.error('Method ' +  method + ' does not exist on jQuery.contextmenu');
            return this;
        }    
    };
})(jQuery);

