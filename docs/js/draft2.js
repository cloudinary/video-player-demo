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
	cloudinary.openUploadWidget({ cloud_name: 'demo', upload_preset: 'video_autotag', resource_type: 'video'}, 
	  function(error, result) { processAutoTag(error, result) });
  }, false);

function getTranscript() {
	version++;
	console.log("checkTranscript", transcript, version);
	var checkUrl = url + version + "/" + transcript;
    	http.open('GET', checkUrl);
	http.send();
}
function processTranscript(error, result) {
	console.log(error, result);
	publicId = result[0].public_id;
	pubnub.subscribe({channels: [publicId]});
	transcript = publicId + ".transcript";
	console.log("waiting for ", transcript);
	player.posterOptions({ transformation: { overlay: "text:arial_60_stroke:Waiting%20for%20transcription...,co_white,bo_2px_solid_black", gravity: "north", y: 90 } });
	player.source(publicId,{ transformation: {crop: 'limit', width: 600 } });
	updateProgress();
  }

function processAutoTag(error, result) {
	console.log(error, result);
	publicId = result[0].public_id;
	pubnub.subscribe({channels: [publicId]});
	autoTagplayer.posterOptions({ transformation: { overlay: "text:arial_60_stroke:Waiting%20for%20autotagging...,co_white,bo_2px_solid_black", gravity: "north", y: 90 } });
	autoTagplayer.source(publicId,{ transformation: {crop: 'limit', width: 600 } });
	updateProgress();
  }

  var http = new XMLHttpRequest();
  http.onreadystatechange = function() {
		console.log("onreadystatechange", this.readyState, this.status);
		if (this.readyState == 4 && this.status == 200) {
            document.getElementById("transcript").innerHTML = http.responseText;
		}
        else 
            console.log("Get transcript failed");
        
    }
 
function updateProgress() {
    progress++;
    console.log("updateProgress", progress);
    var elem = document.getElementById("myAutoTagBar");
    elem.style.width = progress + '%'; 
    if (progress < 100)
        setTimeout(updateProgress,1000);
}

var pubnub = new PubNub({
    subscribeKey: "sub-c-5d3119e4-cac9-11e7-afbf-0e89c33d81b5",
    publishKey: "pub-c-7cfafc5b-b1dc-4b7d-94f4-5f0223738947",
    uuid: PubNub.generateUUID(),
    ssl: true
});

pubnub.time(function(status, response) {
    if (status.error) {
        console.log("pubnub error", status);
    } else {
        console.log("pubnub connected");
    }
});

pubnub.addListener({
    status: function(statusEvent) {
        if (statusEvent.category === "PNConnectedCategory") {
            console.log("PNConnectedCategory");
        } else if (statusEvent.category === "PNUnknownCategory") {
            var newState = {
                new: 'error'
            };
            pubnub.setState(
                {
                    state: newState 
                },
                function (status) {
                    console.log(statusEvent.errorData.message)
                }
            );
        } 
    },
    message: function(message) {
        console.log(message,message.channel);
        var notify = JSON.parse(message.message);
        console.log(notify.public_id);
        if(notify.info_status == "complete")
        {
            progress = 99;
//            player.source(publicId,{ transformation: {crop: 'limit', width: 600, overlay: "subtitles:"+transcript} }).play();
//            getTranscript();
	    autoTagplayer.play();
        }
    }
})
  var url = "https://res.cloudinary.com/demo/raw/upload/v";
  var publicId = "sample";
  var transcript = "sample.transcript"
  var version = 0;
  var progress = 0;
  var cld = cloudinary.Cloudinary.new({ cloud_name: 'demo' });
  var player = cld.videoPlayer('demo-transcript-player');
  player.source('Homepage_2',{ transformation: {crop: 'limit', width: 600} });


  var autoTagplayer = cld.videoPlayer('demo-autotag-player');
  
  autoTagplayer.source('test-12s',{ transformation: {crop: 'limit', width: 600} });
  
  var plistplayer = cld.videoPlayer('demo-playlist-player');

  plistplayer.source('test-12s',{ transformation: { width: 400, crop: 'limit' }  });

  var recplayer = cld.videoPlayer('demo-recommendation-player',{ autoShowRecommendations: true });

  var source1 = { publicId: 'test-12s', info: { title: 'Basketball', subtitle: 'Basketball' } };
  recplayer.source(source1);

