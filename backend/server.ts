import { WebSocketServer } from 'ws';
// eslint-disable-next-line import/no-extraneous-dependencies
import {
  MouseClass,
  Point,
  mouse,
  Button,
  straightTo
} from '@nut-tree/nut-js';

const wss = new WebSocketServer({ port: 8080 });

enum Command {
  'UP' = 'mouse_up',
  'DOWN' = 'mouse_down',
  'LEFT' = 'mouse_left',
  'RIGHT' = 'mouse_right',
  'GET_POSITION' = 'mouse_position',
  'DRAW_CIRCLE' = 'draw_circle',
  'DRAW_RECTANGLE' = 'draw_rectangle',
  'DRAW_SQUARE' = 'draw_square',
  'PRINT_SCREEN' = 'prnt_scrn'
}

async function drawCircle(mouse: MouseClass, radius: number) {
  const CIRCLE_PIECES = 50;

  let position = await mouse.getPosition();
  let currentAngle = 0;

  const center = new Point(position.x, position.y + radius)
  await mouse.pressButton(Button.LEFT);
  
  for (let i = 0; i < CIRCLE_PIECES; i++) {
    currentAngle += Math.PI * 2 / CIRCLE_PIECES;

    const nextPoint = new Point(
      center.x + radius * Math.sin(currentAngle),
      center.y - radius * Math.cos(currentAngle)
    );

    await mouse.move(straightTo(nextPoint))
  }

  mouse.releaseButton(Button.LEFT);
}

async function drawRectangle(mouse: MouseClass, x: number, y: number) {
  let position = await mouse.getPosition();

  const positions = [ position, new Point(position.x - x, position.y), new Point(position.x - x, position.y - y), new Point(position.x, position.y - y), position ];
  positions.reduce((prev, current) => {
    mouse.drag([prev, current]);
    return current
  }, position)
}

function drawSquare(mouse: MouseClass, x: number) {
  drawRectangle(mouse, x, x);
}

wss.on('connection', (ws) => {
  ws.on('error', console.error);

  ws.on('message', async (data) => {
    const numbers = data.toString('utf-8').split(' ').slice(1);
    const getPosition = await mouse.getPosition();

    switch (data.toString('utf-8').split(' ')[0]) {
      case (Command.DOWN): {
        const y = +(await mouse.getPosition()).y + +numbers[0];
        const target = new Point(getPosition.x, y);
        mouse.move([target]);
        break;
      }
      case (Command.UP): {
        const y = +(await mouse.getPosition()).y - +numbers[0];
        const target = new Point(getPosition.x, y);
        mouse.move([target]);
        break;
      }
      case (Command.LEFT): {
        const x = +(await mouse.getPosition()).x - +numbers[0];
        const target = new Point(x, getPosition.y);
        mouse.move([target]);
        break;
      }
      case (Command.RIGHT): {
        const x = +(await mouse.getPosition()).x + +numbers[0];
        const target = new Point(x, getPosition.y);
        mouse.move([target]);
        break;
      }
      case (Command.GET_POSITION): {
        const position = getPosition
          .toString()
          .replaceAll(/\(|\)|,/g, '')
          .split(' ')
          .join(',')
        
        ws.send(`mouse_position ${position}`)
        break;
      }
      case (Command.DRAW_CIRCLE): {
        drawCircle(mouse, +numbers[0]);
        break;
      }
      case (Command.DRAW_SQUARE): {
        drawSquare(mouse, +numbers[0])
        break;
      }
      case (Command.DRAW_RECTANGLE): {
        drawRectangle(mouse, +numbers[0], +numbers[1]);
        break;
      }
      default: {
        break;
      }
    }

    if (data.toString('utf-8') !== 'mouse_position') {
      ws.send(data.toString('utf-8'));
    }
  });

  ws.send('something');
});
