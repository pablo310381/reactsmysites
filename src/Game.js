import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import './Game.css';

const map = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,1,0,0,0,0,0,0,0,2,0,1],
  [1,0,1,0,1,0,1,1,1,1,1,0,1,0,1],
  [1,0,1,0,0,0,0,0,2,0,1,0,1,0,1],
  [1,0,1,1,1,1,1,1,1,0,1,0,1,0,1],
  [1,0,0,0,0,0,0,3,1,0,0,0,1,0,1],
  [1,1,1,0,1,1,1,0,1,1,1,1,1,0,1],
  [1,2,0,0,0,0,1,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,0,1,1,1,1,1,0,1,1,1],
  [1,0,0,0,1,0,0,0,0,0,1,0,0,0,1],
  [1,0,1,0,1,1,1,1,1,0,1,1,1,0,1],
  [1,0,1,0,0,0,2,0,1,0,0,0,1,0,1],
  [1,0,1,1,1,1,1,0,1,1,1,0,1,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,4,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

const wallSize = 2;

const Game = () => {
  const [collectedKeys, setCollectedKeys] = useState(0);
  const [hp, setHp] = useState(100);
  const [isDead, setIsDead] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertText, setAlertText] = useState('');
  const [alertTitle, setAlertTitle] = useState('SYSTEM MESSAGE');
  const [showOverlay, setShowOverlay] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);

  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const monsterRef = useRef(null);
  const monsterDataRef = useRef({ gridX: 7, gridZ: 5 });
  const keys3DRef = useRef([]);
  const targetAngleRef = useRef(0);
  const isGameOverRef = useRef(false);
  const playerPosRef = useRef({ x: 1, z: 1 });
  const collectedKeysRef = useRef(0);
  const showAlertRef = useRef(false);
  const hpRef = useRef(100);
  const monsterIntervalRef = useRef(null);
  const animationFrameRef = useRef(null);
  const isMovingRef = useRef(false);
  const moveCooldownRef = useRef(false);

  const showAlertMessage = useCallback((text, title = "SYSTEM MESSAGE", isGameOver = false) => {
    setAlertText(text);
    setAlertTitle(title);
    setShowAlert(true);
    showAlertRef.current = true;
    if (isGameOver) {
      setIsDead(true);
      isGameOverRef.current = true;
    }
  }, []);

  const closeAlert = useCallback(() => {
    if (isDead) {
      window.location.reload();
    } else {
      setShowAlert(false);
      showAlertRef.current = false;
    }
  }, [isDead]);

  const updateHP = useCallback((newHp) => {
    hpRef.current = newHp;
    setHp(newHp);
    if (newHp <= 0) {
      showAlertMessage("Критическое повреждение. Система уничтожена.", "CRITICAL ERROR", true);
    }
  }, [showAlertMessage]);

  const updateMonster = useCallback(() => {
    if (!monsterRef.current || showAlertRef.current || isGameOverRef.current) return;
    if (!cameraRef.current) return;

    const pGX = Math.round(cameraRef.current.position.x / wallSize);
    const pGZ = Math.round(cameraRef.current.position.z / wallSize);

    let nextX = monsterDataRef.current.gridX;
    let nextZ = monsterDataRef.current.gridZ;
    let moved = false;

    if (monsterDataRef.current.gridX !== pGX) {
      let stepX = monsterDataRef.current.gridX < pGX ? 1 : -1;
      let checkX = monsterDataRef.current.gridX + stepX;
      if (checkX >= 0 && checkX < map[0].length &&
          map[monsterDataRef.current.gridZ][checkX] !== 1) {
        nextX = checkX;
        moved = true;
      }
    }

    if (!moved && monsterDataRef.current.gridZ !== pGZ) {
      let stepZ = monsterDataRef.current.gridZ < pGZ ? 1 : -1;
      let checkZ = monsterDataRef.current.gridZ + stepZ;
      if (checkZ >= 0 && checkZ < map.length &&
          map[checkZ][monsterDataRef.current.gridX] !== 1) {
        nextZ = checkZ;
        moved = true;
      }
    }

    if (!moved) {
      const dirs = [[1,0], [-1,0], [0,1], [0,-1]];
      const shuffled = [...dirs].sort(() => Math.random() - 0.5);
      for (let dir of shuffled) {
        let checkX = monsterDataRef.current.gridX + dir[0];
        let checkZ = monsterDataRef.current.gridZ + dir[1];
        if (checkZ >= 0 && checkZ < map.length &&
            checkX >= 0 && checkX < map[0].length &&
            map[checkZ][checkX] !== 1) {
          nextX = checkX;
          nextZ = checkZ;
          break;
        }
      }
    }

    monsterDataRef.current.gridX = nextX;
    monsterDataRef.current.gridZ = nextZ;
    monsterRef.current.position.x = monsterDataRef.current.gridX * wallSize;
    monsterRef.current.position.z = monsterDataRef.current.gridZ * wallSize;

    if (monsterDataRef.current.gridX === pGX && monsterDataRef.current.gridZ === pGZ) {
      const newHp = hpRef.current - 25;
      updateHP(newHp);
    }
  }, [updateHP]);

  const drawMap = useCallback(() => {
    const minimap = document.getElementById('minimap');
    if (!minimap || !cameraRef.current) return;

    minimap.innerHTML = '';
    const pX = Math.round(cameraRef.current.position.x / wallSize);
    const pZ = Math.round(cameraRef.current.position.z / wallSize);

    for (let z = 0; z < map.length; z++) {
      for (let x = 0; x < map[0].length; x++) {
        const d = document.createElement('div');
        d.className = 'cell';
        if (map[z][x] === 1) d.classList.add('wall');
        if (x === pX && z === pZ) d.classList.add('player');
        if (x === monsterDataRef.current.gridX && z === monsterDataRef.current.gridZ) d.classList.add('monster');
        if (keys3DRef.current.find(k => k.userData.gx === x && k.userData.gz === z)) d.classList.add('key');
        minimap.appendChild(d);
      }
    }
  }, []);

  const movePlayer = useCallback((direction) => {
    if (!cameraRef.current || showAlertRef.current || isGameOverRef.current) return false;
    if (moveCooldownRef.current) return false;

    moveCooldownRef.current = true;
    setTimeout(() => {
      moveCooldownRef.current = false;
    }, 150);

    const camera = cameraRef.current;
    let angle = targetAngleRef.current + Math.PI;

    if (direction === 'forward') {
      const nx = camera.position.x + Math.sin(angle) * wallSize;
      const nz = camera.position.z + Math.cos(angle) * wallSize;
      const gx = Math.round(nx / wallSize);
      const gz = Math.round(nz / wallSize);

      if (gz >= 0 && gz < map.length && gx >= 0 && gx < map[0].length && map[gz][gx] !== 1) {
        camera.position.x = nx;
        camera.position.z = nz;
        playerPosRef.current = { x: gx, z: gz };

        const keyIndex = keys3DRef.current.findIndex(k => k.userData.gx === gx && k.userData.gz === gz);
        if (keyIndex !== -1) {
          const keyMesh = keys3DRef.current[keyIndex];
          if (sceneRef.current) {
            sceneRef.current.remove(keyMesh);
          }
          keys3DRef.current.splice(keyIndex, 1);
          collectedKeysRef.current += 1;
          setCollectedKeys(collectedKeysRef.current);
        }

        if (map[gz][gx] === 4) {
          if (collectedKeysRef.current >= 4) {
            showAlertMessage("Доступ разрешен. Вы покинули зону.", "MISSION COMPLETE", true);
          } else {
            showAlertMessage(`Ошибка доступа. Собрано ключей: ${collectedKeysRef.current} из 4.`, "ACCESS DENIED");
          }
        }

        return true;
      }
    }
    return false;
  }, [showAlertMessage]);

  useEffect(() => {
    if (!gameStarted) return;

    // Очистка предыдущей игры
    if (sceneRef.current) {
      while(sceneRef.current.children.length > 0) {
        sceneRef.current.remove(sceneRef.current.children[0]);
      }
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (monsterIntervalRef.current) {
      clearInterval(monsterIntervalRef.current);
    }
    if (rendererRef.current && rendererRef.current.domElement && rendererRef.current.domElement.parentNode) {
      rendererRef.current.domElement.parentNode.removeChild(rendererRef.current.domElement);
    }

    keys3DRef.current = [];
    collectedKeysRef.current = 0;
    hpRef.current = 100;
    isGameOverRef.current = false;
    showAlertRef.current = false;
    targetAngleRef.current = 0;
    moveCooldownRef.current = false;

    setCollectedKeys(0);
    setHp(100);
    setIsDead(false);
    setShowAlert(false);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    scene.fog = new THREE.Fog(0x0a0a0a, 5, 25);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;

    if (containerRef.current) {
      containerRef.current.appendChild(renderer.domElement);
    }

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0x00ff00, 0.3);
    directionalLight.position.set(10, 20, 10);
    scene.add(directionalLight);

    const wallGeo = new THREE.BoxGeometry(wallSize, 3, wallSize);
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x1a3a1a,
      roughness: 0.8,
      metalness: 0.2
    });

    // Создание стен
    for (let z = 0; z < map.length; z++) {
      for (let x = 0; x < map[z].length; x++) {
        if (map[z][x] === 1) {
          const wall = new THREE.Mesh(wallGeo, wallMat);
          wall.position.set(x * wallSize, 1.5, z * wallSize);
          scene.add(wall);
        }
      }
    }

    // Создание пола
    const floorGeo = new THREE.PlaneGeometry(map[0].length * wallSize, map.length * wallSize);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0a1a0a,
      roughness: 0.9,
      metalness: 0.1
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set((map[0].length - 1) * wallSize / 2, 0, (map.length - 1) * wallSize / 2);
    scene.add(floor);

    // Создание объектов
    for (let z = 0; z < map.length; z++) {
      for (let x = 0; x < map[z].length; x++) {
        if (map[z][x] === 2) {
          const keyGroup = new THREE.Group();
          const keyGeo = new THREE.TorusGeometry(0.3, 0.1, 8, 16);
          const keyMat = new THREE.MeshStandardMaterial({
            color: 0xffd700,
            emissive: 0xffd700,
            emissiveIntensity: 0.5,
            metalness: 0.8,
            roughness: 0.2
          });
          const key = new THREE.Mesh(keyGeo, keyMat);
          keyGroup.add(key);
          keyGroup.position.set(x * wallSize, 1, z * wallSize);
          keyGroup.userData = { gx: x, gz: z };
          scene.add(keyGroup);
          keys3DRef.current.push(keyGroup);
        } else if (map[z][x] === 3) {
          const monsterGroup = new THREE.Group();
          const bodyGeo = new THREE.ConeGeometry(0.8, 2, 4);
          const bodyMat = new THREE.MeshStandardMaterial({
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 0.3,
            roughness: 0.3,
            metalness: 0.5
          });
          const body = new THREE.Mesh(bodyGeo, bodyMat);
          monsterGroup.add(body);

          const eyeGeo = new THREE.SphereGeometry(0.2, 8, 8);
          const eyeMat = new THREE.MeshStandardMaterial({
            color: 0xffff00,
            emissive: 0xffff00,
            emissiveIntensity: 1
          });
          const eye = new THREE.Mesh(eyeGeo, eyeMat);
          eye.position.y = 0.5;
          monsterGroup.add(eye);

          monsterGroup.position.set(x * wallSize, 1, z * wallSize);
          scene.add(monsterGroup);
          monsterRef.current = monsterGroup;
          monsterDataRef.current = { gridX: x, gridZ: z };
        } else if (map[z][x] === 4) {
          const exitGeo = new THREE.BoxGeometry(wallSize, 4, 0.2);
          const exitMat = new THREE.MeshStandardMaterial({
            color: 0x00ff00,
            emissive: 0x00ff00,
            emissiveIntensity: 0.7,
            roughness: 0.1,
            metalness: 0.9
          });
          const exit = new THREE.Mesh(exitGeo, exitMat);
          exit.position.set(x * wallSize, 2, z * wallSize);
          scene.add(exit);
        }
      }
    }

    const spotLight = new THREE.PointLight(0x00ff00, 0.8, 10);
    camera.add(spotLight);
    scene.add(camera);

    // Начальная позиция игрока
    camera.position.set(wallSize, 1.6, wallSize);
    playerPosRef.current = { x: 1, z: 1 };

    // Обработчик клавиш
    const handleKeyDown = (e) => {
      if (showAlertRef.current || isGameOverRef.current) return;

      e.preventDefault();

      switch(e.key) {
        case 'ArrowLeft':
          targetAngleRef.current += Math.PI / 2;
          break;
        case 'ArrowRight':
          targetAngleRef.current -= Math.PI / 2;
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
          movePlayer('forward');
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Интервал для монстра
    monsterIntervalRef.current = setInterval(updateMonster, 700);

    // Анимация
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);

      if (cameraRef.current) {
        camera.rotation.y += (targetAngleRef.current - camera.rotation.y) * 0.15;
      }

      // Анимация ключей
      keys3DRef.current.forEach((key, index) => {
        key.rotation.y += 0.02;
        key.position.y = 1 + Math.sin(Date.now() * 0.003 + index) * 0.2;
      });

      if (sceneRef.current && cameraRef.current && rendererRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }

      drawMap();
    };
    animate();

    // Обработчик ресайза
    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
      if (monsterIntervalRef.current) {
        clearInterval(monsterIntervalRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameStarted]);

  const handleOverlayClick = useCallback(() => {
    setShowOverlay(false);
    setGameStarted(true);
  }, []);

  return React.createElement(
    'div',
    { id: 'game-container', className: 'game-container', ref: containerRef },
    showOverlay && React.createElement(
      'div',
      { id: 'overlay', onClick: handleOverlayClick },
      React.createElement('h1', null, 'SYSTEM READY'),
      React.createElement('p', null, 'Используйте СТРЕЛКИ для движения.', React.createElement('br'), 'Соберите 4 ключа и найдите выход.', React.createElement('br'), 'Избегайте красного монстра!'),
      React.createElement('p', { className: 'click-hint' }, 'Кликните, чтобы начать')
    ),
    showAlert && React.createElement(
      'div',
      { id: 'custom-alert' },
      React.createElement('h2', { id: 'alert-title' }, alertTitle),
      React.createElement('p', { id: 'alert-text' }, alertText),
      React.createElement(
        'button',
        { className: 'btn', id: 'alert-btn', onClick: closeAlert },
        isDead ? 'RESTART SYSTEM' : 'OK'
      )
    ),
    React.createElement(
      'div',
      { id: 'hud' },
      React.createElement('div', { className: 'hud-item' },
        'STATUS: ',
        React.createElement('span', { className: 'status-active' }, 'ACTIVE')
      ),
      React.createElement('div', { className: 'hud-item' },
        'KEYS: ',
        React.createElement('span', { id: 'keys', className: 'hud-value' }, collectedKeys),
        ' / 4'
      ),
      React.createElement('div', { className: 'hud-item' },
        'HP: ',
        React.createElement('span', {
          id: 'hp',
          className: 'hud-value',
          style: { color: hp <= 25 ? '#ff4444' : '#00ff00' }
        }, hp),
        '%'
      )
    ),
    React.createElement(
      'div',
      { id: 'minimap-container' },
      React.createElement('div', {
        id: 'minimap',
        style: {
          display: 'grid',
          gridTemplateColumns: `repeat(${map[0].length}, 1fr)`,
          gridTemplateRows: `repeat(${map.length}, 1fr)`
        }
      })
    )
  );
};

export default Game;