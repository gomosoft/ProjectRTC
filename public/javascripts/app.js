(function(){
	var app = angular.module('liveStream', [],
		function($locationProvider){$locationProvider.html5Mode(true);}
    );
	var client = new PeerManager();
	var mediaConfig = {
        audio:true,
        video: {
			mandatory: {},
			optional: []
        }
    };

    var apiUri = "https://webrtcfast.herokuapp.com/";
    var socketUri = "https://webrtcfast.herokuapp.com";


    app.config(function($locationProvider){
    	$locationProvider.html5Mode({
		  enabled: true,
		  requireBase: false
		});
    })

   window.socket;

    app.run(function($rootScope){
    	
    	socket = io.connect(socketUri, {secure: true});
    	socket.on("message", function(){
    		//alert("hey")
    	})

    	socket.on("connect", function(){
    		console.log('connected')
    	})



    })


    app.factory('camera', ['$rootScope', '$window', function($rootScope, $window){
    	var camera = {};
    	camera.preview = $window.document.getElementById('localVideo');
   /*
    	camera.start = function(){
			return requestUserMedia(mediaConfig)
			.then(function(stream){			
				attachMediaStream(camera.preview, stream);
				client.setLocalStream(stream);
				camera.stream = stream;
				$rootScope.$broadcast('cameraIsOn',true);
			})
			.catch(Error('Failed to get access to local media.'));
		};

		*/
    	camera.stop = function(){
    		return new Promise(function(resolve, reject){			
				try {
					//camera.stream.stop() no longer works
          for( var track in camera.stream.getTracks() ){
            track.stop();
          }
					camera.preview.src = '';
					resolve();
				} catch(error) {
					reject(error);
				}
    		})
    		.then(function(result){
    			$rootScope.$broadcast('cameraIsOn',false);
    		});	
		};
		return camera;
    }]);


    app.controller('mainCtrl', function($scope, $rootScope){

    	if(!$rootScope.socket)
    	{

		$rootScope.socket = io.connect(socketUri);
		    	$rootScope.socket.on("message", function(){
		    	})

    	$rootScope.socket.on("connect", function(){
    		console.log('')
    	})

    	}

    })

	app.controller('RemoteStreamsController', ['camera', '$location', '$http', function(camera, $location, $http){
		var rtc = this;
		rtc.remoteStreams = [];
		function getStreamById(id) {
		    for(var i=0; i<rtc.remoteStreams.length;i++) {
		    	if (rtc.remoteStreams[i].id === id) {return rtc.remoteStreams[i];}
		    }
		}

		socket.on("stream::added", function(data){
			console.log("added");
			rtc.loadData();
		})

		socket.on("stream::left", function(data){
			console.log("added");
			rtc.loadData();
		})

		socket.on("stream::view", function(data){

			console.log("increasing viewers");

			console.log(data);
		
			for(x in rtc.remoteStreams)
				   if(data.id === rtc.remoteStreams[x].id)
					   	 	rtc.remoteStreams[x].views++;
			
					   

		});


		rtc.loadData = function () {
			// get list of streams from the server
			$http.get(apiUri  + 'streams.json').success(function(data){
				// filter own stream
				var streams = data.filter(function(stream) {
			      	return stream.id != client.getId();
			    });
			    // get former state
			    for(var i=0; i<streams.length;i++) {
			    	var stream = getStreamById(streams[i].id);
			    	streams[i].isPlaying = (!!stream) ? stream.isPLaying : false;
			    }
			    // save new streams
			    rtc.remoteStreams = streams;
			});
		};

		rtc.view = function(stream){

			socket.emit('stream::view', stream);
			client.peerInit(stream.id);
			stream.isPlaying = !stream.isPlaying;

		};

		rtc.call = function(stream){
			/* If json isn't loaded yet, construct a new stream 
			 * This happens when you load <serverUrl>/<socketId> : 
			 * it calls socketId immediatly.
			**/
			if(!stream.id){
				stream = {id: stream, isPlaying: false};
				rtc.remoteStreams.push(stream);
			}
			if(camera.isOn){
				client.toggleLocalStream(stream.id);
				if(stream.isPlaying){
					client.peerRenegociate(stream.id);
				} else {
					client.peerInit(stream.id);
				}
				stream.isPlaying = !stream.isPlaying;
			} else {
				camera.start()
				.then(function(result) {
					client.toggleLocalStream(stream.id);
					if(stream.isPlaying){
						client.peerRenegociate(stream.id);
					} else {
						client.peerInit(stream.id);
					}
					stream.isPlaying = !stream.isPlaying;
				})
				.catch(function(err) {
					console.log(err);
				});
			}
		};

		//initial load
		rtc.loadData();
    	if($location.url() != '/'){
      		rtc.call($location.url().slice(1));
    	};
	}]);

	app.controller('LocalStreamController',['camera', '$scope', '$window', function(camera, $scope, $window){
		var localStream = this;
		localStream.name = 'Guest';
		localStream.link = '';
		localStream.cameraIsOn = false;

		$scope.$on('cameraIsOn', function(event,data) {
    		$scope.$apply(function() {
		    	localStream.cameraIsOn = data;
		    });
		});

		localStream.toggleCam = function(){
			if(localStream.cameraIsOn){
				camera.stop()
				.then(function(result){
					client.send('leave');
	    			client.setLocalStream(null);
				})
				.catch(function(err) {
					console.log(err);
				});
			} else {
				camera.start()
				.then(function(result) {
					localStream.link = $window.location.host + '/' + client.getId();
					client.send('readyToStream', { name: localStream.name });
				})
				.catch(function(err) {
					console.log(err);
				});
			}
		};
	}]);
})();
