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
    var maxHeight =  "max-height: " + transcriptPlayer.videojs.currentHeight() + "px";
    showProgressBar(true,"transcript",maxHeight); 
    showProgressBar(true,"autotag",maxHeight);
    setPrismHeight(maxHeight);
}

function setPrismHeight(maxHeight) {
    document.getElementById("autotag-prism").setAttribute("style",maxHeight);
    document.getElementById("transcript-prism").setAttribute("style",maxHeight);
}

function initScreen() {
    getTranscriptFile = true;
    transcriptComplete = false;
    initialFormatRequest = true;
    usingPresetVideo = false;
    sourceHLS = false;
    videosFormatState = 0;
    progress = 0;
    autoTagProgress = 0;
    transcriptProgress = 0;
    formatState = 0;
    originalSize = 0;
    gotFomats = 0;
    originalDuration = 0;
    originalRes = "default";
    originalFormat = "default";
    clearData();
    adaptivePlayer.controls(false);
}

function clearData() {
    var clr = document.getElementsByClassName("init");
    for (var i=0; i<clr.length; i++)
        clr[i].innerText = "";
    var calc = document.getElementsByClassName("calc");
    for (i=0; i<calc.length; i++)
        calc[i].innerText = "Calculating...";
    var bars = document.getElementsByClassName("my-bar");
    for (i=0; i<bars.length; i++)
    {
        console.log("clearData ",bars[i].id);
        bars[i].style.width = "0"; 
        bars[i].classList.remove("scale-up-hor-left");
    }
}

function uploadVideo(){
	cloudinary.openUploadWidget({ cloud_name: 'demo', upload_preset: 'video_autotag_and_transcript', sources: [ 'local', 'url'], multiple: false, max_file_size: 100000000, resource_type: 'video'}, 
      function(error, result) { processResponse(error, result); }, false);
}

function useVideo(vid) {
    console.log("useVideo",vid.title);
    initScreen();
    usingPresetVideo = true;
    publicId = vid.title + "_autotag";
    originalSize = Math.round(vid.getAttribute("data-size") / 1000);
    originalRes = vid.getAttribute("data-res");
    originalFormat = vid.getAttribute("data-format");
    checkFormatSizes();
    updateFileSizes(originalSize,"original");
    transcript = publicId + ".transcript";
    updateManipulationPlayers(vid.title + "_sd");
    updateTranscodingPlayers(vid.title);
    showContentBlocks();
    progress = 15;
    updateProgress();
    updateAutoPlayers();
}

function updateAutoPlayers() {
    autoTagPlayer.source(publicId,{ transformation: {"width": "640", "height": "360", "crop": "pad"}});
    transcriptPlayer.source(publicId,{ transformation: {"width": "640", "height": "360", "crop": "pad"}});
    if(usingPresetVideo)
        HLSRequest();
    else
    {
        OriginalRequest();
        DelayHLSRequest(Math.round((originalDuration+10)*1000)); 
    }
}

function OriginalRequest() {
    console.log("Original Request");
    adaptivePlayer.source(publicId ,{
    poster: { transformation: { width: 960, crop: 'limit', quality: 'auto', fetch_format: 'auto' }} }); 
}

function HLSRequest() {
    console.log("HLS Request");
    adaptivePlayer.source(publicId,{ sourceTypes: ['hls'], 
    transformation: {streaming_profile: 'hd' },
    poster: { transformation: { width: 960, crop: 'limit', quality: 'auto', fetch_format: 'auto' }} }); 
    sourceHLS = true;
    showAdaptivePlayMsg();
}

function DelayHLSRequest(delay) {
    console.log("Delay HLS Request ", delay);
    setTimeout(HLSRequest,delay);
}

function processResponse(error, result) {
    console.log("processResponse",error, result);
    initScreen();
    if(result && result[0].bytes > 0 && result[0].bytes <= 100000000)
    {
        publicId = result[0].public_id;
        pIdForCompression = publicId;
        originalSize = Math.round(result[0].bytes / 1000);
        originalRes = result[0].width + "x" + result[0].height;
        originalFormat = result[0].format;
        originalDuration = result[0].duration;
        checkFormatSizes();
        updateFileSizes(originalSize,"original");
        transcript = publicId + ".transcript";
        updateManipulationPlayers(publicId);
        updateTranscodingPlayers(publicId);
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

function updateManipulationPlayers(pid) {
    for(var i = 0; i < players.length; i++) 
        players[i].source(pid);
}

function updateTranscodingPlayers(pid) {
    var links = document.getElementsByClassName("link")
    for(var j = 0; j < links.length; j++) {
            var ref = links[j].getAttribute("data-href");
            links[j].setAttribute("href",ref+pid+".mp4");
    }
    var webmLink = document.getElementsByClassName("webm-link")
    for(var k = 0; k < webmLink.length; k++) {
            ref = webmLink[k].getAttribute("data-href");
            webmLink[k].setAttribute("href",ref+pid+".webm");
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
    var rate = Math.round(1200+(25*originalDuration));
	console.log("calling updateProgress cycle",autoTagProgress,transcriptProgress,rate/1000);
        setTimeout(updateProgress,rate);
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
    if(formatState == GET_MP4) 
        requestMP4();
    else if (formatState == GET_H265) 
        requestH265();
    else if (formatState == GET_VP9)
        requestVP9();
    else
        console.log("checkFormatSizes unexpected state",formatState);

    if(initialFormatRequest)
        advanceState();
}

function requestFileFormat(url) {
    httpTranscode.open('HEAD', url);
	httpTranscode.send();
}

function requestH265() {
    console.log("requestH265");
    var checkUrl = "https://res.cloudinary.com/demo/video/upload/vc_h265,q_70/" + publicId + ".mp4";
    requestFileFormat(checkUrl);
}

function requestHLS() {
    console.log("requestHLS");
    var checkUrl = "https://res.cloudinary.com/demo/video/upload/sp_hd/" + publicId + ".m3u8";
    requestFileFormat(checkUrl);
}

function requestVP9() {
    console.log("requestVP9");
    var checkUrl = "https://res.cloudinary.com/demo/video/upload/vc_vp9,q_70/" + publicId + ".webm";
    requestFileFormat(checkUrl);
}

function requestMP4() {
    console.log("requestMP4");
    var checkUrl = "https://res.cloudinary.com/demo/video/upload/q_70/" + publicId + ".mp4";
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

function revealFileSizes() {
    var bars = document.getElementsByClassName("results hidden");
    console.log("revealFileSizes",bars.length)
    for(var i = 0; i < bars.length; i++) {
        bars[i].classList.remove("hidden");
    }
}

var httpTranscode = new XMLHttpRequest();
httpTranscode.onreadystatechange = function() {
    if (this.readyState == 4) {
        if(this.status == 200) {
            var size = httpTranscode.getResponseHeader('Content-Length');
            if(size == 0) {
                if(initialFormatRequest) 
                    checkFormatSizes();
                else
                    setTimeout(checkFormatSizes,2000);
            }
            else {
                updateFileSizes(Math.round(size/1000),getVideoFormat());
                if(++gotFomats < 3) {
                    if(!initialFormatRequest) 
                        advanceState();
                    setTimeout(checkFormatSizes,2000);
                }
                else
                    revealFileSizes();
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

function getVideoFormat() {
    var state = formatState;
    if(usingPresetVideo) {
        state = videosFormatState;
        videosFormatState++;
    }

    if(state == GET_H265)
        return "h265";
    else if(state == GET_VP9)
        return "vp9";
    else
        return "mp4";
}

function checkLambdaNotification(notify) {
        checkTranscript(notify);
        checkTags(notify);
}

function checkTranscriptFile(notify) {
    if(transcriptComplete && getTranscriptFile && Array.isArray(notify)) {
        if(transcriptProgress < 99) transcriptProgress = 99;
	getTranscriptFile = false;
	if(notify.length > 0)
	{
        showJSON("transcript",notify);
        transcriptPlayer.source(publicId,{ transformation: [{"width": "640", "height": "360", "crop": "pad"},{overlay: "subtitles:"+transcript}]});
        console.log("transcript player requested transcript overlay");
	}
	else
		showJSON("transcript","This video clip has no detected words"); 
    }
}

function checkTranscript(notify) {
    console.log("checkTranscript ",notify.transcript.status);
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
        if(transcriptProgress < 99) transcriptProgress = 99;
        showJSON("transcript","There is no transcript for this video");
        console.log("no transcript");
    }
}

function checkTags(notify) {
    if (notify.tags.status == "pending")
        console.log("autotag pending");
    else if (notify.tags.status == "complete") {
        if (autoTagProgress < 99) autoTagProgress = 99;
        showJSON("autotag",notify.tags.data);
    }
    else
        console.log("no autotag");
}

function updateFileSizes(size,format) {
    console.log("updateFileSizes", size, format);
    var percentage = Math.round((size / originalSize)*100);
    var saving = 100 - percentage;
    if (format == "original") {
        document.getElementById("res-original").innerText = " " + originalFormat.toUpperCase() + " " + originalRes;
        document.getElementById("res-mp4").innerText = originalRes;
        document.getElementById("res-h265").innerText = originalRes;
        document.getElementById("res-vp9").innerText = originalRes;
    }
    else if(saving > 0)
        document.getElementById("save-"+format).innerText = " " + saving + "% Saving ";
    else
        document.getElementById("save-"+format).innerText = " No Saving ";
    document.getElementById("comp-"+format).innerText = "  " + size.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "KB";
    updateTranscodeFileSize("bar-"+format,percentage);
}

function updateAllMediaBytes() {
    updateMediaBytes("adaptive",adaptivePlayer);
    if(playingHLS)
        setTimeout(updateAllMediaBytes,1000);
}

function updateMediaBytes(id,player) {
    if(!safari)
    {
        var elem = document.getElementById(id+"-bytes");
        var Kbytes = Math.round(player.videojs.tech_.hls.stats.mediaBytesTransferred / 1000);
        var percentage = Math.round((Kbytes / originalSize)*100);
        elem.innerText = Kbytes.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "KB"; 
        document.getElementById("res-hls").innerText = " " + player.videojs.videoWidth() + "x" + player.videojs.videoHeight();
        updateTranscodeFileSize(id+"-bar",percentage);
    }
}

function showProgressBar(show,id, maxHeight) {
    var pre = document.getElementById("pre-"+id);
    var bar = document.getElementById(id+"-bar");
    if(show) {
        bar.setAttribute("style","");
        pre.setAttribute("style","display: none");
    }
    else {
        bar.setAttribute("style","display: none");
        pre.setAttribute("style",maxHeight);
    }
}

function showError(error) {
    showJSON("autotag",error);
    showJSON("transcript",error);
}

function showJSON(id,notify) {
    var content = document.getElementById(id);
    var maxHeight =  "max-height: " + transcriptPlayer.videojs.currentHeight() + "px";
    showProgressBar(false,id,maxHeight);
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

function updateTranscodeFileSize(id,percentage) {
    var bar = document.getElementById(id);
    bar.classList.add("scale-up-hor-left");
    bar.style.width = percentage + '%'; 
}

function handleTranscriptError() {
    console.log("Transcript player error ",event);
    if(getTranscriptFile) {
        errorRetry++;
        transcriptPlayer.source(publicId,{ transformation: {"width": "640", "height": "360", "crop": "pad"}});
    }
}

function handleAutotagError() {
    console.log("Autotag player error ",event);
    errorRetry++;
    autoTagPlayer.source(publicId,{ transformation: {"width": "640", "height": "360", "crop": "pad"}});
}

function handleAdaptiveError(delay) {
    console.log("Adaptive player error ",event);
    errorRetry++;
    OriginalRequest();
}

function showAdaptivePlayMsg() {
    if (sourceHLS)
    {
        document.getElementById("play-btn").setAttribute("style","");
        document.getElementById("save-hls").setAttribute("style","display: none");
        document.getElementById("cld-hls").setAttribute("style","display: none");
    }
}

function hideAdaptivePlayMsg() {
    document.getElementById("play-btn").setAttribute("style","display: none");
    if(!safari)
    {
        var hls = document.getElementById("save-hls");
        hls.setAttribute("style","");
        hls.innerText = "Downloading...";
        document.getElementById("cld-hls").setAttribute("style","");
    }
}

function calcAdaptiveUsage() {
    if(!safari)
    {
        var Kbytes = Math.round(adaptivePlayer.videojs.tech_.hls.stats.mediaBytesTransferred / 1000);
        var percentage = Math.round((Kbytes / originalSize)*100);
        var saving = 100 - percentage;
        if(saving > 0)
            document.getElementById("save-hls").innerText = " " + saving + "% Saving ";
        else
            document.getElementById("save-hls").innerText = "No Saving ";
    }
}

var url = "https://res.cloudinary.com/demo/raw/upload/";
var publicId = "sample";
var transcript = "sample.transcript"
var originalRes = "default";
var originalFormat = "default";
var getTranscriptFile = true;
var transcriptComplete = false;
var initialFormatRequest = true;
var usingPresetVideo = false;
var sourceHLS = false;
var videosFormatState = 0;
var progress = 0;
var autoTagProgress = 0;
var transcriptProgress = 0;
var formatState = 0;
var originalSize = 0;
var originalDuration = 0;
var gotFomats = 0;
var errorRetry = 1;
const GET_MP4 = 0;
const GET_H265 = 1;
const GET_VP9 = 2;
var chrome   = navigator.userAgent.indexOf('Chrome') > -1;
var safari   = navigator.userAgent.indexOf("Safari") > -1;
if ((chrome) && (safari)) safari = false;

var cld = cloudinary.Cloudinary.new({ cloud_name: 'demo' });

 var adaptivePlayer = cld.videoPlayer('demo-adaptive-player', { videojs: { bigPlayButton: false} });

var players = cld.videoPlayers('.demo-manipulation', {videojs: { bigPlayButton: false, controlBar: false } });

var transcriptPlayer = cld.videoPlayer('demo-transcript-player');

var autoTagPlayer = cld.videoPlayer('demo-autotag-player');

function playAdaptive() {
    adaptivePlayer.controls(true);
    adaptivePlayer.play();
}

transcriptPlayer.on('error', function(event) {
    console.log("transcript player error");
    setTimeout(handleTranscriptError,1000*errorRetry);
      });
transcriptPlayer.on('loadstart', function(event) {
    console.log("transcript player loadstart");
    transcriptPlayer.controls(true);
//    transcriptPlayer.controls(false);
          });
transcriptPlayer.on('loadedmetadata', function(event) {
    console.log("transcript player loadedmetadata");
          });
transcriptPlayer.on('loadeddata', function(event) {
console.log("transcript player loadeddata");
        });
transcriptPlayer.on('progress', function(event) {
console.log("transcript player progress");
        });
transcriptPlayer.on('durationchange', function(event) {
console.log("transcript player durationchange");
        });
transcriptPlayer.on('canplay', function(event) {
    console.log("transcript player canplay");
//    transcriptPlayer.controls(true);
      });
      autoTagPlayer.on('loadstart', function(event) {
console.log("autotag player loadstart");
//    transcriptPlayer.controls(false);
        });
        autoTagPlayer.on('loadedmetadata', function(event) {
console.log("autotag player loadedmetadata");
        });
        autoTagPlayer.on('loadeddata', function(event) {
console.log("autotag player loadeddata");
    });
    autoTagPlayer.on('progress', function(event) {
console.log("autotag player progress");
    });
    autoTagPlayer.on('durationchange', function(event) {
console.log("autotag player durationchange");
    });
    autoTagPlayer.on('canplay', function(event) {
console.log("autotag player canplay");
          });
 autoTagPlayer.on('error', function(event) {
        setTimeout(handleAutotagError,1000*errorRetry);
      });

adaptivePlayer.on('error', function(event) {
        handleAdaptiveError(1000*errorRetry);
      });

adaptivePlayer.on('canplay', function(event) {
 //       showAdaptivePlayMsg();
      });

adaptivePlayer.on('play', function(event) {
        hideAdaptivePlayMsg();
      });

adaptivePlayer.on('playing', function(event) {
    playingHLS = true;
    hideAdaptivePlayMsg();
    updateAllMediaBytes();
  });

adaptivePlayer.on('pause', function(event) {
    playingHLS = false;
  });

  adaptivePlayer.on('ended', function(event) {
    playingHLS = false;
    calcAdaptiveUsage();
  });

 

  
 












