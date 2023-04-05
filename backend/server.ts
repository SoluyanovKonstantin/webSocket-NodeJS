import { WebSocketServer } from 'ws';
// eslint-disable-next-line import/no-extraneous-dependencies
import {
  MouseClass,
  Point,
  mouse,
} from '@nut-tree/nut-js';

const wss = new WebSocketServer({ port: 8080 });

enum Command {
  'UP' = 'mouse_up',
  'DOWN' = 'mouse_down',
  'LEFT' = 'mouse_left',
  'RIGHT' = 'mouse_right'
}

function drawCircle(mouse: MouseClass, radius: number) {
  
}

wss.on('connection', (ws) => {
  ws.on('error', console.error);

  ws.on('message', async (data) => {
    const number = data.toString('utf-8').split(' ')[1];
    const getPosition = await mouse.getPosition();

    switch (data.toString('utf-8').split(' ')[0]) {
      case (Command.DOWN): {
        const y = +(await mouse.getPosition()).y + +number;
        const target = new Point(getPosition.x, y);
        mouse.move([target]);
        break;
      }
      case (Command.UP): {
        const y = +(await mouse.getPosition()).y - +number;
        const target = new Point(getPosition.x, y);
        mouse.move([target]);
        break;
      }
      case (Command.LEFT): {
        const x = +(await mouse.getPosition()).x - +number;
        const target = new Point(x, getPosition.y);
        mouse.move([target]);
        break;
      }
      case (Command.RIGHT): {
        const x = +(await mouse.getPosition()).x + +number;
        const target = new Point(x, getPosition.y);
        mouse.move([target]);
        break;
      }
      default: {
        break;
      }
    }

    if (data.toString('utf-8') !== 'mouse_position') {
      ws.send(data.toString('utf-8'));
    } else {
      ws.send('MousePosition');
    }
  });

  ws.send('something');
});
