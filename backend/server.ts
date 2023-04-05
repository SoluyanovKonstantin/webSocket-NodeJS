import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (ws) => {
  ws.on('error', console.error);

  ws.on('message', (data) => {
    if (data.toString('utf-8') !== 'mouse_position') {
      ws.send(data.toString('utf-8'));
    } else {
      ws.send('MousePosition');
    }
  });

  ws.send('something');
});
