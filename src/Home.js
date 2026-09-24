import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaGamepad, FaTelegramPlane } from 'react-icons/fa';
import './Home.css';

const TEXT = {
  ru: {
    status: 'System // Online',
    subtitle: 'Добро пожаловать на мой сайт',
    play: 'Играть в Лабиринт',
    telegram: 'Мой Telegram',
  },
  en: {
    status: 'System // Online',
    subtitle: 'Welcome to my website',
    play: 'Play Maze',
    telegram: 'My Telegram',
  },
};

const Home = () => {
  const [lang, setLang] = useState('ru');
  const t = TEXT[lang];

  return React.createElement(
    'div',
    { className: 'space-bg' },
    React.createElement('div', { className: 'nebula nebula-1' }),
    React.createElement('div', { className: 'nebula nebula-2' }),
    React.createElement('div', { className: 'stars' }),
    React.createElement('div', { className: 'stars stars-small' }),
    React.createElement('div', { className: 'bg-grid' }),

    React.createElement(
      'div',
      { className: 'card-wrapper' },
      React.createElement(
        'div',
        { className: 'card' },

        React.createElement(
          'div',
          { className: 'lang-switch' },
          React.createElement(
            'button',
            {
              className: 'lang-btn' + (lang === 'ru' ? ' active' : ''),
              onClick: () => setLang('ru'),
            },
            'RU'
          ),
          React.createElement(
            'button',
            {
              className: 'lang-btn' + (lang === 'en' ? ' active' : ''),
              onClick: () => setLang('en'),
            },
            'EN'
          )
        ),

        React.createElement(
          'div',
          { className: 'tech-badge' },
          React.createElement('span', { className: 'badge-dot' }),
          React.createElement('span', null, t.status)
        ),

        React.createElement('h1', null, 'Project'),

        React.createElement('p', { className: 'subtitle' }, t.subtitle),

        React.createElement(
          'div',
          { className: 'button-group' },
          React.createElement(
            Link,
            { to: '/game', className: 'primary-btn' },
            React.createElement(FaGamepad, { size: 20 }),
            React.createElement('span', null, t.play)
          ),
          React.createElement(
            'a',
            {
              href: 'https://t.me/Vaironcom',
              target: '_blank',
              rel: 'noopener noreferrer',
              className: 'telegram-btn',
            },
            React.createElement(FaTelegramPlane, { size: 20 }),
            React.createElement('span', null, t.telegram)
          )
        )
      )
    )
  );
};

export default Home;