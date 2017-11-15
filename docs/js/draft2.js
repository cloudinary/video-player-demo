function toggleClass() {
    var theme = document.getElementById("theme-area");
    theme.classList.toggle("active");
}
function setTheme(btn) {
    var newTheme = "cld-video-player-skin-" + btn.value;
    var oldTheme = "cld-video-player-skin-";
    var pagination = document.getElementById("video-pagination");
    if(btn.value == "dark") {
        oldTheme += "light"; 
        pagination.classList.remove("style01");
    }
    else {
        oldTheme += "dark";
        pagination.classList.add("style01");
    }
    var vplayers = document.getElementsByClassName("cld-video-player");
    for(var i = 0; i < vplayers.length; i++) {
        vplayers[i].classList.remove(oldTheme);
        vplayers[i].classList.add(newTheme);
    }
    toggleClass();
}

window.addEventListener('scroll',checkPosition,false);
function checkPosition()
{
    var themeArea = document.getElementById("theme-area");
    if(window.scrollY > 50)
    {
        themeArea.classList.add("scrolling");
    } else {
        themeArea.classList.remove("scrolling");
    }
}

document.getElementById("upload_widget_opener").addEventListener("click", function() {
	cloudinary.openUploadWidget({ cloud_name: 'hadar', upload_preset: 'transcript', resource_type: 'video'}, 
	  function(error, result) { processTranscript(error, result) });
  }, false);

  function checkTranscript() {
	version++;
	console.log("checkTranscript", transcript, version);
	var checkUrl = url + version + "/" + transcript;
    http.open('HEAD', checkUrl);
	http.send();
}
  function processTranscript(error, result) {
	  console.log(error, result);
	  publicId = result[0].public_id;
	  transcript = publicId + ".transcript";
	  console.log("waiting for ", transcript);
	  player.posterOptions({ transformation: { overlay: "text:arial_60_stroke:Waiting%20for%20transcription...,co_white,bo_2px_solid_black", gravity: "north", y: 90 } });
	  player.source(publicId,{ transformation: {crop: 'limit', width: 600 } });
	  setTimeout(checkTranscript, 30000);
  }
  var http = new XMLHttpRequest();
  http.onreadystatechange = function() {
		console.log("onreadystatechange", this.readyState, this.status);
		if (this.readyState == 4 && this.status == 200) {
	  		player.source(publicId,{ transformation: {crop: 'limit', width: 600, overlay: "subtitles:"+transcript} }).play();
		}
		else if(this.readyState == 4 && this.status == 404) {
			setTimeout(checkTranscript, 10000);
		}
	}
  var url = "https://res.cloudinary.com/hadar/raw/upload/v";
  var publicId = "sample";
  var transcript = "sample.transcript"
  var version = 0;
  var cld = cloudinary.Cloudinary.new({ cloud_name: 'hadar' });
  var player = cld.videoPlayer('demo-transcript-player');
  player.source('Homepage_2',{ transformation: {crop: 'limit', width: 600} });


var eventplayer = cld.videoPlayer('demo-events-player', { playedEventTimes: [3, 10] });
  
 eventplayer.source('test-12s',{ transformation: { width: 400, crop: 'limit' } });
  
var plistplayer = cld.videoPlayer('demo-playlist-player');

  
 plistplayer.source('test-12s',{ transformation: { width: 400, crop: 'limit' }  });

var recplayer = cld.videoPlayer('demo-recommendation-player',{ autoShowRecommendations: true });

var source1 = { publicId: 'test-12s', info: { title: 'Basketball', subtitle: 'Basketball' } };
recplayer.source(source1);

