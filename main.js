import Game from './src/Game.js';

window.onload = () => {
    console.log("Window loaded, initializing game...");
    const game = new Game();
    game.init();
};
