module.exports = function(io, streams, views) {

  io.on('connection', function(client) {
    console.log('-- ' + client.id + ' joined --');
    client.emit('id', client.id);

    client.on('message', function (details) {
      var otherClient = io.sockets.connected[details.to];

      if (!otherClient) {
        return;
      }
        delete details.to;
        details.from = client.id;
        otherClient.emit('message', details);
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
};