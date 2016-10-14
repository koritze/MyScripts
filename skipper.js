$(document).ready(function() {
    var url = location.pathname;
    var info = url.split("/");
    counter = false;
    timeout = 30;
    current_rating = ['0', '0', false];
    watched = false;
    download = {};
    oldcss = [];
    season = 1;
    episode = '';
    if (info.length == 7) {
        season = info[4];
        episode = info[6];
        preLoad(false);
    }
    $("#season li").click(function(e) {
        e.preventDefault();
        season = $(this).data('season');
        $("#season li").removeClass('selected');
        $(this).addClass('selected');
        if (typeof window.history.pushState === 'function')
            window.history.pushState('', '', $(this).children().attr('href'));
        $.post("/ajax/watch", {
            episodeList: true,
            serie: SID,
            season: season
        }, function(data) {
            $html = '';
            if (data == null)
                $html = "אין פרקים בעונה זו";
            else {
                $(data).each(function(i) {
                    var $props = '';
                    if (this.watched == true)
                        $props += 'class="watched"';
                    if (this.quality >= 720)
                        $props += ' data-quality="' + this.quality + '"';
                    $txt = this.episode;
                    if (this.double == true)
                        $txt += " + " + (parseInt(this.episode) + 1);
                    $html += '<li data-episode="' + this.episode + '" ' + $props + '><a href="/watch/' + SID + '-' + Sname[0] + '-' + Sname[1] + '/season/' + season + '/episode/' + this.episode + '">' + $txt + '</a><div>&nbsp;</div></li>';
                });
            }
            $("#episode").html($html);
        }, 'json');
    });
    $("#episode").on('click', 'li', function(e) {
        e.preventDefault();
        episode = $(this).data('episode');
        preLoad(true)
    });
    $("[id*='star_']").click(function() {
        if (current_rating[2] === false) {
            var rating = $(this).attr("id").split('_');
            $.post('/ajax/rate_video', {
                video_id: VID,
                rating: rating[1]
            }, function(rated) {
                if (rated.msg)
                    $("#rating #text").append(" (שגיאה בדירוג: " + rated.msg + ")");
                else {
                    current_rating = [rated.rate, rated.ratedby];
                    setRating(current_rating);
                    $("#rating #text").append(" (תודה שדירגת!)");
                }
            }, "json");
            current_rating[2] = true;
        }
    });
    $("[id*='star_']").mouseover(function() {
        var id = $(this).attr('id').split('_');
        setRating(id[1], true);
    });
    $("#rating").mouseleave(function() {
        setRating(current_rating);
    });
    $("#report").click(function() {
        if ($(this).hasClass('dis')) {
            $(this).qtip('option', 'content.text', 'דווח על פרק זה');
            $("#reportform").fadeOut();
            $(this).removeClass('dis');
        } else {
            $(this).qtip('option', 'content.text', 'בטל דיווח על פרק זה');
            $("#reportform").fadeIn();
            $(this).addClass('dis');
        }
    });
    $("#submit_report").click(function() {
        var msg = $("#report_message").val();
        $.post('/ajax/flag_video', {
            vid: VID,
            msg: msg
        }, function(response) {
            $("#submit_report").hide();
            $("#response").text(response);
        });
    });
    $("#light").click(function() {
        turnLights();
    });
    $("#view").click(function() {
        watched = markWatched(SID, season, episode, watched);
    });
    $("#episode").on('click', 'li div', function(e) {
        e.stopPropagation();
        $episode = $(this).parent().data('episode');
        if ($episode == episode)
            watched = markWatched(SID, season, $episode, watched);
        else {
            $watched = $(this).parent().hasClass('watched');
            markWatched(SID, season, $episode, $watched);
        }
    });
    $("#season li div").click(function(e) {
        e.stopPropagation();
        $season = $(this).parent().data('season');
        $watched = $(this).parent().hasClass('watched');
        markWatched(SID, $season, null, $watched);
    });
    $("article").on('click', '.download', function() {
        $type = $(this).data('quality');
        if (typeof download[$type] == 'undefined') {
            alert('רק מנויים יכולים להוריד פרקים');
            window.open(base_url + '/donate', '_blank', false);
            return false;
        }
        window.open(download[$type], '_blank', '', false);
    });
    $("#loading").on('click', '#proceed', function() {
        $("#loading").fadeOut();
        $("#video, #comments").fadeIn();
        if (cinemaMode == true)
            turnLights();
    });
    $("#report").qtip({
        content: {
            text: 'דווח על פרק זה'
        },
        style: {
            classes: 'qtip-tipsy qtip-shadow qtip-rounded'
        },
        position: {
            at: 'bottom left'
        }
    });
    $("#light").qtip({
        content: {
            text: 'החשך מסך'
        },
        style: {
            classes: 'qtip-tipsy qtip-shadow qtip-rounded'
        },
        position: {
            at: 'bottom left'
        }
    });
    $("#view").qtip({
        content: {
            text: 'סמן פרק כנצפה'
        },
        style: {
            classes: 'qtip-tipsy qtip-shadow qtip-rounded'
        },
        position: {
            at: 'bottom left'
        }
    });
    $("#download").qtip({
        content: {
            text: 'הורד פרק זה'
        },
        style: {
            classes: 'qtip-tipsy qtip-shadow qtip-rounded'
        },
        position: {
            at: 'bottom left'
        }
    });
    $('#episode').on('mouseover', 'li[data-quality]', function(event) {
        var $q = 'HD - ' + $(this).data('quality') + 'P';
        var $text = $q + ' פרק זה זמין לצפייה באיכות';
        if (addon != "2")
            $text = 'למנויים בלבד ' + $text;
        $(this).qtip({
            content: {
                text: $text
            },
            show: {
                event: event.type,
                ready: true
            },
            style: {
                classes: 'qtip-tipsy qtip-shadow qtip-rounded'
            },
            position: {
                at: 'bottom center'
            }
        });
    });
});

function preLoad(fullLoad) {
    $("#loading .title h1").text("נא המתן לטעינת הפרק");
    $("#video, #loading #proceed, #reportform, #useredit").hide();
    $("#loading .download").remove();
    $("#loading").show();
    $("#episode li").removeClass('selected');
    $("#episode a[href='/watch/" + SID + "-" + Sname[0] + "-" + Sname[1] + "/season/" + season + "/episode/" + episode + "']").parent().addClass("selected");
    console.info(VID);
    if (typeof jwplayer("player").getState() != 'undefined' && jwplayer("player").getState() != "IDLE") {
        jwplayer("player").stop();
        jwplayer("player").remove();
    }
    $.post('/ajax/watch', {
        preWatch: true,
        SID: SID,
        season: season,
        ep: episode
    }, function() {}).done(function(r) {
        if (r == 'donor')
            return loadEpisode(fullLoad);
        if (r == '0') {
            $("#loading .title h1").text("שגיאה!");
            $("#loading #txt").html("ארעה שגיאה בטעינת הפרק. נסה לרענן את הדף ולטעון את הפרק שנית.<br />אם שגיאה זו חוזרת על עצמה נא פנה למנהלי האתר באמצעות <a href=\"/feedback\">טופס צור קשר</a>.");
            return false;
        }
        if (counter !== false)
            clearInterval(counter);
        timeout = 30;
        $("#txt").html("<p>נא המתן <b>" + timeout + "</b> שניות לטעינת הפרק.</p>");
        counter = setInterval(function() {
            countdown(fullLoad, r);
        }, 1000);
    }).fail(function() {
        $("#loading .title h1").text("שגיאה!");
        $("#loading #txt").html("ארעה שגיאה בטעינת הפרק. נסה לרענן את הדף ולטעון את הפרק שנית.<br />אם שגיאה זו חוזרת על עצמה נא פנה למנהלי האתר באמצעות <a href=\"/feedback\">טופס צור קשר</a>.");
    });
}

function loadEpisode(fullload, token) {
    if (episode < 0)
        return false;
    $.post("/ajax/watch", {
        watch: fullload,
        token: token,
        serie: SID,
        season: season,
        episode: episode
    }, function() {}, "json").done(function(e) {
        VID = e.VID;
        if (e.error) {
            $("#loading .title h1").text("שגיאה!");
            $("#loading #txt").html(e.error);
            return false;
        }
        var quality = Object.keys(e.watch)[0];
        $.ajax({
            url: "http://" + e.url + "/watch/" + quality + "/" + VID + ".mp4?token=" + e.watch[quality] + "&time=" + e.time,
            method: 'HEAD',
            error: function(xhr) {
                var msg = '';
                switch (xhr.status) {
                    case 0:
                        msg = 'שרת הצפיה אינו זמין. יתכן ששגיאה זו נגרמה עקב עומסים חריגים על שרת הצפייה או בעית תקשורת בין מחשבך לשרת הצפייה.<br />\
         נא בצע/י ריענון לדף זה על מנת לנסות שנית';
                        break;
                    case 400:
                        msg = 'הדפדפן שברשותך אינו שולח פרטים מזהים אודותיו לשרת הצפייה שלנו.<br />\
         נסה/י לבטל את תוספי הדפדפן או לחלופין השתמש/י בדפדפן אחר';
                        break;
                    case 401:
                        msg = 'בכל צפייה בפרק אנו יוצרים עבורך מזהה ייחודי. מזהה זה פג תוקף או שאינו ניתן לאימות.<br />\
         בצע/י ריענון לדף זה על מנת ליצור מזהה חדש.<br />\
         שגיאה זו עלולה להתרחש אם כתובת ה-IP שלך התחלפה לאחר יצירת המזהה הייחודי.<br />\
         וודא/י שאינך גולש מאחורי Proxy / NAT המחליף עבורך כתובות IP.';
                        break;
                    case 404:
                        msg = 'זה מביך, הפרק לא נמצא בשרת הצפייה שלנו.<br />\
         אנו נודה לך אם תוכל לדווח לנו על כך באמצעות <a href=\"/feedback\">טופס צור קשר</a>.';
                        break;
                    case 410:
                        msg = 'בכל צפייה בפרק אנו יוצרים עבורך מזהה ייחודי. מזהה זה פג תוקף, נא בצע/י ריענון לדף זה על מנת ליצור מזהה חדש.';
                        break;
                    case 429:
                        msg = 'עברת את מגבלת הצפייה במקביל.<br />\
         אנו מאפשרים למשמשים ואורחים לצפות בפרק אחד בלבד ברגע נתון (תורמים אינם מוגבלים).<br />';
                        break;
                }
                msg += '<br /><br />\
      מזהה פרק: ' + VID + '<br />\
      שרת: ' + e.url + '<br />\
      שגיאה: ' + xhr.status;
                $("#loading .title h1").text("שגיאה!");
                $("#loading #txt").html(msg);
                return false;
            },
            crossDomain: true,
            xhrFields: {
                withCredentials: true
            }
        }).done(function() {
            $("#txt").text('');
            if (typeof e.download == 'undefined') {
                $('#loading #proceed').after('<button class="download orange">להורדת הפרק</button>');
            } else {
                $.each(e.download, function(quality, key) {
                    download[quality] = "http://" + e.url + "/download/" + quality + "/" + Sname[1] + ".S" + season + "E" + episode + "_" + quality + "P/" + VID + ".mp4?token=" + key + "&time=" + e.time;
                    $('#loading #proceed').after('<button class="download orange" data-quality="' + quality + '">להורדת הפרק (' + quality + 'P)</button>');
                    $('#video #download').data('quality', quality);
                });
            }
            if (download.length < 1) {
                $("#download").qtip('option', 'content.text', 'פרק זה אינו זמין להורדה');
                $("#download").addClass('dis');
            }
            var sources = [];
            $.each(e.watch, function(quality, key) {
                sources.push({
                    "file": "http://" + e.url + "/watch/" + quality + "/" + VID + ".mp4?token=" + key + "&time=" + e.time,
                    "label": quality + 'P'
                });
            });
            if (fullload === true) {
                if (typeof window.history.pushState === 'function')
                    window.history.pushState('', '', "/watch/" + SID + "-" + Sname[0] + "-" + Sname[1] + "/season/" + season + "/episode/" + episode);
                $("title").html("Sdarot.TV סדרות | " + Sname[2] + " עונה " + season + " פרק " + episode + " לצפייה ישירה");
                $("#video .title h1").text(e.heb + " / " + e.eng);
                $("#epinfo #date").text(realDate(e.addtime));
                $("#epinfo #views").text(numberFormat(e.viewnumber));
                $("#epinfo #description p").html(e.description);
                $("#rating #msg").html('');
                $("#report_message").val('');
                $("#response, #useredit_response").text('');
                $("#submit_report").show();
                $("#useredit_heb").val(e.heb);
                $("#useredit_eng").val(e.eng);
                $("#useredit_description").val(e.description);
            }
            current_rating = [e.rate, e.ratedby, false]
            setRating(current_rating);
            if (e.viewed == true) {
                watched = true;
                $("#view").qtip('option', 'content.text', 'סמן פרק כלא נצפה');
                $("#view").addClass('dis');
            } else {
                watched = false;
                $("#view").qtip('option', 'content.text', 'סמן פרק כנצפה');
                $("#view").removeClass('dis');
            }
            jwplayer("player").setup({
                playlist: [{
                    image: tpl_url + "/images/player_bg.png",
                    title: Sname[2] + ' עונה ' + season + ' פרק ' + episode,
                    sources: sources
                }],
                sharing: {
                    heading: 'שיתוף פרק',
                    sites: ['facebook', 'twitter', 'googleplus']
                },
                width: 595,
                height: 527,
                autostart: false,
                primary: 'html5',
                abouttext: 'Sdarot.TV',
                aboutlink: base_url
            });
            jwplayer("player").setVolume(playerVolume);
            jwplayer('player').once('play', function() {
                $.post("/ajax/watch", {
                    count: VID
                });
                var views = $("#views").text().replace(',', '');
                $("#views").text(numberFormat(++views));
            });
            jwplayer('player').once('complete', function() {
                if (autoMarkWatched == true)
                    watched = markWatched(SID, season, episode, false);
                localStorage.removeItem('pos_' + VID);
            });
            window.onunload = function() {
                localStorage.setItem('pos_' + VID, jwplayer().getPosition());
            };
            $("#proceed, .download").show();
        });
    }).fail(function() {
        $("#loading .title h1").text("שגיאה!");
        $("#loading #txt").html("ארעה שגיאה בטעינת הפרק. נסה לרענן את הדף ולטעון את הפרק שנית.<br />אם שגיאה זו חוזרת על עצמה נא פנה למנהלי האתר באמצעות <a href=\"/feedback\">טופס צור קשר</a>.");
    });
}

function turnLights() {
    if ($("#light").hasClass('dis')) {
        $("#light").qtip('option', 'content.text', 'החשך מסך');
        $("#light").removeClass('dis');
        $("body").css('background-color', oldcss['body']);
        $("article").css('box-shadow', oldcss['article']);
        $("#reportform .border").css('background-color', oldcss['border']);
        $("hr").css('box-shadow', oldcss['hr']);
    } else {
        $("#light").qtip('option', 'content.text', 'האר מסך');
        $("#light").addClass('dis');
        oldcss['body'] = $("body").css('background-color');
        oldcss['article'] = $("article").css('box-shadow');
        oldcss['border'] = $("#reportform .border").css('background-color');
        oldcss['hr'] = $("hr").css('box-shadow');
        $("body, .border").css('background-color', '#2F2F2F');
        $("article, hr").css('box-shadow', 'inherit');
    }
}

function markWatched(SID, se, ep, watched) {
    console.log(ep);
    $.ajax({
        url: '/ajax/watch',
        type: 'POST',
        data: {
            SID: SID,
            season: se,
            episode: ep,
            watched: watched
        },
        async: false,
        dataType: 'json',
    }).done(function(r) {
        if (r.changed == true) {
            watched = r.watched;
            if (ep == '') {
                if (watched === false) {
                    $("#season li[data-season='" + se + "']").removeClass('watched');
                    if (season == se)
                        $("#episode li").removeClass('watched');
                } else {
                    $("#season li[data-season='" + se + "']").addClass('watched');
                    if (season == se)
                        $("#episode li").addClass('watched');
                }
            } else {
                if (watched === false) {
                    $("#episode li[data-episode='" + ep + "']").removeClass("watched");
                    if (ep == episode) {
                        $("#view").qtip('option', 'content.text', 'סמן פרק כנצפה');
                        $("#view").removeClass('dis');
                    }
                } else {
                    $("#episode li[data-episode='" + ep + "']").addClass("watched");
                    if (ep == episode) {
                        $("#view").qtip('option', 'content.text', 'סמן פרק כלא נצפה');
                        $("#view").addClass('dis');
                    }
                }
            }
        }
    });
    return watched;
}

function setRating(rating, onlystars) {
    if (!onlystars)
        var onlystars = false;
    $("[id*='star_']").removeClass();
    for (var i = 1; i <= Math.round(rating[0]); i++) {
        var star_sel = $("[id='star_" + i + "']");
        if (i > rating[0])
            $(star_sel).removeClass().addClass('half');
        else
            $(star_sel).removeClass().addClass('full');
    }
    if (onlystars === false)
        $("#rating #text").text(rating[0] + "/5, " + rating[1] + " מדרגים");
}

function countdown(fullLoad, token) {
    timeout = timeout - 10;
    $("#loading #txt b").text(timeout);
    if (timeout <= 0) {
        $("#loading #txt").html('<img src="' + tpl_url + '/images/big-ajax-loader.gif" /><p>מחפש שרת לצפייה...</p>');
        clearInterval(counter);
        counter = false;
        loadEpisode(fullLoad, token);
    }
}

function numberFormat(num) {
    num += '';
    x = num.split('.');
    x1 = x[0];
    x2 = x.length > 1 ? '.' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
        x1 = x1.replace(rgx, '$1' + ',' + '$2');
    }
    return x1 + x2;
}

function realDate(timestamp) {
    var a = new Date(timestamp * 1000);
    var year = a.getFullYear();
    var month = a.getMonth() + 1;
    var date = a.getDate();
    var hour = a.getHours();
    var min = a.getMinutes();
    var sec = a.getSeconds();
    if (sec <= 9)
        sec = "0" + sec;
    var time = date + '.' + month + '.' + year + ' ' + hour + ':' + min + ':' + sec;
    return time;
}