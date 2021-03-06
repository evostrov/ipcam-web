
// ========================= Video =========================
var widthRes = 0;
var heightRes = 0;
var resizeBtn = true;

function fullScrin(){
    $(window).scrollTop(0);
    var pObj = $('#video_container');
    var pObjEmbd = $('#video_embed');
    widthRes = 320; //pObjEmbd.width();
    heightRes = 240; //pObjEmbd.height();
    pObj.css("position", "absolute");
    pObj.css("z-index", "8999");
    pObj.width(video_embed.picwidth);
    pObj.height(video_embed.picheight);
    pObjEmbd.width(video_embed.picwidth);
    pObjEmbd.height(video_embed.picheight);
}
function miniScrin(){
    var pObj = $('#video_container');
    var pObjEmbd = $('#video_embed');
    pObj.css({left:'', top:''});
    pObj.width(widthRes);
    pObj.height(heightRes);
    pObjEmbd.width(widthRes);
    pObjEmbd.height(heightRes);
    pObj.css("position", "");
    pObj.css("z-index", "");
}
function ResizeEmbed(){
    ScreenEmbed4();
    video_embed.Resize();
}

function ScreenEmbed1(){
    $(window).scrollTop(0);
    var pObjEmbd = $('#video_embed');
    pObjEmbd.width(video_embed.picwidth*2);
    pObjEmbd.height(video_embed.picheight*2);
}
function ScreenEmbed2(){
    $(window).scrollTop(0);
    var pObjEmbd = $('#video_embed');
    pObjEmbd.width(video_embed.picwidth);
    pObjEmbd.height(video_embed.picheight);
}
function ScreenEmbed3(){
    $(window).scrollTop(0);
    var pObjEmbd = $('#video_embed');
    pObjEmbd.width(video_embed.picwidth/2);
    pObjEmbd.height(video_embed.picheight/2);
}
function ScreenEmbed4(){
    $(window).scrollTop(0);
    var pObjEmbd = $('#video_embed');
    pObjEmbd.width(320);
    pObjEmbd.height(240);
}
function ScreenNewURL(url){
    $(window).scrollTop(0);
    $('#video_embed').attr( 'url', url);
}

// ========================= Page logic =========================
$(document).ready(function() {
    // ������ �����
    add_video_control_form();

    video_capture_start( get_url_from_vc_form() );

    // �������� �������������
    show_loader('init', '��������');

    // ��������� �������� �������������
    hide_loader('init');
});

// ��������� ������ ������� SET_PARAMS
function cbSetParams(data) {

    // ������� �������� �������� � �������� ������� � �����������
    hide_loader('send');

    // ������� ��������� � ����������� ��������
    if ( !data.RESULT ) {
        myAlert( 'ERROR', '�������� ������ ������', 'alert-error' );

    } else if (data.RESULT.VALUE.CODE.VALUE == 0) { // �������� ���������� ���������

        myAlert( data.RESULT.VALUE.TEXT.VALUE, data.RESULT.VALUE.MESSAGE.VALUE, 'alert-success' );

        // ����������� ������ "��������� ���������"
        $( '#saveBtn' ).addClass('btn disabled').attr( 'disabled', 'disabled' );

        // ���������� ��������� �������� � ������������
        curParams = null;
        curParams = $.extend( true, curParams, newParams ); // ����������� ������������ �������
    }
    else { // fail
        myAlert( data.RESULT.VALUE.TEXT.VALUE, data.RESULT.VALUE.MESSAGE.VALUE, 'alert-error' );
    }
}

// ��������� �����
function add_video_control_form() {
    // TODO �������� ����
    var host = get_host_name();

    // TODO ��������� ���������� ����
    var port = 8554;

    // TODO ��������� �����
    var channel = "ch1";

    // �������� ������
    $('<input type="text" class="input-small">')
        .attr( 'value', host )
        .attr( 'id', 'host' )
        .appendTo(
            $('#server_settings')
        );

    $('<input type="text" class="input-small">')
        .attr( 'value', port )
        .attr( 'id', 'port' )
        .appendTo(
            $('#server_settings')
        );

    $('<input type="text" class="input-small">')
        .attr( 'value', channel )
        .attr( 'id', 'channel' )
        .appendTo(
            $('#server_settings')
        );

    var $btn_group = $('<div class="btn-group"></div>').appendTo( $('#video_control') );
    $('<input type="button" class="btn" value="Start">')
        .attr( 'id', 'url_change_btn' )
        .attr( 'onclick', 'video_capture_start( get_url_from_vc_form() );' )
        .appendTo( $btn_group );

    $('<input type="button" class="btn" value="Stop">')
        .attr( 'id', 'url_change_btn' )
        .attr( 'onclick', 'video_capture_stop();' )
        .appendTo( $btn_group );
}

// ��������� ����� � ����������� �� �����
function get_url_from_vc_form() {
    return 'rtsp://admin:admin@' + $('#host').val() +
        ':' + $('#port').val() +
        '/' + $('#channel').val();
}

// ��������� ��������� �����
function video_capture_start(url) {
    video_capture_stop();

    $(
        '<embed id="video_embed" ' +
        'type="application/mozilla-npivrtsp-scriptable-plugin" ' +
        'width=320 height=240 ' +
        'url="' + url + '" ' +
        'autostart="true">'
    ).appendTo( $('#video_container') );
}

function video_capture_stop() {
    $('#video_container').empty();
}
