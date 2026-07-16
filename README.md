# PingPON

An interactive neuro-evolution playground where neural networks learn to play ping pong through genetic algorithms.

## Live modes

- **Lab** (`index.html`) — train a population, watch the live neural network, and view fitness graphs.
- **Arena** (`arena.html`) — play against the best trained brain with keyboard controls.
- **AI vs AI** — pit two copies of the best brain against each other.
- **Learn** (`learn.html`) — explanation of genetic algorithms and neural networks behind the project.

## Architecture

The codebase is modular and built for expansion:

- `src/NeuralNet.js` — feed-forward network with crossover and mutation
- `src/Game.js` — physics engine with spin-aware paddle collisions
- `src/Population.js` — genetic algorithm with elitism and fitness history
- `src/Renderer.js` — canvas rendering for the game, network, and fitness graph
- `src/Storage.js` — localStorage persistence and brain export/import
- `src/UI.js` — DOM bindings for the training controls
- `app.js` — lab orchestration
- `arena.js` — human vs AI mode

## Running locally

Open `index.html` in any modern browser or serve the folder:

```bash
python3 -m http.server 8080
```

## Future expansion

See `future-expansion.md` for ideas like NEAT, cloud leaderboards, and multiplayer matches.
