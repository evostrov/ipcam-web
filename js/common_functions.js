// Отправить команду на сервер
// Отправка файлов выполняется не здесь, а по клику на submit
function sendCmdAjax(params, callback) {
    var cmd = "/?action=command"
    if (params) {
        for (var key in params) {
            cmd += "&";
            cmd += key;
            cmd += "="
            cmd += params[key];
        }
    }

    $.getJSON(cmd, callback).error( error_handler );
}

// Обработка ошибки getJSON
function error_handler(jqXHR, textStatus, errorThrown) {
    console.log("error " + textStatus);
    console.log("incoming Text " + jqXHR.responseText);

    $('div.span9').empty();

    hide_loader('send');

    myAlert( 'Error', 'Ошибка парсинга ответа сервера', 'alert-error' );
}

// Вывод инфомации об ошибке в контентной области
function myAlert(head, msg, alertClass) {
    $('.alert').remove();
    $('<div id="myAlert" class="alert alert-block fade in"><button type="button" class="close" data-dismiss="alert">×</button><h3>' + head + '</h3><p>' + msg + '</p></div>').addClass(alertClass).appendTo( $('div.span9') );
    $('#myAlert').alert();
    $('#myAlert').delay(60000).fadeOut(400);
}

function show_loader(type, msg) {
    $('#loaderModal').css({
        width: 'auto',
        'text-align': 'center',
        'margin-left': function () {
            return -($(this).width() / 2);
        }
    }).modal({
        keyboard: 'false',
        backdrop: 'static'
    });

    $('#loaderModalBody').prepend(
        $('<span class="modal_msg">' + msg + '</span>').css({
            display: 'block',
            'margin-bottom': '5px',
        })
    );

    $('#loaderModal').modal('show');
}

function hide_loader(type) {
    //хак для скрытия элементов страницы при инициализации
    if ( type == 'init' ) {
        $('div.startLoaderWrap').css({ display: 'none' });
    }

    $('#loaderModal').modal('hide');

    $('span.modal_msg').remove();
}

//Создать HTML кода элемента
function myCreateElement(name, attrs, style, text) {
    var e = document.createElement(name);
    if (attrs) {
        for (var key in attrs) {
            if (key == 'class') {
                e.className = attrs[key];
            } else if (key == 'id') {
                e.id = attrs[key];
            } else {
                e.setAttribute(key, attrs[key]);
            }
        }
    }
    if (style) {
        for (key in style) {
            e.style[key] = style[key];
        }
    }
    if (text) {
        e.appendChild(document.createTextNode(text));
    }
    return e;
}

// Получить host name текущего устройства
function get_host_name() {
    return document.domain == 'localhost' ? '127.0.0.1' : document.domain;
}