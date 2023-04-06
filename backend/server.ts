import { WebSocketServer } from 'ws';
import {
  MouseClass,
  Point,
  mouse,
  Button,
  straightTo,
  screen,
  Region
} from '@nut-tree/nut-js';
import Jimp from 'jimp'

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
  const CIRCLE_PIECES = 20;

  let position = await mouse.getPosition();
  let currentAngle = 0;

  const center = new Point(position.x, position.y);
  await mouse.move([position, new Point(
    position.x + radius,
    position.y
  )])
  position = new Point(
    position.x + radius,
    position.y
  );
  await mouse.pressButton(Button.LEFT);
  
  for (let i = 0; i < CIRCLE_PIECES; i++) {
    currentAngle += Math.PI * 2 / CIRCLE_PIECES;

    const nextPoint = new Point(
      center.x + radius * Math.cos(currentAngle),
      center.y - radius * Math.sin(currentAngle)
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

function _arrayBufferToBase64( buffer: Buffer ) {
  var binary = '';
  var bytes = new Uint8Array( buffer );
  var len = bytes.byteLength;
  for (var i = 0; i < len; i++) {
      binary += String.fromCharCode( bytes[ i ] );
  }
  return global.btoa( binary );
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
      case (Command.PRINT_SCREEN): {
        
        const img = await (await screen.grabRegion(new Region(getPosition.x - 100, getPosition.y - 100, 200, 200))).toRGB();

        const base64 = await (new Jimp({
          data: img.data,
          width: img.width,
          height: img.height
        })).getBase64Async(Jimp.MIME_PNG);

        ws.send(`prnt_scrn ${base64.replace('data:image/png;base64,', '')}`);
        break;
      }
      default: {
        break;
      }
    }

    if (data.toString('utf-8') !== 'mouse_position' && data.toString('utf-8') !== 'prnt_scrn') {
      ws.send(data.toString('utf-8'));
    }
  });

  ws.send('something');
});
