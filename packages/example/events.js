"use strict";
// Тестовый модуль, призванный показать строение модулей
let example = require("./index.js");

module.exports = {
    // Событие инициализации сервера
    "init": () => {
        example.example();
        initModule(__dirname)
    }
}