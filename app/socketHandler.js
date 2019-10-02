module.exports = function(io, streams, views) {
   

    



  var sys = require('sys'),
      path = require('path'),
      exec = require('child_process').exec
      url = require("url"),
      path = require("path"),
      fs = require("fs"),
      uuid = require('node-uuid')
      ;
  
  //  io.set('origins', '*:*');
  
  
    io.on('connection', function(client) {
      console.log('-- ' + client.id + ' joined --');
      client.emit('id', client.id);
  
      client.on('message', function (data) {
  
  
        console.log(data);
     
          var otherClient = io.sockets.connected[data.to];
  
           if(data.type ){
             
  
              if(data.type == "stream::started")
               {
                data.type = "stream::start"; 
                client.broadcast.emit('stream::start', data);
               }
  
                if(data.type == "stream::end")
                client.broadcast.emit('stream::end', data);
  
                if(data.type == "stream::live_change")
                client.broadcast.emit('stream::live_change', data);
  
                if(data.type == "stream::live_changed")
                client.broadcast.emit('stream::live_changed', data);
  
                if(data.type == "stream::save")
                client.broadcast.emit('stream::save', data);
              
                if(data.type == "stream::saved")
                client.broadcast.emit('stream::saved', data);
  
                if(data.type == "rtmp::start")
                client.broadcast.emit('rtmp::start', data);
  
                if(data.type == "rtmp::end")
                client.broadcast.emit('rtmp::end', data);
  
                if(data.type == "event::bid")
                client.broadcast.emit('event::bid', data);
                
  
             }else{
                 client.broadcast.emit('message', data);
             }
  
          if (!otherClient) {
            return;
          }
          
  
          delete data.to;
          data.from = client.id; 
  
  /*
          var fileName = uuid.v4();
          //some
          
          client.emit('ffmpeg-output', 0);
         if(data.payload){
          writeToDisk(data.audio.dataURL, fileName + '.wav');
          // if it is chrome
          if (data.video) {
              writeToDisk(data.video.dataURL, fileName + '.webm');
              merge(socket, fileName);
          }
          // if it is firefox or if user is recording only audio
          else client.emit('merged', fileName + '.wav');
         
        }
        */
  
                otherClient.emit('message', data);
  
  
  
      });
        
      client.on('readyToStream', function(options) {
        console.log('-- ' + client.id + ' is ready to stream --');
  
        
        streams.addStream(client.id, options.name); 
        client.broadcast.emit('stream::added', {id:client.id, name: options.name});
  
      });
      
      client.on('update', function(options) {
        streams.update(client.id, options.name);
        client.broadcast.emit('stream::upated', {id:client.id, name: options.name});
  
      });
  
      client.on('stream::view', function(options){
  
          for(x in streams.streamList)
          {
            if(streams.streamList[x].id === options.id){
                  streams.streamList.views++;
                  client.broadcast.emit("stream::view", options);
            }
          }
  
        
      })
  
      function leave() {
        console.log('-- ' + client.id + ' left --');
        streams.removeStream(client.id);
        client.broadcast.emit('stream::left', {id:client.id});
  
      }
  
      client.on('disconnect', leave);
      client.on('leave', leave);
  
    });
  
  
  
  function writeToDisk(dataURL, fileName) {
      var fileExtension = fileName.split('.').pop(),
          fileRootNameWithBase = './uploads/' + fileName,
          filePath = fileRootNameWithBase,
          fileID = 2,
          fileBuffer;
  
      // @todo return the new filename to client
      while (fs.existsSync(filePath)) {
          filePath = fileRootNameWithBase + '(' + fileID + ').' + fileExtension;
          fileID += 1;
      }
  
      dataURL = dataURL.split(',').pop();
      fileBuffer = new Buffer(dataURL, 'base64');
      fs.writeFileSync(filePath, fileBuffer);
  
      console.log('filePath', filePath);
  }
  
  function merge(socket, fileName) {
      var FFmpeg = require('fluent-ffmpeg');
  
      var audioFile = path.join(__dirname, 'uploads', fileName + '.wav'),
          videoFile = path.join(__dirname, 'uploads', fileName + '.webm'),
          mergedFile = path.join(__dirname, 'uploads', fileName + '-merged.webm');
  
      new FFmpeg({
              source: videoFile
          })
          .addInput(audioFile)
          .on('error', function (err) {
              socket.emit('ffmpeg-error', 'ffmpeg : An error occurred: ' + err.message);
          })
          .on('progress', function (progress) {
              socket.emit('ffmpeg-output', Math.round(progress.percent));
          })
          .on('end', function () {
              socket.emit('merged', fileName + '-merged.webm');
              console.log('Merging finished !');
  
              // removing audio/video files
              fs.unlink(audioFile);
              fs.unlink(videoFile);
          })
          .saveToFile(mergedFile);
  }
  
  };