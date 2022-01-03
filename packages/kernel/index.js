"use strict";
// Объявляем глобальные переменные
global.fs = require('fs');
global.path = require('path');
global.Sequelize = require('sequelize');
// Объявляем локальные переменные
let childProcess = require('child_process');
let isBuild = mp.config.build.version;
let initModules = false;
let modulesToLoad = [];
let playersJoinPool = [];
// Объявляем переменные для MySQL
global.MySQL = require('./mysql');
global.Op = Sequelize.Op;
// Массивы игнорированных модулей сервера
let ignoreServerModules = mp.config.modules.ignoreServer;
let activeServerModules = [];
// Массивы активных модулей сервера
let ignoreClientModules = mp.config.modules.ignoreClient;
let activeClientModules = [];
// Подключение функций любого существующего, включенного модуля
global.call = (module) => {
    if (!fs.existsSync(path.dirname(__dirname)+ "/" + module + "/index.js")) return {
        isEmpty: true // Флаг, который говорит о том, что модуль отключен/отсутствует
    };
    if (ignoreServerModules.includes(module)) {
        let requireObject = require(path.dirname(__dirname)+ "/" + module + "/index.js");
        let newObject = {
            isEmpty: true // Флаг, который говорит о том, что модуль отключен/отсутствует
        };
        for (const key in requireObject) {
            const element = requireObject[key];
            if (typeof element === "function") {
                newObject[key] = () => {};
            }
            else {
                newObject[key] = {};
            }
        }
        return newObject;
    }
    return require(path.dirname(__dirname)+ "/" + module + "/index.js");
};
// Функция, которая вызвается модулем, для указания того, что он инициализирован
global.initModule = (dirname) => {
    let path = dirname.split("\\");
    let module = path[path.length - 1];
    modulesToLoad.splice(modulesToLoad.findIndex(x => x === module), 1);
    if (modulesToLoad.length === 0) {
        if (initModules) {
            throw new Error(`The server has already been initialized. Attempt to reinitialize from a module ${module}`);
        }
        initModules = true;
        console.log("[WORLDAGE.NET] All modules loaded successfully")
        playersJoinPool.forEach(player => {
            if (player == null) return;
            if (!mp.players.exists(player)) return;
            player.call('init', [activeClientModules]);
        });
    }
};
// Вызов подключения к БД, подключение всех модулей и вызов их инициализации
MySQL.connect(function() {
    fs.readdirSync(path.dirname(__dirname)).forEach(file => {
        if (!ignoreServerModules.includes(file) && fs.existsSync(path.dirname(__dirname)+ "/" + file + "/events.js")) {
            let events = require('../' + file + '/events');
            mp.events.add(events);
            activeServerModules.push(file);
            if (events["init"] != null) {
                modulesToLoad.push(file);
            }
        }
    });
    fs.readdirSync(path.dirname(__dirname) + "/../client_packages").forEach(file => {
        !['index.js', '.listcache'].includes(file) && !ignoreClientModules.includes(file) && activeClientModules.push(file);
    });
    mp.events.call('init');
});

mp.events.add("playerJoin", (player) => {
    player.dimension = player.id + 1;
});

mp.events.add('player.join', (player) => {
    if (modulesToLoad.length !== 0) return playersJoinPool.push(player);
    player.call('init', [activeClientModules]);
});
