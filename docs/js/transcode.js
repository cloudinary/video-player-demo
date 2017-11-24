function toggleClass() {
    var theme = document.getElementById("theme-area");
    theme.classList.toggle("active");
}
function setTheme(btn) {
    var newTheme = "cld-video-player-skin-" + btn.value;
    var oldTheme = "cld-video-player-skin-";
    if(btn.value == "dark") {
        oldTheme += "light"; 
    }
    else {
        oldTheme += "dark";
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

function uploadVideo(){
	cloudinary.openUploadWidget({ cloud_name: 'demo', upload_preset: 'video_autotag_transcript_lambda', resource_type: 'video'}, 
      function(error, result) { processResponse(error, result); }, false);
}


function processResponse(error, result) {
    console.log(error, result);
    publicId = result[0].public_id;
    transcript = publicId + ".transcript";
    autoTagPlayer.posterOptions({ transformation: { overlay: "text:arial_60_stroke:Waiting%20for%20automatic%20tagging...,co_white,bo_2px_solid_black", gravity: "north", y: 90 } });
    autoTagPlayer.source(publicId,{ transformation: {crop: 'limit', width: 600 } });
    transcriptPlayer.posterOptions({ transformation: { overlay: "text:arial_60_stroke:Waiting%20for%20transcription...,co_white,bo_2px_solid_black", gravity: "north", y: 90 } });
    transcriptPlayer.source(publicId,{ transformation: {crop: 'limit', width: 600 } });
    updateProgress();
    updatePlayers();
}

function updatePlayers() {
    for(var i = 0; i < players.length; i++) 
        players[i].source(publicId);
}

function updateProgress() {
    progress++;
    console.log("updateProgress", progress);
    if (progress == 30)
        checkLambda();
    if(autoTagProgress < 100)
        updateAutoTagProgress()
    if(transcriptProgress < 100)
        updateTranscriptProgress()
    if (autoTagProgress < 100 || transcriptProgress < 100)
        setTimeout(updateProgress,1000);
}

function getData() {
    if(getTranscriptFile && transcriptComplete) 
        getTranscript();
    else if (autoTagProgress < 100 || transcriptProgress < 100)
        checkLambda();
    else
        console.log("getData Done");
}

  function getTranscript() {
	console.log("getTranscript", transcript);
	var checkUrl = url + "/" + transcript;
    httpTranscript.open('GET', checkUrl);
	httpTranscript.send();
}

function checkLambda() {
    console.log("checkLambda", transcript);
    var checkUrl = "https://4k4smz181f.execute-api.us-east-1.amazonaws.com/Prod/" + publicId;
    httpLambda.open('GET', checkUrl);
	httpLambda.send();
}

var httpLambda = new XMLHttpRequest();
httpLambda.onreadystatechange = function() {
    if (this.readyState == 4) {
        if(this.status == 200) {
          var notify = JSON.parse(httpLambda.responseText);
          checkLambdaNotification(notify);
        }
        setTimeout(getData,4000);
    }
    else 
          console.log("onreadystatechange", this.readyState, this.status);
}

var httpTranscript = new XMLHttpRequest();
httpTranscript.onreadystatechange = function() {
    if (this.readyState == 4) {
        if(this.status == 200) {
          var notify = JSON.parse(httpTranscript.responseText);
          checkTranscriptFile(notify);
        }
        setTimeout(getData,3000);
    }
    else 
          console.log("onreadystatechange", this.readyState, this.status);
}

function checkLambdaNotification(notify) {
        checkTranscript(notify);
        checkTags(notify);
}

function checkTranscriptFile(notify) {
    if(transcriptComplete && getTranscriptFile && Array.isArray(notify)) {
        transcriptProgress = 99;
        showJSON("transcript",notify);
        getTranscriptFile = false;
    }
}

function checkTranscript(notify) {
    if (notify.transcript.status == "pending") {
        console.log("transcript pending");
    }
    else if (notify.transcript.status == "complete") {
        transcriptComplete = true;
        transcriptPlayer.source(publicId,{ transformation: {crop: 'limit', width: 600, overlay: "subtitles:"+transcript} }).play();
        console.log("transcript ready");
    }
    else
        console.log("no transcript");
}

function checkTags(notify) {
    if (notify.tags.status == "pending")
        console.log("autotag pending");
    else if (notify.tags.status == "complete") {
        autoTagProgress = 99;
        showJSON("autotag",notify.tags.data);
    }
    else
        console.log("no autotag");
}

function showJSON(id,notify) {
    var content = document.getElementById(id);
    var autoTaggingData = JSON.stringify(notify);
    content.innerText = autoTaggingData; 
    Prism.highlightElement(content);
}
 
function updateAutoTagProgress() {
    autoTagProgress++;
    var autoTaggingBar = document.getElementById("autoTaggingBar");
    autoTaggingBar.style.width = autoTagProgress + '%'; 
}

function updateTranscriptProgress() {
    transcriptProgress++;
    var transcriptBar = document.getElementById("transcriptBar");
    transcriptBar.style.width = transcriptProgress + '%'; 
}

var url = "https://res.cloudinary.com/demo/raw/upload/";
var publicId = "sample";
var transcript = "sample.transcript"
var getTranscriptFile = true;
var transcriptComplete = false;
var progress = 0;
var autoTagProgress = 0;
var transcriptProgress = 0;

  
var cld = cloudinary.Cloudinary.new({ cloud_name: 'demo' });

var players = cld.videoPlayers('.demo-manipulation', {videojs: { bigPlayButton: false, controlBar: false } });

var transcriptPlayer = cld.videoPlayer('demo-transcript-player');

transcriptPlayer.source('test-12s',{ transformation: { width: 1000, crop: 'limit' }, poster: { transformation: { width: 1000, crop: 'limit', quality: 'auto', fetch_format: 'auto' }} });

var autoTagPlayer = cld.videoPlayer('demo-autotag-player');

autoTagPlayer.source('test-12s',{ transformation: { width: 1000, crop: 'limit' }, poster: { transformation: { width: 1000, crop: 'limit', quality: 'auto', fetch_format: 'auto' }} });
