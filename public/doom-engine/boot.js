/*
 * DOOM bootstrap, inside the same-origin frame the player creates when you press Play.
 * Removing the frame is the only "stop" a WebAssembly game needs: runtime, audio and listeners
 * all go with it. Messages to the page go to this origin only.
 */
(function () {
  'use strict';
  var params = new URLSearchParams(location.search);
  var sound = params.get('sound') === '1';
  var status = document.getElementById('status');
  var canvas = document.getElementById('canvas');
  var tell = function (type, extra) {
    if (parent === window) return;
    var msg = { type: 'doom:' + type };
    for (var k in extra || {}) msg[k] = extra[k];
    parent.postMessage(msg, location.origin);
  };

  // This site never touches the clipboard, and neither does DOOM.
  try {
    Object.defineProperty(navigator, 'clipboard', { value: undefined });
  } catch (e) {
    /* already locked down */
  }

  canvas.addEventListener('contextmenu', function (e) {
    e.preventDefault();
  });
  canvas.addEventListener('webglcontextlost', function (e) {
    e.preventDefault();
    tell('error', { reason: 'context-lost' });
  });

  // Shift+Esc hands the keyboard back to the page. (Esc alone is DOOM's own menu.)
  window.addEventListener(
    'keydown',
    function (e) {
      if (e.key === 'Escape' && e.shiftKey) {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (document.pointerLockElement) document.exitPointerLock();
        canvas.blur();
        tell('escape');
      }
    },
    true,
  );

  var args = ['-iwad', 'doom1.wad', '-window', '-nogui', '-nomusic', '-config', 'default.cfg'];
  if (!sound) args.push('-nosound');

  var total = 0;
  window.Module = {
    canvas: canvas,
    noInitialRun: true,
    preRun: function () {
      window.Module.FS.createPreloadedFile('', 'doom1.wad', 'doom1.wad', true, true);
      window.Module.FS.createPreloadedFile('', 'default.cfg', 'default.cfg', true, true);
    },
    onRuntimeInitialized: function () {
      status.textContent = '';
      tell('ready');
      window.callMain(args);
      canvas.focus();
    },
    print: function () {},
    printErr: function () {},
    setStatus: function () {},
    monitorRunDependencies: function (left) {
      total = Math.max(total, left);
      tell('progress', { left: left, total: total });
    },
  };

  var engine = document.createElement('script');
  engine.src = 'websockets-doom.js';
  engine.onerror = function () {
    status.textContent = 'DOOM failed to load.';
    tell('error', { reason: 'load' });
  };
  document.body.appendChild(engine);
})();
