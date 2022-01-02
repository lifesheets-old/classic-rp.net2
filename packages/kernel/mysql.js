"use strict";
// Массивы игнорированных модулей сервера
let ignoreServerModules = mp.config.modules.ignoreServer;
// Поведения и подключения к базе данных
module.exports = {
    sequelize: null,
    Models: {},
    connect: function(callback) {
        this.sequelize = new Sequelize(mp.config.mysql.dbname, mp.config.mysql.dbuser, mp.config.mysql.dbpass, {
            host: mp.config.mysql.dbhost,
            dialect: 'mysql',
            port: mp.config.mysql.dbport || 3306,
            logging: false,
            dialectOptions: { 
                connectTimeout: 360000 
            },
            pool: {
                max: 100,
                min: 2,
                acquire: 30000,
                idle: 10000,
                evict: 50000,
                acquTimeout: 3000
            },
        });
        this.loadModels();
        callback();
    },
    // Загрузка моделей таблиц из папки 'base' в каждом из модулей, кроме игнорируемого
    loadModels: function() {
        fs.readdirSync(path.dirname(__dirname)).forEach(dir => {
            if (dir != 'base' && !ignoreServerModules.includes(dir) && fs.existsSync(path.dirname(__dirname)+ "/" + dir + '/base')) {
                fs.readdirSync(path.dirname(__dirname)+ "/" + dir + '/base').forEach(file => {
                    let pathModules = path.dirname(__dirname) + "/" + dir + '/base/' + file;
                    let model = require(pathModules)(this.sequelize, Sequelize.DataTypes);
                    this.Models[model.name] = model;
                });
            }
        });
        for (var name in this.Models) {
            var model = this.Models[name];
            if (model.associate) model.associate(this.Models);
        }
        this.sequelize.sync();
    }
};
