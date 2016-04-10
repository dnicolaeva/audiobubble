function getHashParams() {
  var hashParams = {};
  var e, r = /([^&;=]+)=?([^&;]*)/g,
      q = window.location.hash.substring(1);
  while ( e = r.exec(q)) {
     hashParams[e[1]] = decodeURIComponent(e[2]);
  }
  return hashParams;
}

function getMaxPitch(pitches) {
    var maxIndex = 0;
    var maxPitch = 0.0;
    for (i = 0 ; i < pitches.length ; i++) { 
        if (pitches[i] > maxPitch){
            maxPitch = pitches[i];
            maxIndex = i;
        }
    }
    return maxIndex;
}

var params = getHashParams();

var access_token = params.access_token,
    refresh_token = params.refresh_token,
    error = params.error;

// find template and compile it
var templateSource = document.getElementById('results-template').innerHTML,
    template = Handlebars.compile(templateSource),
    resultsPlaceholder = document.getElementById('results'),
    playingCssClass = 'playing',
    audioObject = null;

var searchSongs = function (query) {
    console.log("Hi!");
    $.ajax({
        url: 'https://api.spotify.com/v1/search',
        data: {
            q: query,
            type: 'track'
        },
        success: function (response) {
            console.log("Successs!");
            resultsPlaceholder.innerHTML = template(response);
        }
    });
};

var fetchFeatures = function (songId, callback) {
    if (access_token) {
        $.ajax({
            url: 'https://api.spotify.com/v1/audio-features/' + songId,
            headers: {
              'Authorization': 'Bearer ' + access_token
            },
            success: function (response) {
                callback(response);
            }
        });
    }
    else{
        console.log('Auth token failed');
    }
};

var fetchAnalysis = function (analysisUrl, callback) {
    $.get(analysisUrl, function(response) {
         callback(response.segments);
    });
};

results.addEventListener('click', function (e) {
    var target = e.target;
    var chosensongid = target.getAttribute('song-id')
    if (target !== null) {

        fetchFeatures(target.getAttribute('song-id'), function (spotifyData) {                    

            fetchAnalysis(spotifyData.analysis_url , function (analysisData){
                var parsedData = [];                
                // If you use i it doesn't work....
                for (j = 0; j < analysisData.length ; j++) { 
                    console.log(j);
                    var curr = {
                        startTime : analysisData[j].start,
                        endTime : analysisData[j].start + analysisData[j].duration,
                        duration : analysisData[j].duration,
                        maxLoudness : analysisData[j].loudness_max,
                        maxPitch : getMaxPitch(analysisData[j].pitches), 
                        order : j
                    };
                    parsedData.push(curr);
                }
                
                console.log(parsedData);
            });
        });            
    }
});

document.getElementById('search-form').addEventListener('submit', function (e) {
    e.preventDefault();
    searchSongs(document.getElementById('query').value);
}, false);