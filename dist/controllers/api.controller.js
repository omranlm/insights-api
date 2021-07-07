"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiController = void 0;
const tslib_1 = require("tslib");
const repository_1 = require("@loopback/repository");
const rest_1 = require("@loopback/rest");
const repositories_1 = require("../repositories");
let ApiController = class ApiController {
    constructor(queryRepository) {
        this.queryRepository = queryRepository;
    }
    async count(count) {
        return this.queryRepository.execute(`select * from public.changesets limit ${count}`);
    }
    async status() {
        try {
            return await this.queryRepository.execute(`select  max(c.id), max(c.created_at)
      from public.osm_changeset c;
      `);
        }
        catch (error) {
            throw new Error(error);
        }
    }
};
tslib_1.__decorate([
    rest_1.get('/changesets/{count}'),
    rest_1.response(200, {
        description: 'Query model count',
        content: { 'application/json': { schema: repository_1.CountSchema } },
    }),
    tslib_1.__param(0, rest_1.param.path.number("count")),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Number]),
    tslib_1.__metadata("design:returntype", Promise)
], ApiController.prototype, "count", null);
tslib_1.__decorate([
    rest_1.get('/status'),
    rest_1.response(200, {
        description: 'Query Status',
        content: { 'application/json': { schema: {} } },
    }),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", Promise)
], ApiController.prototype, "status", null);
ApiController = tslib_1.__decorate([
    tslib_1.__param(0, repository_1.repository(repositories_1.QueryRepository)),
    tslib_1.__metadata("design:paramtypes", [repositories_1.QueryRepository])
], ApiController);
exports.ApiController = ApiController;
//# sourceMappingURL=api.controller.js.map