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
    showProgressBar(true,"transcript"); 
    showProgressBar(true,"autotag");
}

function initScreen() {
    getTranscriptFile = true;
    transcriptComplete = false;
    initialFormatRequest = true;
    progress = 0;
    autoTagProgress = 0;
    transcriptProgress = 0;
    formatState = 0;
    originalSize = 0;
    gotFomats = 0;
}

function uploadVideo(){
	cloudinary.openUploadWidget({ cloud_name: 'demo', upload_preset: 'video_autotag_and_transcript', sources: [ 'local', 'url'], multiple: false, max_file_size: 100000000, resource_type: 'video'}, 
      function(error, result) { processResponse(error, result); }, false);
}

function useVideo(vid) {
    console.log("useVideo",vid.title);
    initScreen();
    publicId = vid.title + "_autotag";
    originalSize = Math.round(vid.getAttribute("data-size") / 1000);
    checkFormatSizes();
    updateFileSizes(originalSize,"original");
    transcript = publicId + ".transcript";
    updatePlayers(vid.title + "_sd");
    showContentBlocks();
    progress = 15;
    updateProgress();
    updateAutoPlayers();
}

function updateAutoPlayers() {
    autoTagPlayer.source(publicId,{ transformation: {"width": "640", "height": "360", "crop": "pad"}});
    transcriptPlayer.source(publicId,{ transformation: {"width": "640", "height": "360", "crop": "pad"}});
    adaptivePlayer.source(publicId,{ sourceTypes: ['hls'], 
    transformation: {streaming_profile: 'sd' },
    poster: { transformation: { width: 960, crop: 'limit', quality: 'auto', fetch_format: 'auto' }} });
}


function processResponse(error, result) {
    console.log("processResponse",error, result);
    initScreen();
    if(result && result[0].bytes > 0 && result[0].bytes <= 100000000)
    {
        publicId = result[0].public_id;
        originalSize = Math.round(result[0].bytes / 1000);
        checkFormatSizes();
        updateFileSizes(originalSize,"original");
        transcript = publicId + ".transcript";
        updatePlayers(publicId);
	    showContentBlocks();
        updateProgress();
	    updateAutoPlayers(); 
    }
    else if(result && result[0].bytes > 100000000) {
	    showContentBlocks();
        showError("Uploaded file is too big. This demo file size limit is 100MB");
    }
    else
        showError(error);
}

function updateFileSize(bytes) {
    document.getElementById("file_size").innerText = bytes;
}

function updatePlayers(pid) {
    for(var i = 0; i < players.length; i++) 
        players[i].source(pid);
    var links = document.getElementsByClassName("manipulation")
    for(var j = 0; j < links.length; j++) {
            var ref = links[j].getAttribute("data-href");
            links[j].setAttribute("href",ref+pid+".mp4");
    }
}

function updateProgress() {
    progress++;
    console.log("updateProgress", progress);
    if (progress == 20)
        checkLambda();
    if(autoTagProgress < 100)
        updateAutoTagProgress();
    if(transcriptProgress < 100)
        updateTranscriptProgress();
    if (autoTagProgress < 100 || transcriptProgress < 100) {
	console.log("calling updateProgress cycle",autoTagProgress,transcriptProgress);
        setTimeout(updateProgress,1500);
    }
    else
	console.log("updateProgress complete",autoTagProgress,transcriptProgress);
}

function getData() {
    if(getTranscriptFile && transcriptComplete) 
        getTranscript();
    else if (autoTagProgress < 100 || transcriptProgress < 100) {
	console.log("getData autoT p",autoTagProgress,transcriptProgress);
        checkLambda();
    }
    else
        console.log("getData Done");
}

function advanceState() {
    if(formatState == GET_VP9) {
        console.log("initialFormatRequest completed");
        initialFormatRequest = false;
        formatState = GET_MP4;
    }
    else
        formatState++;
}


function checkFormatSizes() {
    console.log("checkFormatSizes state",formatState);
    if(formatState == GET_MP4) 
        requestMP4();
    else if (formatState == GET_VP8) 
        requestVP8();
    else if (formatState == GET_VP9)
        requestVP9();
    else
        console.log("checkFormatSizes unexpected state",formatState);

    if(initialFormatRequest) {
	console.log("calling advanceState from checkFormatSizes", formatState);
        advanceState();
    }
}

function requestFileFormat(url) {
    httpTranscode.open('HEAD', url);
	httpTranscode.send();
}

function requestVP8() {
    console.log("requestVP8");
    var checkUrl = "https://res.cloudinary.com/demo/video/upload/vc_auto/" + publicId + ".webm";
    requestFileFormat(checkUrl);
}

function requestVP9() {
    console.log("requestVP9");
    var checkUrl = "https://res.cloudinary.com/demo/video/upload/vc_vp9,q_70/" + publicId + ".webm";
    requestFileFormat(checkUrl);
}

function requestMP4() {
    console.log("requestMP4");
    var checkUrl = "https://res.cloudinary.com/demo/video/upload/vc_auto/" + publicId + ".mp4";
    requestFileFormat(checkUrl);
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

var httpTranscode = new XMLHttpRequest();
httpTranscode.onreadystatechange = function() {
    if (this.readyState == 4) {
        if(this.status == 200) {
            var size = httpTranscode.getResponseHeader('Content-Length');
            console.log("httpTranscode Content-Length ", size);
            if(size == 0) {
                if(initialFormatRequest)
                    checkFormatSizes();
                else
                    setTimeout(checkFormatSizes,2000);
            }
            else {
                var format = "mp4";
                if(formatState == GET_VP8)
                    format = "vp8";
                if(formatState == GET_VP9)
                    format = "vp9";
                updateFileSizes(Math.round(size/1000),format);
                if(++gotFomats < 3) {
		    if(!initialFormatRequest) 
                    	advanceState();
                    setTimeout(checkFormatSizes,2000);
		    
                }
            }
        }
    }
    else 
          console.log("httpTranscode onreadystatechange", this.readyState, this.status);
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
	getTranscriptFile = false;
	if(notify.length > 0)
	{
        showJSON("transcript",notify);
		transcriptPlayer.source(publicId,{ transformation: [{"width": "640", "height": "360", "crop": "pad"},{overlay: "subtitles:"+transcript}]});
	}
	else
		showJSON("transcript","This video clip has no detected words"); 
    }
}

function checkTranscript(notify) {
    if (notify.transcript.status == "pending") {
        console.log("transcript pending");
    }
    else if (notify.transcript.status == "complete") {
        transcriptComplete = true;
        console.log("transcript ready");
    }
    else
    {
        getTranscriptFile = false;
        transcriptComplete = true;
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

function updateFileSizes(size,format) {
    var elem = document.getElementById("comp-"+format);
    elem.innerText = size.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "KB";
    if (format != "original")
        elem.innerText += " " + Math.round((1 - (size / originalSize))*100) + "% Saving";
}

function updateMediaBytes() {
    var elem = document.getElementById("adaptive-bytes");
    elem.innerText = Math.round(adaptivePlayer.videojs.tech_.hls.stats.mediaBytesTransferred / 1000) + "KB";
    if(playingHLS)
        setTimeout(updateMediaBytes,1000);
}

function showProgressBar(show,id) {
    var pre = document.getElementById("pre-"+id);
    var bar = document.getElementById(id+"-bar");
    if(show) {
        bar.setAttribute("style","");
        pre.setAttribute("style","display: none");
    }
    else {
        bar.setAttribute("style","display: none");
        pre.setAttribute("style","");
    }
}

function showError(error) {
    showJSON("autotag",error);
    showJSON("transcript",error);
}

function showJSON(id,notify) {
    var content = document.getElementById(id);
    showProgressBar(false,id);
    var data = JSON.stringify(notify);
    content.innerText = data; 
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
var initialFormatRequest = true;
var progress = 0;
var autoTagProgress = 0;
var transcriptProgress = 0;
var formatState = 0;
var originalSize = 0;
var gotFomats = 0;
const GET_MP4 = 0;
const GET_VP8 = 1;
const GET_VP9 = 2;

  
var cld = cloudinary.Cloudinary.new({ cloud_name: 'demo' });

var players = cld.videoPlayers('.demo-manipulation', {videojs: { bigPlayButton: false, controlBar: false } });

var transcriptPlayer = cld.videoPlayer('demo-transcript-player');

var autoTagPlayer = cld.videoPlayer('demo-autotag-player');

var adaptivePlayer = cld.videoPlayer('demo-adaptive-player');

transcriptPlayer.on('error', function(event) {
        console.log("error ",event);
      });

 autoTagPlayer.on('error', function(event) {
        console.log("error ",event);
      });

adaptivePlayer.on('playing', function(event) {
    playingHLS = true;
    updateMediaBytes();
  });

adaptivePlayer.on('pause', function(event) {
    playingHLS = false;
  });

  adaptivePlayer.on('ended', function(event) {
    playingHLS = false;
  });













