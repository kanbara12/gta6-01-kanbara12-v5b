// Keyboard + mouse input. One shared key set; every module reads it.
export function createInput() {
  const keys = {};
  const input = {
    keys,
    mouseDown: false,
    mouseX: 0,
    mouseY: 0,
    pressed: {},   // edge-triggered: true only on the frame the key went down
    axis() {
      let x = 0, y = 0;
      if (keys.KeyA || keys.ArrowLeft) x -= 1;
      if (keys.KeyD || keys.ArrowRight) x += 1;
      if (keys.KeyW || keys.ArrowUp) y += 1;
      if (keys.KeyS || keys.ArrowDown) y -= 1;
      return { x, y };
    },
  };
  window.addEventListener('keydown', (e) => {
    if (!keys[e.code]) input.pressed[e.code] = true;
    keys[e.code] = true;
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  });
  window.addEventListener('keyup', (e) => { keys[e.code] = false; });
  window.addEventListener('mousedown', (e) => { input.mouseDown = true; input.mouseX = e.clientX; input.mouseY = e.clientY; });
  window.addEventListener('mouseup', () => { input.mouseDown = false; });
  window.addEventListener('blur', () => { for (const k of Object.keys(keys)) keys[k] = false; input.mouseDown = false; });
  input.endFrame = () => { input.pressed = {}; };
  return input;
}
