"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PsqlDataSource = void 0;
const tslib_1 = require("tslib");
const core_1 = require("@loopback/core");
const repository_1 = require("@loopback/repository");
const config = {
    name: 'psql',
    connector: 'postgresql',
    url: '',
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: '112112',
    database: 'osmstats'
};
// Observe application's life cycle to disconnect the datasource when
// application is stopped. This allows the application to be shut down
// gracefully. The `stop()` method is inherited from `juggler.DataSource`.
// Learn more at https://loopback.io/doc/en/lb4/Life-cycle.html
let PsqlDataSource = class PsqlDataSource extends repository_1.juggler.DataSource {
    constructor(dsConfig = config) {
        super(dsConfig);
    }
};
PsqlDataSource.dataSourceName = 'psql';
PsqlDataSource.defaultConfig = config;
PsqlDataSource = tslib_1.__decorate([
    core_1.lifeCycleObserver('datasource'),
    tslib_1.__param(0, core_1.inject('datasources.config.psql', { optional: true })),
    tslib_1.__metadata("design:paramtypes", [Object])
], PsqlDataSource);
exports.PsqlDataSource = PsqlDataSource;
//# sourceMappingURL=psql.datasource.js.map