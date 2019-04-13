//# sourceURL=application.js

//
//  application.js
//  TheMovieDB-TV
//
//  Created by Alin Gorgan on 06/04/2019.
//  Copyright © 2019 Alin Gorgan. All rights reserved.
//

/*
 * This file provides an example skeletal stub for the server-side implementation
 * of a TVML application.
 *
 * A javascript file such as this should be provided at the tvBootURL that is
 * configured in the AppDelegate of the TVML application. Note that  the various
 * javascript functions here are referenced by name in the AppDelegate. This skeletal
 * implementation shows the basic entry points that you will want to handle
 * application lifecycle events.
 */

let api_key = 'b105c8881b639900674056a95e6487b3';
let movieURL = 'https://api.themoviedb.org/3/movie';
let posterImageURLPrefix = 'http://image.tmdb.org/t/p';

/**
 * @description The onLaunch callback is invoked after the application JavaScript
 * has been parsed into a JavaScript context. The handler is passed an object
 * that contains options passed in for launch. These options are defined in the
 * swift or objective-c client code. Options can be used to communicate to
 * your JavaScript code that data and as well as state information, like if the
 * the app is being launched in the background.
 *
 * The location attribute is automatically added to the object and represents
 * the URL that was used to retrieve the application JavaScript.
 */
App.onLaunch = function(options) {
    showLoadingScreen();
    showPopularMoviesScreen();
}


App.onWillResignActive = function() {
    
}

App.onDidEnterBackground = function() {
    
}

App.onWillEnterForeground = function() {
    
}

App.onDidBecomeActive = function() {
    
}

App.onWillTerminate = function() {
    
}

/*
 // Screens
 */
function showLoadingScreen() {
    var loadingDocument = makeLoadingDocument();
    navigationDocument.pushDocument(loadingDocument);
}

function showPopularMoviesScreen() {
    let resultURL = movieURL + "/popular?api_key="+ api_key + "&page=1";
    
    fetchData(resultURL, function(data) {
              var stackDocument = makeStackDocument();
              updateResultList(stackDocument, data.results);
              navigationDocument.clear();
              navigationDocument.pushDocument(stackDocument);
              
              stackDocument.addEventListener('select', function(event) {
                                             if (event.target.nodeName == 'lockup') {
                                             let movieID = event.target.lastChild.innerHTML
                                             showMovieDetailsScreen(movieID)
                                             }
                                             });
              });
}

function showMovieDetailsScreen(movieID) {
    let movieDetailsURL = movieURL + '/' + movieID + '?append_to_response=videos&api_key=' + api_key
    fetchData(movieDetailsURL, function(data) {
              let details = movieDetails(data);
              let productDocument = makeProductDocument(details);
              navigationDocument.pushDocument(productDocument);
              })
}

/*
 // Documents
 */
function makeLoadingDocument() {
    var template = `
    <document>
    <loadingTemplate>
    <activityIndicator>
    <text>Loading</text>
    </activityIndicator>
    </loadingTemplate>
    </document>`;
    
    var templateParser = new DOMParser();
    var parsedTemplate = templateParser.parseFromString(template, "application/xml");
    navigationDocument.pushDocument(parsedTemplate);
    return parsedTemplate;
}

var makeStackDocument = function() {
    var stackTemplate = `<?xml version="1.0" encoding="UTF-8" ?>
    <document>
    <stackTemplate>
    <banner>
    <title>The Movie Database</title>
    </banner>
    <collectionList>
    <grid id="itemGrid">
    <header>
    <title>Popular Movies</title>
    </header>
    </grid>
    </collectionList>
    </stackTemplate>
    </document>`;
    
    var parser = new DOMParser();
    var stackDocument = parser.parseFromString(stackTemplate, "application/xml");
    return stackDocument;
}

var makeProductDocument = function(movieDetails) {
    
    var textNodeArray = function(values) {
        return values.flatMap((languageName) => {
                              return `<text>${languageName}</text>`
                              })
    }
    
    let infoListData = infoList([
                                 infoListItem("Genre", movieDetails.genres),
                                 infoListItem("Production", movieDetails.productionCompanies)
                                 ]);
    let playTrailerRowData = playTrailerRow(movieDetails);
    let languagesNodes = textNodeArray(movieDetails.languages);
    //let genreNodes = textNodeArray(movieDetails.genres);
    //let productionCompanyNodes = textNodeArray(movieDetails.productionCompanies);
    let videoShelfData = videoShelf(movieDetails);
    
    let productTemplate = `<?xml version="1.0" encoding="UTF-8"?>
    <document>
    <productTemplate>
    <banner>
    ${infoListData}
    <stack>
    <title>${movieDetails.title}</title>
    <row>
    <text>User score: ${movieDetails.userScore}</text>
    </row>
    <description>${movieDetails.description}</description>
    ${playTrailerRowData}
    <row>${languagesNodes}</row>
    </stack>
    <heroImg src=\"${movieDetails.posterURL}\"/>
    </banner>
    ${videoShelfData}
    </productTemplate>
    </document>`;
    
    let parser = new DOMParser();
    let document = parser.parseFromString(productTemplate, "application/xml");
    return document;
}

var infoList = function(infoItems) {
    let infoData = infoItems.filter((infoItem) => {
                                    return infoItem != ""
                                    }).join("")
    
    if (infoData.length == 0) {
        return ""
    }
    
    return `<infoList>${infoData}</infoList>`
}

var infoListItem = function(header, items) {
    if (header.length == 0 || items.count == 0) {
        return ""
    }
    
    let infoItems = items.map((item) => {
                              return `<text>${item}</text>`
                              }).join("")
    
    return `
    <info>
    <header>
    <title>${header}</title>
    </header>
    ${infoItems}
    </info>`
}

var videoShelf = function(movieDetails) {
    if (movieDetails.videos.count == 0) {
        return "";
    }
    
    let lockupData = movieDetails.videos.filter((videoItem) => {
                                                return videoItem.site.toLowerCase() == "youtube"
                                                }).map((videoItem) => {
                                                       let videoURL = 'http://techslides.com/demos/sample-videos/small.mp4' //  youtubeVideoURL(videoItem.key)
                                                       let videoThumbnail = youtubeVideoThumbnail(videoItem.key)
                                                       return `
                                                       <lockup onselect="playMedia(\'${videoURL}\', 'video')">
                                                       <img src=\"${videoThumbnail}\" width="226" height="150" aspectFill="true"/>
                                                       <title>${videoItem.name}</title>
                                                       </lockup>`
                                                       }).join("");
    
    return `
    <shelf>
    <header>
    <title>Trailers and teasers</title>
    </header>
    <section>${lockupData}</section>
    </shelf>`
}

var playTrailerRow = function(movieDetails) {
    
    if (movieDetails.videos.count == 0) {
        return "";
    }
    
    let videoItem = movieDetails.videos[0]
    let videoURL = 'http://techslides.com/demos/sample-videos/small.mp4'// youtubeVideoURL(videoItem.key)
    return `
    <row>
    <buttonLockup onselect="playMedia(\'${videoURL}\', 'video')">
    <badge src="resource://button-preview" />
    <title>Preview</title>
    </buttonLockup>
    </row>`
}


/*
 //  Data fetching and parsing
 */

function youtubeVideoThumbnail(key) {
    return `https://img.youtube.com/vi/${key}/maxresdefault.jpg`
}

function youtubeVideoURL(key) {
    return `https://www.youtube.com/watch?v=${key}`;
}

function posterImageURL(result, width) {
    return posterImageURLPrefix + "/w" + width + result.poster_path;
}

var fetchData = function(url, completion) {
    
    function processRequestResponse() {
        var jsonObject = JSON.parse(request.responseText);
        completion(jsonObject);
    }
    
    var request = new XMLHttpRequest();
    request.responseType = "document";
    request.addEventListener("load", processRequestResponse);
    request.open("GET", url, true);
    request.send();
}

function lockupNode(document, result) {
    var resultNode = document.createElement("lockup");
    var imageNode = document.createElement("img");
    
    let imageURL = posterImageURL(result, 500)
    imageNode.setAttribute('src', imageURL);
    imageNode.setAttribute('width', 182);
    imageNode.setAttribute('height', 274);
    
    resultNode.appendChild(imageNode)
    
    var titleNode = document.createElement("title");
    titleNode.innerHTML = result.title;
    resultNode.appendChild(titleNode);
    
    var movieNode = document.createElement("movieID");
    movieNode.innerHTML = result.id;
    resultNode.appendChild(movieNode);
    
    return resultNode;
}

function dataItem(result) {
    var dataItem = new DataItem("ResultObject", result.id);
    dataItem.url = posterImageURL(result, 500);
    dataItem.title = result.title;
    
    return dataItem;
}

function updateResultList(document, results) {
    
    var gridNode = document.getElementById("itemGrid");
    var sectionNode = document.createElement("section");
    gridNode.appendChild(sectionNode);
    
    let dataItems = results.map((result) => {
                                var resultNode = lockupNode(document, result);
                                sectionNode.appendChild(resultNode);
                                return dataItem(result);
                                })
    
    let sectionDataItem = new DataItem();
    sectionDataItem.objects = dataItems;
    sectionNode.dataItem = sectionDataItem;
}

function movieDetails(data) {
    
    var parseNamedNodes = function(nodes) {
        return nodes.map((node) => {
                         return node.name
                         })
    }
    
    return {
    title: data.original_title,
    userScore: data.vote_average,
    description: data.overview,
    posterURL: posterImageURLPrefix + "/w" + 500 + data.poster_path,
    backdropURL: posterImageURLPrefix + "/w" + 1280 + data.backdrop_path,
    languages: parseNamedNodes(data.spoken_languages).slice(0,4),
    genres: parseNamedNodes(data.genres).slice(0,4),
    productionCompanies: parseNamedNodes(data.production_companies).slice(0,4),
    videos: data.videos.results
    }
}

function playMedia(mediaURL, mediaType) {
    var singleMediaItem = new MediaItem(mediaType, mediaURL);
    var mediaList = new Playlist();
    
    mediaList.push(singleMediaItem);
    var myPlayer = new Player();
    myPlayer.playlist = mediaList;
    myPlayer.play();
}
