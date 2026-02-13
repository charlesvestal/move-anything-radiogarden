import './ui.js';

globalThis.chain_ui = {
  init: typeof globalThis.init === 'function' ? globalThis.init : null,
  tick: typeof globalThis.tick === 'function' ? globalThis.tick : null,
  onMidiMessageInternal:
    typeof globalThis.onMidiMessageInternal === 'function' ? globalThis.onMidiMessageInternal : null,
  onMidiMessageExternal:
    typeof globalThis.onMidiMessageExternal === 'function' ? globalThis.onMidiMessageExternal : null
};
