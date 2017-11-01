
function updateOnResize() {
  var desc = demoplayer.videojs.videoWidth() + 
             "x" + 
             demoplayer.videojs.videoHeight();
  var current = document.getElementsByClassName("range-info active");
  for (var i = 0; i < current.length; i++) {
      current[i].setAttribute("class","range-info");
  }
  var newactive = document.getElementsByName(desc);
  for (var j = 0; j < newactive.length; j++)
    newactive[j].setAttribute("class","range-info active");
}
function requestResolution(btn) {
  console.log("requestResolution() ",btn.id);
  document.getElementById("checkbox").checked = false;
  for (var i = 0; i < qualityLevels.length; i++) {
      qualityLevels[i].enabled = (btn.id == i);
  }
}
function requestAuto(auto) {
  console.log("requestAuto() ",auto.checked);
  if(auto.checked) {
    for (var i = 0; i < qualityLevels.length; i++) {
        qualityLevels[i].enabled = true;
    }
  }
}
function addResolution(rangeInfo,bid,desc,css) {
      var clone = rangeInfo.cloneNode(true);
      clone.setAttribute("id", bid);
      clone.setAttribute("css", css);
      clone.setAttribute("name", desc);
      var span = clone.getElementsByTagName("span");
      span[0].textContent = desc;
      rangeInfo.parentNode.appendChild(clone);
}
function changeOfResolution() {
  var rangeInfo = document.getElementById("0");
  var initial = rangeInfo.getElementsByTagName("span");
  for (var i = 0; i < qualityLevels.length; i++) {
    var res = document.getElementById(i);
    var qlevel = qualityLevels[i];
    var desc = qlevel.width + "x" + qlevel.height;
    var css = "range-info";
    if (i == qualityLevels.selectedIndex)
        css = "range-info second-hover";
    if (i == 0) {
      initial[0].textContent = desc;
      rangeInfo.setAttribute("name", desc);
    }
    if(res) 
        res.setAttribute("class",css);
    else 
        addResolution(rangeInfo,i,desc,css);
  }
}
function removeProfileButtons() {
  var loop = document.getElementsByClassName("range-info").length;
  for (var i = 1; i < loop; i++) {
    var btn = document.getElementById(i)
    if(btn)
      adaptive.removeChild(btn);
  }
}
function setProfile() {
  removeProfileButtons();
  var profile;
  var profiles = document.getElementsByName("radio1");
  for(var i = 0; i < profiles.length; i++){
    if(profiles[i].checked){
        profile = profiles[i].value;
    }
  }
  demoplayer.source("hd_trim2", { sourceTypes: ['hls'], transformation: {streaming_profile: profile } });
}

var cld = cloudinary.Cloudinary.new({ cloud_name: 'hadar' });

var adaptive = document.getElementById("adaptive");
document.getElementById("demo-adaptive-player").addEventListener('resize',updateOnResize, false);
 
var demoplayer = cld.videoPlayer('demo-adaptive-player');
 
var qualityLevels = demoplayer.videojs.qualityLevels();
qualityLevels.on('change', changeOfResolution);
qualityLevels.on('addqualitylevel', function(event) { console.log(event.qualityLevel.width); });

demoplayer.source('hd_trim2',{ sourceTypes: ['hls'], 
                              transformation: {streaming_profile: 'hd' } });

function updateOnEvent(eventStr) {
  var list = document.getElementById('events-list');
  var entry = document.createElement('li');
  if (eventStr.includes("timeplayed"))
      entry.className = "orange";
  entry.appendChild(document.createTextNode(eventStr));
  list.insertBefore(entry,list.firstChild);
  list.scrollTop = list.scrollHeight;
}

function checkTime(i) {
        return (i < 10) ? "0" + i : i;
    }

function startTime() {
        var today = new Date(),
            h = checkTime(today.getHours()),
            m = checkTime(today.getMinutes()),
            s = checkTime(today.getSeconds());
        return (h + ":" + m + ":" + s);
}

var eventplayer = cld.videoPlayer('demo-events-player', { playedEventTimes: [3, 10] });

var eventTypes = ['play', 'pause', 'volumechange', 'mute', 'unmute', 'fullscreenchange',
      'seek', 'sourcechanged', 'timeplayed', 'percentsplayed', 'ended'];

eventTypes.forEach(function(eventType) {
      eventplayer.on(eventType, function(event) {
        var eventStr = startTime() + " " + eventType;
        if (event.eventData) {
          eventStr = eventStr + ": " + JSON.stringify(event.eventData)
        }
        updateOnEvent(eventStr);
      })
    });
  
 eventplayer.source('hls_30s_test',{ sourceTypes: ['hls'], 
                              transformation: {streaming_profile: 'hd' } });

function playMe(btn) {
    var val = parseInt(btn.value);
    plistplayer.playlist().playAtIndex(val);
  }

  function updateOnSrc() {
    var plist = plistplayer.playlist();
    var playing = plist.currentIndex();
    var loop = plist.length();
    for(var i=0; i<loop; i++) {
      var label = "plist"+i;
      var btn = document.getElementById(label);
      if(i == playing)
        btn.setAttribute("class", "active");
      else
        btn.setAttribute("class", " ");
  }
  console.log("updateOnSrc", playing, loop);
}
var plistplayer = cld.videoPlayer('demo-playlist-player');
plistplayer.on('sourcechanged', updateOnSrc);
plistplayer.playlist(
  [{ publicId: 'game2', sourceTypes: ['dash'], transformation: {streaming_profile: 'hd' }},
   { publicId: 'hls_30s_test', sourceTypes: ['dash'], transformation: {streaming_profile: 'hd' }},
   { publicId: 'hd_trim2', sourceTypes: ['dash'], transformation: {streaming_profile: 'hd' }},
   { publicId: 'Homepage_2', sourceTypes: ['dash'], transformation: {streaming_profile: 'hd' }}], 
   { autoAdvance: 0, repeat: true });
  
 plistplayer.source('game2',{ sourceTypes: ['dash'], transformation: {streaming_profile: 'hd' } });

var recplayer = cld.videoPlayer('demo-recommendation-player',{ autoShowRecommendations: true });

var source1 = { publicId: 'Homepage_2', info: { title: 'Kid Play', subtitle: 'A preview' } };
var source2 = { publicId: 'game2', info: { title: 'Game', subtitle: 'A game ad' } };
var source3 = { publicId: 'hd_trim2', info: { title: 'Race', subtitle: 'Volve Ocean Race' } };
var source4 = { publicId: 'hls_30s_test', info: { title: 'NBA', subtitle: 'A game' } };
var source5 = { publicId: 'oceans', info: { title: 'Oceans', subtitle: 'A movie about oceans' } };
source1.recommendations = [source2, source3, source4, source5];
source2.recommendations = [source3];
source3.recommendations = [source4];
source4.recommendations = [source5];
source5.recommendations = [source2, source3, source4, source1];
recplayer.source(source1);

