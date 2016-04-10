function getPitchString(pitch){
    switch(pitch) {
    case 0:
        return "1st pitch";
        break;
    case 1:
        return "2nd pitch";
        break;
    case 2:
        return "3rd pitch";
        break;
    default:
        return pitch + 1 + "th pitch";
    }
}

function getColor(pitch) {
    switch(pitch) {
    case 0:
        return "#9E0041";
        break;
    case 1:
        return "#C32F4B";
        break;
    case 2:
        return "#E1514B";
        break;
    case 3:
        return "#F47245";
        break;
    case 4:
        return "#FB9F59";
        break;
    case 5:
        return "#FEC574";
        break;
    case 6:
        return "#FAE38C";
        break;
    case 7:
        return "#EAF195";
        break;
    case 8:
        return "#C7E89E";
        break;
    case 9:
        return "#9CD6A4";
        break;
    case 10:
        return "#6CC4A4";
        break;
    case 11:
        return "#4D9DB4";
        break;
    case 12:
        return "#4776B4";
        break;
    default:
        return "FFF";
    }
}

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

function drawLegend(){
    var output = document.getElementById('asterplot-legend');
    
    for (var k = 0 ; k < 12 ; k++){
        var container = document.createElement("div");
        container.setAttribute("class", "asterplot-container");

        var color = document.createElement("div");
        color.setAttribute("class", "asterplot-color");
        color.style.width ='10px';
        color.style.height ='10px';
        color.style.backgroundColor = getColor(k);
        
        var text = document.createElement("div");
        text.setAttribute("class", "asterplot-text");
        text.innerHTML = getPitchString(k) ;
        
        container.appendChild(color);
        container.appendChild(text);
        output.appendChild(container);
    }
    
}

function drawAsterPlot(data, songName, songArtist) {
    var width = 480,
        height = 480,
        radius = Math.min(width, height) / 2,
        innerRadius = 0.2 * radius;

    var pie = d3.layout.pie()
        .sort(null)
        .value(function(d) { return d.width; });

    var tip = d3.tip()
      .attr('class', 'd3-tip')
      .offset([0, 0])
      .html(function(d) {
        return d.data.label + ": <span style='color:orangered'>" + d.data.score + "</span>";
      });

    var arc = d3.svg.arc()
      .innerRadius(innerRadius)
      .outerRadius(function (d) { 
        return (radius - innerRadius) * (d.data.score / 100.0) + innerRadius; 
      });

    var outlineArc = d3.svg.arc()
            .innerRadius(innerRadius)
            .outerRadius(radius);

    var svg = d3.select("#aster-plot").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
    
    svg.append("text")
        .attr("x", 0)             
        .attr("y", -(height / 2) + 40)
        .attr("text-anchor", "middle")  
        .style("font-size", "14px") 
        .style("font-weight", "600") 
        .style("text-decoration", "none")  
        .text(songName + ", " + songArtist);
    // svg.call(tip);

    data.forEach(function(d) {
        d.id     =  "1";
        d.order  = "1";
        d.color  =  getColor(d.maxPitch);
        d.weight = d.duration;
        d.score  = d.maxLoudness * 1.3;
        d.width  = d.duration;
        d.label  =  "temp";
      });

    var path = svg.selectAll(".solidArc")
        .data(pie(data))
        .enter().append("path")
        .attr("fill", function(d) { return d.data.color; })
        .attr("class", "solidArc")
        .attr("d", arc)
        // .on('mouseover', tip.show)
        // .on('mouseout', tip.hide);
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
    $.ajax({
        url: 'https://api.spotify.com/v1/search',
        data: {
            q: query,
            type: 'track'
        },
        success: function (response) {
            $('#results').show();
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
    var songName = target.getAttribute('song-name');
    var songArtist = target.getAttribute('song-artist');
    if (target !== null) {

        fetchFeatures(target.getAttribute('song-id'), function (spotifyData) {                    
            fetchAnalysis(spotifyData.analysis_url , function (analysisData){
                var parsedData = [];                
                // If you use i it doesn't work....
                for (j = 0; j < analysisData.length ; j += 3) { 
                    var curr = {
                        startTime : analysisData[j].start,
                        endTime : analysisData[j].start + analysisData[j].duration,
                        duration : analysisData[j].duration,
                        maxLoudness : analysisData[j].loudness_max + 60,
                        maxPitch : getMaxPitch(analysisData[j].pitches), 
                        order : j
                    };
                    parsedData.push(curr);
                }

                 $('#results').hide();
                drawAsterPlot(parsedData, songName, songArtist);
                $('#asterplot-legend').show();
                
            });
        });            
    }
});

drawLegend();
document.getElementById('search-form').addEventListener('submit', function (e) {
    e.preventDefault();
    searchSongs(document.getElementById('query').value);
}, false);