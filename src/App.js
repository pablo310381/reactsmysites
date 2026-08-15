import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './Home.js';
import Game from './Game.js';

const App = () => {
  return React.createElement(
    Routes,
    null,
    React.createElement(Route, { path: '/', element: React.createElement(Home, null) }),
    React.createElement(Route, { path: '/game', element: React.createElement(Game, null) })
  );
};

export default App;