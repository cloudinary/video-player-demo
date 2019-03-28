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
    var fixedHeader = document.getElementById("header");
    if(window.scrollY > 50) {
        themeArea.classList.add("scrolling");
        fixedHeader.classList.add("fixed-position");
    } 
    else {
        themeArea.classList.remove("scrolling");
        fixedHeader.classList.remove("fixed-position");
    }
}

function showContentBlocks() {
    var contentBlocks = document.getElementsByClassName("content-block");
    for(var i = 0; i < contentBlocks.length; i++) {
        contentBlocks[i].classList.remove("hidden");
    }
}

function showAIProgressBars() {
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
    playingHLS = false;
    progress = 0;
    autoTagProgress = 0;
    transcriptProgress = 0;
    formatState = 0;
    originalSize = 0;
    gotMP4 = false;
    gotH265 = false;
    gotVP9 = false;
    gotHLS = false;
    errorRetry = 1;
    originalDuration = 0;
    originalRes = "default";
    originalFormat = "default";
    clearData();
    if(transcodingPage) {
        hideAdaptivePlayMsg("Processing...");
        adaptivePlayer.controls(false);
    }
    else
        removeSubtitles();
    readSessionStorage();
}

function clearData() {
    var clr = document.getElementsByClassName("init");
    for (var i=0; i<clr.length; i++) {
        clr[i].innerText = "";
    }
    var calc = document.getElementsByClassName("calc");
    for (i=0; i<calc.length; i++)
        calc[i].innerText = "Calculating...";
    var bars = document.getElementsByClassName("my-bar");
    for (i=0; i<bars.length; i++) {
        bars[i].style.width = "0"; 
        bars[i].classList.remove("scale-up-hor-left");
    }
}

function uploadVideo(){
    widget.open();
}

function useVideo(vid) {
    initScreen();
    usingPresetVideo = true;
    publicId = vid.title + "_autotag";
    originalSize = Math.round(vid.getAttribute("data-size") / 1000);
    originalRes = vid.getAttribute("data-res");
    originalFormat = vid.getAttribute("data-format");
    originalDuration = 0;
    if(transcodingPage) {
        runCodecComparison();
        updateManipulationPlayers(vid.title + "_sd");
        updateTranscodingPlayers(vid.title);
        runHLS();
    }
    else 
        runAIPage();
    showContentBlocks();
    progress = 15;
    updateSessionStorage();
}

function runPage() {
    if(transcodingPage)
        runTranscodingPage();
    else
        runAIPage();
}

function runTranscodingPage() {
    runCodecComparison();
    updateManipulationPlayers(publicId);
    updateTranscodingPlayers(publicId);
    runHLS();
    showContentBlocks();
}

function runAIPage() {
    transcript = publicId + ".transcript";
    updateAutoPlayers();
    updateProgress();
    showContentBlocks();
    showAIProgressBars();
}

function useUploadedVideo() {
    if(transcodingPage)
        runTranscodingPage();
    else
        runAIPage();
}

function runCodecComparison() {
    checkFormatSizes();
    updateFileSizes(originalSize,"original");
}

function updateAutoPlayers() {
    autoTagPlayer.source(publicId,{ transformation: {"width": "640", "height": "360", "crop": "pad"}});
    transcriptPlayer.source(publicId,{ transformation: {"width": "640", "height": "360", "crop": "pad"}});
}

function runHLS() {
    if(usingPresetVideo)
        HLSRequest();
    else
    {
        OriginalRequest();
//        DelayHLSRequest(Math.round(((originalDuration)+10)*1000)); 
    }
}

function OriginalRequest() {
    adaptivePlayer.source(publicId ,{
    poster: { transformation: { width: 960, crop: 'limit', quality: 'auto', fetch_format: 'auto' }} }); 
}

function HLSRequest() {
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

function updateSessionStorage() {
    sessionStorage.publicId = publicId;
    sessionStorage.originalSize = originalSize;
    sessionStorage.originalRes = originalRes;
    sessionStorage.originalFormat = originalFormat;
    sessionStorage.originalDuration = originalDuration;
    sessionStorage.usingPresetVideo = "true";
}

function readSessionStorage() {
    publicId = sessionStorage.publicId;
    originalSize = sessionStorage.originalSize;
    originalRes = sessionStorage.originalRes;
    originalFormat = sessionStorage.originalFormat;
    originalDuration = sessionStorage.originalDuration;
    usingPresetVideo = (sessionStorage.usingPresetVideo == "true");
}

function processResponse(error, result) {
    if(result && result.event === "success")
    {
        initScreen();
        var bytes = result.info.bytes;
        console.log(bytes);
        if(bytes > 0 && bytes <= 100000000)
        {
            publicId = result.info.public_id;
            originalSize = Math.round(bytes / 1000);
            originalRes = result.info.width + "x" + result.info.height;
            originalFormat = result.info.format;
            originalDuration = result.info.duration;
            usingPresetVideo = false;
            runPage();
            updateSessionStorage();
            addURLParams();
        }
        else if(bytes > 100000000) {
	        showContentBlocks();
            showError("Uploaded file is too big. This demo file size limit is 100MB");
        }
    }
    else 
    {
	    if (error) 
		showError(error);
    }
}

function updateFileSize(bytes) {
    document.getElementById("file_size").innerText = bytes;
}

function updateManipulationPlayers(pid) {
for(var i = 0; i < players.length; i++) 
        players[i].source(pid);
//    players[0].source(pid);
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
    if (progress == 20)
        checkLambda();
    if(autoTagProgress < 100)
        updateAutoTagProgress();
    if(transcriptProgress < 100)
        updateTranscriptProgress();
    if (autoTagProgress < 100 || transcriptProgress < 100) {
    var rate = Math.round(1200+(25*originalDuration));
        setTimeout(updateProgress,rate);
    }
    else
	    console.log("updateProgress complete",autoTagProgress,transcriptProgress);
}
    
function getData() {
    if(getTranscriptFile && transcriptComplete) 
        getTranscript();
    else if (autoTagProgress < 100 || transcriptProgress < 100) 
        checkLambda();
    else 
        console.log("getData Done");
}

function advanceState() {
    if(initialFormatRequest) {
        if (formatState == GET_VP9) {
            console.log("initialFormatRequest completed");
            initialFormatRequest = false;
            formatState = GET_MP4;
        }
        else
            formatState++;
    }
    else {
        if(!gotMP4) 
            formatState = GET_MP4;
        else if (!gotH265)
            formatState = GET_H265;
        else 
            formatState = GET_VP9;
    }    
}


function checkFormatSizes() {
    if(formatState == GET_MP4) 
        requestMP4();
    else if (formatState == GET_H265) 
        requestH265();
    else if (formatState == GET_VP9)
    {
        if(!gotHLS && !initialFormatRequest)
            requestHLS();
        else
            requestVP9();
    }
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
    var checkUrl = "https://res.cloudinary.com/demo/video/upload/q_70,vc_h265/" + publicId + ".mp4";
    requestFileFormat(checkUrl);
}

function requestHLS() {
    var checkUrl = "https://res.cloudinary.com/demo/video/upload/sp_hd/" + publicId + ".m3u8";
    requestFileFormat(checkUrl);
}
// VP9 codec
function requestVP9() {
    var checkUrl = "https://res.cloudinary.com/demo/video/upload/q_70,vc_vp9/" + publicId + ".webm";
    requestFileFormat(checkUrl);
}

function requestMP4() {
    var checkUrl = "https://res.cloudinary.com/demo/video/upload/q_70,vc_auto/" + publicId + ".mp4";
    requestFileFormat(checkUrl);
}

  function getTranscript() {
    var checkUrl = url + transcript;
    httpTranscript.open('GET', checkUrl);
	httpTranscript.send();
}

function checkLambda() {
    var checkUrl = "https://4k4smz181f.execute-api.us-east-1.amazonaws.com/Prod/" + publicId;
    httpLambda.open('GET', checkUrl);
	httpLambda.send();
}

function revealFileSizes() {
    var bars = document.getElementsByClassName("results hidden");
    for(var i = 0; i < bars.length; i++) {
        bars[i].classList.remove("hidden");
    }
}

function getVideoCodec(contentType) {  
    if(contentType.includes("avc1")) {
        gotMP4 = true;
        return "mp4";
    }
    else if (contentType.includes("hvc1")){
        gotH265 = true;
        return "h265";
    }
    else if (contentType.includes("x-mpegURL")){
        gotHLS = true;
        return "hls";
    }
    else {
        gotVP9 = true;
        return "vp9";
    }
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
    //    transcriptPlayer.source(publicId,{ transformation: [{"width": "640", "height": "360", "crop": "pad"},{overlay: "subtitles:"+transcript}]});
        addSubtitles();
        transcriptPlayer.controls(true);
	}
	else
		showJSON("transcript","This video clip has no detected words"); 
    }
}

function addSubtitles() {
    var vttURL = url + publicId + ".vtt";
    var captionOption = {
        kind: 'subtitles',
        srclang: 'en',
        label: 'English',
        src: vttURL,
	default: true
      }
    var textTrack = transcriptPlayer.videojs.addRemoteTextTrack(captionOption,true); 
    textTrack.track.mode = 'showing';
}

function removeSubtitles() {
    var tracks = transcriptPlayer.videojs.remoteTextTracks();
    if (typeof tracks !== 'undefined' && tracks.length > 0)  
        transcriptPlayer.videojs.removeRemoteTextTrack(tracks[0]);
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
    console.log("update File Size ",size,format);
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
    console.log("Transcript player error");
    if(getTranscriptFile) {
        errorRetry++;
    }
}

function handleAutotagError() {
    console.log("Autotag player error");
    errorRetry++;
}

function handleAdaptiveError() {
    console.log("Adaptive player error ",errorRetry);
    OriginalRequest();
    errorRetry++;
}

function showAdaptivePlayMsg() {
    if (sourceHLS)
    {
        document.getElementById("play-btn").setAttribute("style","");
        document.getElementById("adaptive-bytes").setAttribute("style","display: none");
        document.getElementById("save-hls").setAttribute("style","display: none");
        document.getElementById("cld-hls").setAttribute("style","display: none");
    }
}

function hideAdaptivePlayMsg(text) {
    document.getElementById("play-btn").setAttribute("style","display: none");
    document.getElementById("adaptive-bytes").setAttribute("style","");
    if(!safari)
    {
        var hls = document.getElementById("save-hls");
        hls.setAttribute("style","");
        hls.innerText = text;
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
var playingHLS = false;
var progress = 0;
var autoTagProgress = 0;
var transcriptProgress = 0;
var formatState = 0;
var originalSize = 0;
var originalDuration = 0;
var gotMP4 = false;
var gotH265 = false;
var gotVP9 = false;
var gotHLS = false;
var errorRetry = 1;
const GET_MP4 = 0;
const GET_H265 = 1;
const GET_VP9 = 2;
var adaptivePlayer = null;
var players = null;
var transcriptPlayer = null;
var autoTagPlayer = null;
var httpTranscode = null;
var httpLambda = null;
var httpTranscript = null;
var transcodingPage = true;
var chrome   = navigator.userAgent.indexOf('Chrome') > -1;
var safari   = navigator.userAgent.indexOf("Safari") > -1;
if ((chrome) && (safari)) safari = false;

var cld = cloudinary.Cloudinary.new({ cloud_name: 'demo' });
var widget = cloudinary.createUploadWidget({ cloud_name: 'demo', upload_preset: 'video_autotag_and_subtitle', sources: [ 'local', 'url'], multiple: false, maxFileSize: 100000000, resourceType: 'video'}, 
(error, result) => { processResponse(error, result); });

constructPage();

function constructPage() {
    if(document.getElementById("section01")) {
        transcodingPage = true;
        constructTranscodePlayers();
        constructTranscodeHTTPRequests();
    }
    else {
        transcodingPage = false;
        constructAIPlayers();
        constructAIHTTPRequests(); 
    }
    checkURLParams();
    if(sessionStorage.publicId) {
        readSessionStorage();
        runPage();
        progress = 15;
    }
}

function constructTranscodePlayers() {
    adaptivePlayer = cld.videoPlayer('demo-adaptive-player', { videojs: { bigPlayButton: false} });
    players = cld.videoPlayers('.demo-manipulation', {videojs: { bigPlayButton: false, controlBar: false } });
    adaptivePlayer.on("error", adaptiveErrorEvent);
    adaptivePlayer.on("play", adaptivePlayEvent);
    adaptivePlayer.on("playing", adaptivePlayingEvent);
    adaptivePlayer.on("pause", adaptivePauseEvent);
    adaptivePlayer.on("ended", adaptiveEndedEvent);
}

function constructAIPlayers() {
    transcriptPlayer = cld.videoPlayer('demo-transcript-player');
    autoTagPlayer = cld.videoPlayer('demo-autotag-player');
}

function origDurationDelay() {
    var minute = Math.round(originalDuration/60);
    if (minute > 1)
        return minute*5000;
    else
        return 5000;
}

function constructTranscodeHTTPRequests() {
    httpTranscode = new XMLHttpRequest();
    httpTranscode.onreadystatechange = function() {
        if (this.readyState == 4) {
            if(this.status == 200) {
		var size = 0;
		var contentType = "undefined";
		var headers = httpTranscode.getAllResponseHeaders();
		if(headers.includes("content-length"))
                	size = httpTranscode.getResponseHeader('content-length');
		if(headers.includes("content-type"))
                        contentType = httpTranscode.getResponseHeader('content-type');
                console.log("Got size ",size,contentType);
		var roundedSize = Math.round(size/1000);
                if(size == 0) {
                    if(initialFormatRequest) 
                        setTimeout(checkFormatSizes,500);
                    else
                        setTimeout(checkFormatSizes,origDurationDelay());
                }
                else 
                {
                    var codecType = getVideoCodec(contentType);
                    if(codecType == "hls")
                        DelayHLSRequest(1000);
                    else
                        updateFileSizes(roundedSize,codecType);
                    if(gotMP4 && gotH265 && gotVP9) {
                        revealFileSizes();
                    }
                    else {
                        if(!initialFormatRequest) 
                            advanceState();
                        setTimeout(checkFormatSizes,2000);
                    }
                }
            }
            if(this.status == 420)
                setTimeout(checkFormatSizes,origDurationDelay()*2);
        }
    }
}

function constructAIHTTPRequests() {
    constructLambdaHTTPRequests();
    constructTranscriptHTTPRequests();
}



function constructLambdaHTTPRequests() {
    httpLambda = new XMLHttpRequest();
    httpLambda.onreadystatechange = function() {
        if (this.readyState == 4) {
            if(this.status == 200) {
              var notify = JSON.parse(httpLambda.responseText);
              checkLambdaNotification(notify);
            }
            setTimeout(getData,4000);
        }
    }
}
function constructTranscriptHTTPRequests() {
    httpTranscript = new XMLHttpRequest();
    httpTranscript.onreadystatechange = function() {
        if (this.readyState == 4) {
            if(this.status == 200) {
              var notify = JSON.parse(httpTranscript.responseText);
              checkTranscriptFile(notify);
            }
            setTimeout(getData,3000);
        }
    }
}

function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

function checkURLParams() {
    var id = getUrlParameter("id");
    if(id != '')
    {
        var json = atob(id);
	var obj = JSON.parse(json);
        sessionStorage.publicId = obj.id;
        sessionStorage.originalSize = obj.sz;
        sessionStorage.originalRes = obj.rs;
        sessionStorage.originalFormat = obj.fr;
        sessionStorage.originalDuration = obj.du;
        sessionStorage.usingPresetVideo = "true";
        removeURLParams();
    }
    
}

function addURLParams() {
    var urlStr = window.location.href;
    var idIndex = urlStr.indexOf("#section");
    if(idIndex > 0)
        urlStr = urlStr.slice(0,idIndex);
    if(sessionStorage.publicId)
    {
        var jsonStr = JSON.stringify({id: sessionStorage.publicId, sz:sessionStorage.originalSize, rs: sessionStorage.originalRes,fr: sessionStorage.originalFormat, du: sessionStorage.originalDuration});
        var jsonParam = btoa(jsonStr);
        urlStr += "?id=" + jsonParam;
    }
    copyStringToClipboard(urlStr);
}

function copyStringToClipboard (str) {
    const el = document.createElement('textarea');
    el.value = str;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
}

function removeURLParams() {
    var urlStr = window.location.href;
    var idIndex = urlStr.indexOf("?id");
    var updateStr = urlStr;
    if(idIndex > 0)
    {
        updateStr = urlStr.slice(0,idIndex);
        var stateObj = { id: urlStr.slice(-1,idIndex)};
        window.history.pushState(stateObj,"Cloudinary Video Demo", updateStr) ;
        if(transcodingPage)
            location.href = "#section02";
        else
            location.href = "#section03";
    }
}

function copyStringToClipboard (str) {
    const el = document.createElement('textarea');
    el.value = str;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
 }


function playAdaptive() {
    adaptivePlayer.controls(true);
    adaptivePlayer.play();
}

function adaptiveErrorEvent() {
    if(adaptivePlayer.error)
    	console.log("Error " + adaptivePlayer.error.code + "; details: " + adaptivePlayer.error.message);
    if(errorRetry <= 3)
    	handleAdaptiveError();
}

function adaptiveCanPlayEvent() {
 //       showAdaptivePlayMsg();
}

function adaptivePlayEvent() {
    hideAdaptivePlayMsg("Downloading...");
}

function adaptivePlayingEvent() {
    playingHLS = true;
    hideAdaptivePlayMsg("Downloading...");
    updateAllMediaBytes();
}
    
function adaptivePauseEvent() {
    playingHLS = false;    
}

function adaptiveEndedEvent() {
    playingHLS = false;
    calcAdaptiveUsage(); 
}

function manipulationErrorEvent() {
    console.log("manipulationErrorEvent");
}
