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

document.getElementById("upload_widget_opener_small").addEventListener("click", function() {
	cloudinary.openUploadWidget({ cloud_name: 'demo', upload_preset: 'video_autotag_and_transcript', resource_type: 'video'}, 
	  function(error, result) { processResponse(error, result) });
  }, false);

  document.getElementById("upload_widget_opener_large").addEventListener("click", function() {
	cloudinary.openUploadWidget({ cloud_name: 'demo', upload_preset: 'video_autotag_and_transcript', resource_type: 'video'}, 
	  function(error, result) { processResponse(error, result) });
  }, false);

  function processResponse(error, result) {
    console.log(error, result);
    publicId = result[0].public_id;
    pubnub.subscribe({channels: [publicId]});
    transcript = publicId + ".transcript";
    autoTagPlayer.posterOptions({ transformation: { overlay: "text:arial_60_stroke:Waiting%20for%20automatic%20tagging...,co_white,bo_2px_solid_black", gravity: "north", y: 90 } });
    autoTagPlayer.source(publicId,{ transformation: {crop: 'limit', width: 600 } });
    transcriptPlayer.posterOptions({ transformation: { overlay: "text:arial_60_stroke:Waiting%20for%20transcription...,co_white,bo_2px_solid_black", gravity: "north", y: 90 } });
    transcriptPlayer.source(publicId,{ transformation: {crop: 'limit', width: 600 } });
    updateProgress();
}

  function getTranscript() {
	version++;
	console.log("checkTranscript", transcript, version);
	var checkUrl = url + version + "/" + transcript;
    http.open('GET', checkUrl);
	http.send();
}

  var http = new XMLHttpRequest();
  http.onreadystatechange = function() {
		console.log("onreadystatechange", this.readyState, this.status);
		if (this.readyState == 4 && this.status == 200) {
            var content = document.getElementById("transcript");
            content.innerText = http.responseText;  
            Prism.highlightElement(content);
		}
        else 
            console.log("Get transcript failed");
        
    }
 
function updateProgress() {
    progress++;
    console.log("updateProgress", progress,autoTagProgress,transcriptProgress);
    if(autoTagProgress < 100)
        updateAutoTagProgress()
    if(transcriptProgress < 100)
        updateTranscriptProgress()
    if (progress < 100)
        setTimeout(updateProgress,1000);
}

function updateAutoTagProgress() {
    autoTagProgress++;
    console.log("updateAutoTagProgress", progress,autoTagProgress);
    var autoTaggingBar = document.getElementById("autoTaggingBar");
    autoTaggingBar.style.width = autoTagProgress + '%'; 
}

function updateTranscriptProgress() {
    transcriptProgress++;
    console.log("updateTranscriptProgress", progress,transcriptProgress);
    var transcriptBar = document.getElementById("transcriptBar");
    transcriptBar.style.width = transcriptProgress + '%'; 
}

function showNotification(notification) {
    if(notification.info_kind == "google_video_tagging") {
        autoTagProgress = 99;
        showAutoTagging(notification.info_data);
    }
    else if (notification.info_kind == "google_speech"){
        transcriptProgress = 99;
        showTranscript();
    }
    else
        console.log("showNotification",notification.info_kind);
}

function showAutoTagging(notification) {
    var content = document.getElementById("autotag");
    var autoTaggingData = JSON.stringify(notification);
    content.innerText = autoTaggingData; 
    Prism.highlightElement(content);
}

function showTranscript() {
    transcriptPlayer.source(publicId,{ transformation: {crop: 'limit', width: 600, overlay: "subtitles:"+transcript} }).play();
    getTranscript();
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
            showNotification(notify);
    }
})

 

  var url = "http://res.cloudinary.com/demo/raw/upload/v";
  var publicId = "sample";
  var transcript = "sample.transcript"
  var version = 0;
  var progress = 0;
  var autoTagProgress = 0;
  var transcriptProgress = 0;

  
var cld = cloudinary.Cloudinary.new({ cloud_name: 'demo' });

var resizePlayer = cld.videoPlayer('demo-resize-player');

resizePlayer.source('test-12s',{ transformation: { width: 1000, crop: 'limit' }, poster: { transformation: { width: 1000, crop: 'limit', quality: 'auto', fetch_format: 'auto' }} });

var manipulationPlayer1 = cld.videoPlayer('demo-manipulation1-player');

manipulationPlayer1.source('test-12s',{ transformation: { width: 1000, crop: 'limit' }, poster: { transformation: { width: 1000, crop: 'limit', quality: 'auto', fetch_format: 'auto' }} });

var manipulationPlayer2 = cld.videoPlayer('demo-manipulation2-player');

manipulationPlayer2.source('test-12s',{ transformation: { width: 1000, crop: 'limit' }, poster: { transformation: { width: 1000, crop: 'limit', quality: 'auto', fetch_format: 'auto' }} });

var manipulationPlayer3 = cld.videoPlayer('demo-manipulation3-player');

manipulationPlayer3.source('test-12s',{ transformation: { width: 1000, crop: 'limit' }, poster: { transformation: { width: 1000, crop: 'limit', quality: 'auto', fetch_format: 'auto' }} });

var manipulationPlayer4 = cld.videoPlayer('demo-manipulation4-player');

manipulationPlayer4.source('test-12s',{ transformation: { width: 1000, crop: 'limit' }, poster: { transformation: { width: 1000, crop: 'limit', quality: 'auto', fetch_format: 'auto' }} });

var manipulationPlayer5 = cld.videoPlayer('demo-manipulation5-player');

manipulationPlayer5.source('test-12s',{ transformation: { width: 1000, crop: 'limit' }, poster: { transformation: { width: 1000, crop: 'limit', quality: 'auto', fetch_format: 'auto' }} });

var manipulationPlayer6 = cld.videoPlayer('demo-manipulation6-player');

manipulationPlayer6.source('test-12s',{ transformation: { width: 1000, crop: 'limit' }, poster: { transformation: { width: 1000, crop: 'limit', quality: 'auto', fetch_format: 'auto' }} });

var manipulationPlayer7 = cld.videoPlayer('demo-manipulation7-player');

manipulationPlayer7.source('test-12s',{ transformation: { width: 1000, crop: 'limit' }, poster: { transformation: { width: 1000, crop: 'limit', quality: 'auto', fetch_format: 'auto' }} });

var manipulationPlayer8 = cld.videoPlayer('demo-manipulation8-player');

manipulationPlayer8.source('test-12s',{ transformation: { width: 1000, crop: 'limit' }, poster: { transformation: { width: 1000, crop: 'limit', quality: 'auto', fetch_format: 'auto' }} });

var transcriptPlayer = cld.videoPlayer('demo-transcript-player');

transcriptPlayer.source('test-12s',{ transformation: { width: 1000, crop: 'limit' }, poster: { transformation: { width: 1000, crop: 'limit', quality: 'auto', fetch_format: 'auto' }} });

var autoTagPlayer = cld.videoPlayer('demo-autotag-player');

autoTagPlayer.source('test-12s',{ transformation: { width: 1000, crop: 'limit' }, poster: { transformation: { width: 1000, crop: 'limit', quality: 'auto', fetch_format: 'auto' }} });






