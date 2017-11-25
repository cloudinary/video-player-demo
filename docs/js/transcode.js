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

function showContentBlocks() {
    var contentBlocks = document.getElementsByClassName("content-block");
    for(var i = 0; i < contentBlocks.length; i++) {
        contentBlocks[i].classList.remove("hidden");
    }
}

function initScreen() {
    getTranscriptFile = true;
    transcriptComplete = false;
    progress = 0;
    autoTagProgress = 0;
    transcriptProgress = 0;
    showJSON("transcript","Waiting for automatic transcript...");
    showJSON("autotag","Waiting for automatic tagging...");
    showContentBlocks();
}

function uploadVideo(){
	cloudinary.openUploadWidget({ cloud_name: 'demo', upload_preset: 'video_autotag_transcript_sd_lambda', resource_type: 'video'}, 
      function(error, result) { processResponse(error, result); }, false);
}

function useVideo(vid) {
    console.log("useVideo",vid.title);
    initScreen();
    publicId = vid.title + "_autotag";
    transcript = publicId + ".transcript";
    updatePlayers(vid.title + "_sd");
    updateAutoPlayers();
    progress = 20;
    updateProgress();
}

function updateAutoPlayers() {
    autoTagPlayer.source(publicId,{ transformation: {crop: 'limit', width: 640 } });
    transcriptPlayer.source(publicId,{ transformation: {crop: 'limit', width: 640 } });
}


function processResponse(error, result) {
    console.log(error, result);
    initScreen();
    publicId = result[0].public_id;
    transcript = publicId + ".transcript";
    updatePlayers(publicId);
    updateAutoPlayers();
    updateProgress();
}

function updatePlayers(pid) {
    for(var i = 0; i < players.length; i++) 
        players[i].source(pid);
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
	var checkUrl = url + transcript;
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
        transcriptPlayer.source(publicId,{ transformation: [{crop: 'limit', width: 640}, {overlay: "subtitles:"+transcript}] }).play();
        console.log("transcript ready");
    }
    else
    {
        getTranscriptFile = false;
        transcriptComplete = true;
        transcriptPlayer.source(publicId,{ transformation: {crop: 'limit', width: 640} }).play();
        transcriptProgress = 99;
        showJSON("transcript","There is no transcript for this video");
        console.log("no transcript");
    }
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

var autoTagPlayer = cld.videoPlayer('demo-autotag-player');













