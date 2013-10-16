$(document).ready(function() {
    $('#accordion_params .accordion-body').collapse({
      toggle: false
    });
    //$('#accordion1 .accordion-body').collapse('show');

    // Анимация инициализации
    show_loader('init', 'Загрузка');

    // Запрос списка каналов
    sendCmdAjax( {'COMMAND': 'CMD_GET_CHANNELS_LIST'}, addChannels );
});

// ===================================================
//  Подпункты левого меню
//
// ===================================================
$('.nav-list li').live('click', function(){
    // Выбор активного пункта меню
    $('#accordion1 li').removeClass("active");
    $(this).toggleClass('active');
    // Очистка контентной области
    $('div.span9').empty();
    // Включить анимацию отправки данных
    show_loader( 'send', 'Сохранение изменений' );
    // Отправка запроса параметров модуля
    sendCmdAjax( {'COMMAND': 'CMD_GET_PARAMS', 'CHANNEL_ID': $(this).attr('chanid'), 'MODULE_NAME': $(this).attr('modname') }, addParams );
    // Сохранить выбранный модуль
    curMod = $(this).attr('modname');
    curChanID = $(this).attr('chanid');
});

// ===================================================
//  Пункты левого меню
//
// ===================================================
$('#accordion1 .accordion-heading').live('click', function(event){
    sendCmdAjax( {'COMMAND': 'CMD_GET_MODULES_LIST', 'CHANNEL_LIST_ID': this.id }, addModules ); //Отправка команды на получение списка модулей канала
});

// ===================================================
//  Кнопки управления параметрами
//
// ===================================================
$('.param_btn').live('click', function(event){

    // Включить анимацию отправки данных
    show_loader( 'send', $(this).attr('id') );

    sendCmdAjax(
        { 'COMMAND': $(this).attr('id') },
        function(data) {
            // Очистка контентной области
            $('div.span9').empty();
            // Удалить анимацию отправки и показать таблицу с параметрами
            hide_loader('send');

            // Если запрос выполнен успешно
            if ( check_result(data) ) {
                sendCmdAjax( {'COMMAND': 'CMD_GET_PARAMS', 'CHANNEL_ID': curChanID, 'MODULE_NAME': curMod }, addParams );
            }
            else {
                myAlert( data.RESULT.VALUE.TEXT.VALUE, data.RESULT.VALUE.MESSAGE.VALUE, 'alert-error' );
            }
        }
    );

    return false;
});
$('.file_button').live('click', function(event){
    getFile( $(this).attr('id') );
    return false;
});

// ===================================================
//  Обработка ввода данных в обычный инпут
//  для ограничения возможных введеных символов
//
// ===================================================
$('#params_div input').live('keydown', function(event) {
    var keyCode;
    if ( event.keyCode >= 96 && event.keyCode <= 105 ) {
        keyCode = event.keyCode - 48;
    } else {
        keyCode = event.keyCode;
    }
    var val = String.fromCharCode( keyCode );

    // спец. сочетание - не обрабатываем
    if ( event.ctrlKey || event.altKey || event.metaKey || event.shiftKey ) return;
    if ( keyCode < 48 ) return; // спец. символ - не обрабатываем

    var param_group_name = $(this).parents('table').attr('id');
    var param_name = $(this).attr('id');
    var type = curParams
                .get_group_params(param_group_name)
                .get_param(param_name)
                .get_type();
    return DATA_TYPES[type].ALLOW_CHARS.test( val );
})

// ===================================================
//  Изменение инпутов, чекбоксов
//
// ===================================================
$('#params_div input').live('change', function() {

    // ========================  Выбор файла для загрузки
    if ( $(this).attr('class') == 'input_file' ) {
        var fileTitle = this.value;

        reWin = /.*\\(.*)/;
        fileTitle = fileTitle.replace(reWin, "$1");
        reUnix = /.*\/(.*)/;
        fileTitle = fileTitle.replace(reUnix, "$1");

        var input = $( '#' + $(this).attr('for') )[0];
        input.value = fileTitle;

        return 1;
    }

    // ========================  Остальные параметры
    // Удалить сообщения об ошибках
    $(this).parent().removeClass( 'error' );
    $(this).parent().find('.help-inline').remove();

    var param_group_name = $(this).parents('table').attr('id');
    var param_name = $(this).attr('id');
    var param = curParams
                .get_group_params(param_group_name)
                .get_param(param_name);
    var cur_param_type = param.get_type();

    // Если цифровой или строковый инпут
    if (
        cur_param_type == "DWORD"  || cur_param_type == "WORD"  || cur_param_type == "INT32"  ||
        cur_param_type == "INT64"  || cur_param_type == "FLOAT" || cur_param_type == "DOUBLE" ||
        cur_param_type == "STRING" || cur_param_type == "DATETIME"
    ) {
        // Проверка соответсвия всего выражения формату
        if( ! DATA_TYPES[ cur_param_type ].FORMAT.test( this.value ) )    {
            // Если нет, то добавить сообщение об ошибке
            if ( !$(this).parent().is( '.error' ) ) {
                $(this).parent().addClass( 'error' );
                $(this).parent().append( '<span class="help-inline">' +  DATA_TYPES[ cur_param_type ].HINT + '</span>' );
            }
            return false;
        } else {
            // Проверка превышения границ значений
            if ( $(this).attr( 'for' ) == 'slider' ) {
                // Проверить превышение границ диапозона значений, если есть превышение, то значение прировнять к граничному
                if ( parseInt( this.value ) < parseInt( param.get_attr('MIN') ) ) {
                    this.value = param.get_attr('MIN');
                } else if ( parseInt( this.value ) > parseInt( param.get_attr('MAX') ) ) {
                    this.value = param.get_attr('MAX');
                }
                // Установить значение слайдера равное значению инпута
                $(this).parent().find('#slider-range-min').slider( "value", this.value );
            } else if ( parseInt( this.value ) < parseInt( DATA_TYPES[ cur_param_type ].MIN ) ) {
                $(this).parent().addClass( 'error' );
                $(this).parent().append( '<span class="help-inline">Минимальное значение для этого параметра: ' + DATA_TYPES[ cur_param_type ].MIN + '</span>' );
                this.value = DATA_TYPES[ cur_param_type ].MIN;
            } else if ( parseInt( this.value ) > parseInt( DATA_TYPES[ cur_param_type ].MAX ) ) {
                $(this).parent().addClass( 'error' );
                $(this).parent().append( '<span class="help-inline">Максимальное значение для этого параметра: ' + DATA_TYPES[ cur_param_type ].MAX + '</span>' );
                this.value = DATA_TYPES[ cur_param_type ].MAX;
            }

            // Добавление милисекунд для DATETIME
            if ( cur_param_type == "DATETIME" ) {
                this.value = this.value + ':0.000';
            }
        }

        newParams.get_group_params(param_group_name).get_param(param_name).set_attr( 'VALUE', this.value );
    }
    else if ( cur_param_type == "BOOL" ) { // Если чекбокс
        newParams.get_group_params(param_group_name).get_param(param_name).set_attr( 'VALUE', this.checked );
    }

    // Сделать кнопку сохранения изменения активной
    $('#saveBtn').removeClass('disabled').removeAttr('disabled');

    return true;
})

// ===================================================
//  Изменение параметра типа: многострочный текст
//
// ===================================================
$('#params_div textarea').live('change', function() {
    // Удалить сообщения об ошибках
    $(this).parent().removeClass( 'error' );
    $(this).parent().find('.help-inline').remove();

    var param_group_name = $(this).parents('table').attr('id');
    var param_name = $(this).attr('id');
    var param = curParams
                .get_group_params(param_group_name)
                .get_param(param_name);
    var cur_param_type = param.get_type();

    // Проверка соответсвия всего выражения формату
    if( ! DATA_TYPES[ cur_param_type ].FORMAT.test( this.value ) )    {
        // Если нет, то добавить сообщение об ошибке
        if ( !$(this).parent().is( '.error' ) ) {
            $(this).parent().addClass( 'error' );
            $(this).parent().append( '<span class="help-inline">' +  DATA_TYPES[ cur_param_type ].HINT + '</span>' );
        }
        return false;
    }

    newParams.get_group_params(param_group_name).get_param(param_name).set_attr( 'VALUE', this.value );

    // Сделать кнопку сохранения изменения активной
    $('#saveBtn').removeClass('disabled').removeAttr('disabled');

    return true;
})

// ===================================================
//  Изменения параметра типа "Выпадающий список"
//
// ===================================================
$('#params_div select').live('change', function() {
    var param_group_name = $(this).parents('table').attr('id');
    var param_name = $(this).attr('id');
    var param = curParams
                .get_group_params(param_group_name)
                .get_param(param_name);

    newParams.get_group_params(param_group_name).get_param(param_name).set_attr( 'VALUE', this.value );
    $('#saveBtn').removeClass('disabled').removeAttr('disabled');

    return true;
})

// ===================================================
//  Сохранить изменения
//
// ===================================================
$('#saveBtn').live('click', function () {
    if ( !$(this).is('.disabled') ) {

        // Включить анимацию отправки данных
        show_loader( 'send', 'Сохранение изменений' );

        // Отправить команду на установку параметров
        var cmd = {};
        cmd['COMMAND'] = 'CMD_SET_PARAMS';
        cmd['CHANNEL_ID'] = "dw:" + curChanID;
        cmd['MODULE_NAME'] = "s:'" + curMod + "'";

        for ( var group in newParams.keys ) {
            params = newParams.get_group_params( group );

            $.each( params.get_data_params(), function(key, val) {
                if ( val.TYPE == 'STRING' || val.TYPE == 'TEXT' || val.TYPE == 'DATETIME' )  {
                    cmd[key] = DATA_TYPES[ val.TYPE ].ABBREVIATED_NAME + ":'" + encodeURIComponent(val.VALUE) + "'";
                } else {
                    cmd[key] = DATA_TYPES[ val.TYPE ].ABBREVIATED_NAME + ":" + encodeURIComponent(val.VALUE);
                }
            });
        }

        sendCmdAjax( cmd, cbSetParams );
    }
});

// ===================================================
//  Отмена изменений параметра
//
// ===================================================
$('#returnArrow').live('click', function () {
    // Поиск и получение соответствующего инпута
    var input = $( '#' + $(this).attr('for') )[0];
    var parent = $(input).parent()[0];

    var param_group_name = $(input).parents('table').attr('id');
    var param_name = $(this).attr('for');
    var param = curParams
                .get_group_params(param_group_name)
                .get_param(param_name);
    var cur_param_type = param.get_type();

    // Отмена изменений
    // Если выбранный инпут типа селект
    if ( input.tagName == 'SELECT' && input.value != param.get_attr('VALUE') ) {
        // Найти опцию с соответствующим значением и установить выбранной
        var i = 0;
        while ( i < input.childNodes.length && input.childNodes[i].value != param.get_attr('VALUE') ) {
            i++;
        }
        if ( i == input.childNodes.length ) {
            myAlert( 'ERROR', 'Неправильное значение опции списка', 'alert-error' );
            console.log( 'ERROR: Попытка установить выбранным значение ' + param.get_attr('VALUE') + ', которого нет в списке опций селекта' );
        }
        else {
            // Отменить изменения в форме
            input.childNodes[i].selected = true;

            // Отменить изменения в переменных
            newParams.get_group_params(param_group_name).get_param(param_name).set_attr( 'VALUE', param.get_attr('VALUE') );
        }
    }
    // Checkbox
    else if ( input.type == 'checkbox' && input.checked != param.get_attr('VALUE') ) {
        // Отменить изменения в форме
        input.checked = param.get_attr('VALUE');

        // Отменить изменения в переменных
        newParams.get_group_params(param_group_name).get_param(param_name).set_attr( 'VALUE', param.get_attr('VALUE') );
    }
    // Все остальные инпуты
    else if ( input.value != param.get_attr('VALUE') ) {
        input.value = param.get_attr('VALUE');

        // Отменить изменения в переменных
        newParams.get_group_params(param_group_name).get_param(param_name).set_attr( 'VALUE', param.get_attr('VALUE') );

        // Сгенерировать событие change для изменения значения слайдера
        $(input).trigger('change');
    }
});

// ===================================================
//  Свернуть/Развернуть секцию
//
// ===================================================
$('a.toggle_btn').live('click', function () {
    if ( $( $(this).attr('data-target') ).is('.in') ) {
        $(this).html('Свернуть');
    }
    else {
        $(this).html('Развернуть');
    }
});

// Обработка ответа команды SET_PARAMS
function cbSetParams(data) {

    // Удалить анимацию отправки и показать таблицу с параметрами
    hide_loader('send');

    // Вывести сообщение с результатом операции
    if ( !data.RESULT ) {
        myAlert( 'ERROR', 'Неверный формат ответа', 'alert-error' );

    } else if (data.RESULT.VALUE.CODE.VALUE == 0) { // Успешное сохранение изменений

        myAlert( data.RESULT.VALUE.TEXT.VALUE, data.RESULT.VALUE.MESSAGE.VALUE, 'alert-success' );

        // Деактивация кнопки "Сохранить изменения"
        $( '#saveBtn' ).addClass('btn disabled').attr( 'disabled', 'disabled' );

        // Установить дефолтные значения в отправленные
        curParams = null;
        curParams = $.extend( true, curParams, newParams ); // Рекурсивное клонирование объекта
    }
    else { // fail
        myAlert( data.RESULT.VALUE.TEXT.VALUE, data.RESULT.VALUE.MESSAGE.VALUE, 'alert-error' );
    }
}

function add_table_container(prefix, header, parent) {
    var section_id  = prefix + 'Section';
    var table_id    = prefix;

    var $section
        = $('<section id="' + section_id + '"></section>')
            .appendTo( parent );

    // Заголовок таблицы
    // var $section_header
    //     = $('<div></div>')
    //         .addClass('page-header row-fluid')
    //         .appendTo( $section );

    // $('<div class="span10"><h1>'+ header +'</h1></div>').appendTo( $section_header );

    // Кнопка "Свернуть"
    // $('<div class="span2 section_toogle_btn"><a href="" class="toggle_btn" onclick="return false;" data-toggle="collapse" data-target="#'+prefix+'_collapse">Свернуть</a></div>').appendTo( $section_header );

    var $section_collapse
        = $('<div id="'+prefix+'_collapse" class="collapse in"></div>').appendTo( $section );

    return $('<table></table>')
        .addClass('table table-bordered table-striped')
        .attr('id', table_id )
        .appendTo( $section_collapse );
}

// Создание HTMl кода для параметров камеры
function addParams(data) {

    // Удалить анимацию отправки и показать таблицу с параметрами
    hide_loader('send');

    // Если запрос выполнен успешно
    if ( check_result(data) ) {
        if ( ! check_data(data) ) {
            $('div.span9').empty();
            myAlert( 'ERROR', Error_code, 'alert-error' );
            return;
        }

        var parent = $('<div></div>').attr( 'id', 'params_div' ).appendTo( $('div.span9') );
        var $accordion = $('<div class="content-padding accordion" id="accordion2"></div>').appendTo(parent);

        // Сохранение данных в объект.
        curParams = new ParamGroups(data);
        newParams = new ParamGroups(data);

        var sorted_groups = curParams.get_sorted_keys();

        for ( var i in sorted_groups ) {
            var group_key = sorted_groups[i];
            var group = curParams.keys[ group_key ];

            // ================== Создание таблицы параметров
            var params = curParams.get_group_params(group_key);
            var sorted_keys = params.get_sorted_keys();

            var $accordion_group = $('<div class="accordion-group"></div>').appendTo($accordion);
            var $accordion_heading = $('<div class="accordion-heading"></div>').appendTo($accordion_group);

            if ( ! $.isEmptyObject( params.keys ) ) {

                // Добавление заголовка группы в аккордеон
                $('<a>' + curParams.get_group_comment(group_key) + '</a>').attr( 'class', 'accordion-toggle' )
                    .attr( 'data-toggle', 'collapse' )
                    .attr( 'data-parent', '#accordion2' )
                    .attr( 'href', '#collapse_' + group_key )
                    .appendTo($accordion_heading);

                var $accordion_body = $('<div id="collapse_' + group_key + '" class="accordion-body collapse"></div>').appendTo($accordion_group);
                if ( i == 0 ) $accordion_body.attr( 'class', 'in' );
                var $accordion_inner = $('<div class="accordion-inner"></div>').appendTo($accordion_body);

                // Создание контейнера для таблицы
                var table = add_table_container( group_key, curParams.get_group_comment(group_key), $accordion_inner );
                var $t_header = $('<thead></thead>').appendTo( table );
                var $tr  = $( '<tr></tr>' ).appendTo( $t_header );
                var $th1 = $( '<th>Параметр</th>' ).appendTo( $tr );
                var $th2 = $( '<th>Значение</th>' ).appendTo( $tr );
                if ( params.has_cancelable_params() ) {
                    var $th3 = $( '<th>Сбросить</th>' ).appendTo( $tr );
                }
                else {
                    $th2.attr( 'colspan', 2 );
                }
                $( '<tbody></tbody>' ).appendTo( table );

                // Заполнение таблицы с параметрами
                for ( var i in sorted_keys ) {
                    var key = sorted_keys[i];
                    var param = params.get_param(key);

                    if ( ! $.isEmptyObject( param ) ) {
                        // Создать ряд таблицы
                        var row = $('<tr></tr>').appendTo( $('#' + group_key + ' tbody') );

                        // Добавить название параметра в таблицу
                        $('<td><span>'+ param.get_comment(key) +'</span></td>')
                            .addClass('col1').appendTo( row );

                        // Создать и добавить контрол для параметра
                        var control_group = $('<td class="control-group"></td>')
                            .addClass('col2').appendTo( row );

                        addControl(control_group, key, param);

                        // Создать и добавить кнопку "отменить"
                        if ( param.is_cancelable() ) {
                            control_group = $('<td></td>').addClass('col3').appendTo(row);
                            $( '<a href="#content"><span id="returnArrow" for="' + key + '" class="ui-icon ui-icon-arrowreturnthick-1-w"></span></a>' ).appendTo(control_group);
                        }
                        else {
                            $(control_group).attr( 'colspan', 2 );
                        }
                    }
                }
            }
        }

        // Создать и добавить кнопку "Сохранить изменения"
        // TODO Иногда она не нужна
        $('<button>Сохранить изменения</button>')
            .addClass('btn disabled')
            .attr('id', 'saveBtn')
            .attr( 'disabled', 'disabled' )
            .appendTo( parent );
    }
    else {
        myAlert( data.RESULT.VALUE.TEXT.VALUE, data.RESULT.VALUE.MESSAGE.VALUE, 'alert-error' );
    }
}

// Добавить control для параметра
// parent - элемент родитель для добавления
// paramName - имя параметра
// attrs - экземпляр объекта с аттрибутами параметра камеры
function addControl(parent, paramName, attrs) {
    if ( ! attrs ) { return };

    if (attrs.hasOwnProperty("ENUM")) {
        // Создание селекта для любого типа с полем ENUM

        // Создать и добавить элемент
        $('<select class="input-large" id="' + paramName + '">').appendTo(parent);

        // Добавить опции селекта
        for (var key in attrs.ENUM) {
            var opt = $('<option>' + attrs.ENUM[key] + '</option>').appendTo('select#' + paramName);
            if ( attrs.ENUM[key] == attrs.VALUE ) {
                opt.attr('selected', 'selected');
            }
        }
    }
    else if ( attrs.TYPE == "BOOL" ) {
        // Создание CheckBox

        // Создать и добавить элемент
        var checkbox = $( '<input type="checkbox" id="' + paramName + '">' ).appendTo(parent);

        // Инициализация
        checkbox[0].checked = attrs.VALUE;
    }
    else if (attrs.hasOwnProperty("MIN") && attrs.hasOwnProperty("MAX")) {
        // Создание обычного инпута со слайдером для цифровых тпиов
        if ( attrs.VALUE >= attrs.MIN && attrs.VALUE <= attrs.MAX ) {

            // Создать и добавить инпут
            $('<input type="text" for="slider" class="input-small" id="' + paramName + '">').attr( 'value', attrs.VALUE ).appendTo(parent);

            // Добавление ползунка
            parent = $('<div></div>').addClass('sliderWrap').appendTo(parent);
            $('<div id="slider-range-min"></div>').appendTo(parent).slider({
                    range: "min",
                    value: attrs.VALUE,
                    min:   attrs.MIN,
                    max:   attrs.MAX,
                    step:  attrs.STEP || 1,
                    slide: function( event, ui ) {
                        $( 'input#' + paramName ).val( ui.value );
                        $( 'input#' + paramName ).trigger('change');
                    }
            });
        } else {
            $('div.span9').empty();
            myAlert( 'Error', 'Не корректные входные данные. Value находится за диапозоном значений MIN MAX', 'alert-error' );
            return;
        }
    }
    else if ( attrs.TYPE == "BUTTON" ) {
        if ( attrs.hasOwnProperty("ENUM") ) {
            // TODO несколько кнопок
        }
        else {
            // TODO удалить если отправка команд через get рулит
            // var form =
            //     $('<form style="margin: 0;"></form>')
            //         .attr( 'id', paramName + '_form' )
            //         .attr( 'action', paramName )
            //         .attr( 'method', 'post' )
            //         .appendTo(parent);

            // $('<button class="btn">' + attrs.VALUE + '</button>')
            //     .appendTo(form);

            // var options = {
            //     beforeSubmit: function() {
            //         show_loader( 'send', attrs.VALUE ); // TODO выводить мессеседж параметра
            //     },
            //     success:   cbSetParams,
            //     error:     error_handler,
            //     type:      'post',
            //     dataType:  'json',
            //     resetForm: true
            // };
            // // bind form using 'ajaxForm'
            // $(form).ajaxForm(options);

            var btn = $('<button>' + attrs.VALUE + '</button>')
                .attr( 'id', paramName )
                .attr( 'class', 'param_btn' )
                .appendTo(parent);
        }
    }
    else if ( attrs.TYPE == "FILE_BUTTON" ) {
        var btn = $('<button>' + attrs.VALUE + '</button>')
            .attr( 'id', paramName )
            .attr( 'class', 'file_button' )
            .appendTo(parent);
    }
    else if ( attrs.TYPE == "FILE" ) {
        var input_file;
        if ( $.browser.msie ) {
            input_file = $('<input type="file" name="file">');
        }
        else {
            $('<input type="text" class="input-xlarge">')
                .attr( 'value', ''     )
                .attr( 'id', paramName )
                .appendTo( parent      );

            input_file = $('<div class="input_file_wrap"><button class="btn browse_btn">...</button><input type="file" name="file" size="1" for="' + paramName + '" class="input_file"></div>');

            input_file
                .attr( 'for', paramName );
        }

        var form =
            $('<form style="margin: 0;"></form>')
                .attr( 'id', paramName + '_form' )
                .attr( 'action', paramName )
                .attr( 'method', 'post' )
                .attr( 'enctype', 'multipart/form-data' )
                .appendTo(parent);

        input_file.appendTo(form);

        $('<button class="btn submit_btn">Отправить</button>')
            .appendTo(form);

        var options = {
            beforeSubmit: function() {
                show_loader( 'send', 'Обновление прошивки' ); // TODO выводить мессеседж параметра
            },
            success:   cbSetParams,
            error:     error_handler,
            type:      'post',
            dataType:  'json',
            resetForm: true
            // $.ajax options can be used here too, for example:
            // timeout:   3000
        };

        // bind form using 'ajaxForm'
        $(form).ajaxForm(options);
    }
    else if ( attrs.TYPE == "TEXT" ) {
        // Многострочный инпут
        var textarea = $('<textarea rows="5" class="textarea-large">' + attrs.VALUE + '</textarea>')
            .attr( 'id', paramName )
            .appendTo(parent);
    }
    else {
        // Создание обычного инпута для чисел, строки и даты
        var input = $('<input type="text" >')
            .attr( 'id', paramName )
            .appendTo(parent);

        // Инициализация календаря
        if ( attrs.TYPE == 'DATETIME' ) {
            $( 'input#' + paramName ).datetimepicker();
            input.datepicker( "option", "dateFormat", "dd/mm/yy" );
        }

        // После указания формата для datepicker формата
        input.attr( 'value', attrs.VALUE );

        // Определить размер поля в зависимости от типа данных
        if ( attrs.TYPE == 'STRING' ) {
            input.addClass('input-xlarge');
        }
        else if ( attrs.TYPE == 'DATETIME' ) {
            input.addClass('input-medium');
        }
        else {
            input.addClass('span3');
        }
    }
}

//Добавить модули в меню
function addModules(data) {
    if (data.RESULT.VALUE.CODE.VALUE == 0) {
        var chanId;
        if (data.CHANNEL_LIST_ID) {
            chanId = data.CHANNEL_LIST_ID.VALUE;
            $('#accordion-group' + chanId + ' ul').empty();
            $.each(data.MODULES_LIST.ENUM, function(key, val){
                $('<li></li>').attr('chanId', chanId).attr('modName', val.NAME.VALUE).appendTo($('#accordion-group' + chanId + ' ul'));
                $('<a>'+val.COMMENT.VALUE+'</a>').attr('href', '#content').appendTo($("[modName = "+val.NAME.VALUE+"][chanId = "+chanId+"]")); // $('<a>'+val.NAME.VALUE+'</a>').attr('href', '#').appendTo($("[modName = "+val.NAME.VALUE+"][chanId = "+chanId+"]"));
            });
        }
        else { alert('Нет номера канала'); }


        // Если collapse раскрыт пересчитать высоту под загруженный контент
        if ( $('#collapse' + chanId).is('.in') ) {
            $('#collapse' + chanId).height( $('#accordion-group' + chanId + ' ul').height() + 19 );
        }

        // Сохранение всего списка модулей
        modules = data;
    } else {
        $('<div><h3>' + data.RESULT.VALUE.TEXT.VALUE + '</h3><p>' + data.RESULT.VALUE.MESSAGE.VALUE + '</p></div>').appendTo( $('div.span9') );
    }

    // Отключить анимацию загрузки
    $('#accordion-group' + chanId + ' div.modLoader').hide();
}

//Создание акордеона с каналами, подготовка контейнера для меню модулей
function addChannels(data) {
    if (data.RESULT.VALUE.CODE.VALUE == 0) {
        $.each(data.CHANNELS_LIST.ENUM, function(key, val) {
            var parent = document.getElementById('accordion1');
            parent.appendChild(myCreateElement('div',
              {'class': 'accordion-group', 'id': 'accordion-group' + val.ID.VALUE }));

            parent = document.getElementById( 'accordion-group' + val.ID.VALUE );
            parent.appendChild(myCreateElement('div',
              {'class': 'accordion-heading', 'id': val.ID.VALUE }));
            parent.appendChild(myCreateElement('div',
              {'class': 'accordion-body collapse', 'id': 'collapse' + val.ID.VALUE },
              {'height': '0px'} )); //  {'height': 'auto', 'display': 'none'} ));

            parent = document.getElementById( val.ID.VALUE );
            parent.appendChild(myCreateElement('a',
              {'class': 'accordion-toggle', 'data-toggle': 'collapse', 'data-parent':'#accordion1', 'href':'#collapse' + val.ID.VALUE },
              {},
              val.COMMENT.VALUE ));//'Channel #' + val.ID.VALUE ));

            $('<div></div>').addClass('accordion-inner').appendTo($('#accordion-group' + val.ID.VALUE + ' > #collapse' + val.ID.VALUE ));
            $('<ul></ul>').addClass('nav nav-list').appendTo($('#accordion-group' + val.ID.VALUE + ' > #collapse' + val.ID.VALUE + ' > .accordion-inner'));
            $('<div></div>').addClass('modLoader').appendTo($('#accordion-group' + val.ID.VALUE + ' div.accordion-inner'));
        });
        // Сохранение всего списка модулей
        channels = data;
    } else {
        $('<div><h3>' + data.RESULT.VALUE.TEXT.VALUE + '</h3><p>' + data.RESULT.VALUE.MESSAGE.VALUE + '</p></div>').appendTo( $('div.span9') );
    }

    // Отключить анимацию инициализации
    hide_loader('init');
}
