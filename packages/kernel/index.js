"use strict";
// Объявляем глобальные переменные
global.fs = require('fs');
global.path = require('path');
global.Sequelize = require('sequelize');
// Объявляем локальные переменные
let childProcess = require('child_process');
let isBuild = mp.config.build.version;
let initModules = false;
// Объявляем переменные для MySQL
global.MySQL = require('./mysql');
global.Op = Sequelize.Op;
// Массивы игнорированных модулей сервера
let ignoreServerModules = mp.config.modules.ignoreServer;
let activeServerModules = [];
// Массивы активных модулей сервера
let ignoreClientModules = mp.config.modules.ignoreClient;
let activeClientModules = [];

