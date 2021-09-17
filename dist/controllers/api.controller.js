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
            const changeset = await this.queryRepository.execute(`select  max(c.id) max_changeset_id ,max(c.created_at) max_changeset_date
      from public.osm_changeset c;
      `);
            const osmh = await this.queryRepository.execute(`select  max(h.changeset) max_changeset_id ,max(h."timestamp") max_osm_element_his_date
      from public.osm_element_history h;
      `);
            return {
                changeset,
                osmh
            };
        }
        catch (error) {
            throw new Error(error);
        }
    }
    async countries() {
        try {
            return await this.queryRepository.execute(`
      select b.name_en, priority
      from public.boundaries b
      where b.loaded
      order by 1;
      `);
        }
        catch (error) {
            throw new Error(error);
        }
    }
    async liveEvents(startDate, endDate, projects, hashtags) {
        try {
            const query = projects.split(',');
            if (query.length === 0)
                throw new rest_1.HttpErrors.Conflict('At least 1 project is required');
            let str = '';
            for (const p of query) {
                if (p.trim() !== '')
                    str = str + `or (c.tags -> 'comment') ~~ '%hotosm-project-${p.trim()}%' or (c.tags -> 'hashtags') ~~ '%hotosm-project-${p.trim()}%'`;
            }
            str = str.substring(3);
            // add hashtags
            let str2 = '';
            if (hashtags && hashtags !== '') {
                const hash = hashtags.split(',');
                for (const p of hash) {
                    if (p.trim() !== '')
                        str2 = str2 + `or (c.tags -> 'comment') ~~ '%${p.trim()}%' or (c.tags -> 'hashtags') ~~ '%${p.trim()}%'`;
                }
            }
            const sql = `
      select t.key,t.action, count(distinct id)
      from (select (each(osh.tags)).key, (each(osh.tags)).value,osh.*
      from public.osm_element_history osh
      where osh.changeset in (select c.id
                  from public.osm_changeset c
                  where c.created_at  between '${startDate}' and '${endDate}'
                  and (
                    ${str}
                    ${str2}
                  )
                  )
                  ) as t
        group by t.key,t.action
        order by 3 desc
      `;
            console.log('Final query', sql);
            const mappedFeatures = await this.queryRepository.execute(sql);
            const sqlContributers = `
      select count(distinct uid) Total_contributers
      from (select (each(osh.tags)).key, (each(osh.tags)).value,osh.*
            from public.osm_element_history osh
            where osh.changeset in (select c.id
						from public.osm_changeset c
                  where c.created_at  between '${startDate.trim()}' and '${endDate.trim()}'
                  and (
                    ${str}
                    ${str2}
                  )
                  )
                  ) as t
      `;
            console.log('Final query sqlContributers', sqlContributers);
            const contributersCount = await this.queryRepository.execute(sqlContributers);
            return {
                contributersCount: +contributersCount[0]["total_contributers"],
                mappedFeatures
            };
        }
        catch (error) {
            throw new rest_1.HttpErrors.Conflict(error);
        }
    }
    async africaKeyStats(country, key) {
        try {
            return await this.queryRepository.execute(`with all_hot as (with acc_hot as (select  t.key, t.country , t.by_month, sum(total_count) total
      from (select country, osm_changeset ,by_month  , "key" , total_count
          from africa.keys_stats
          where country = '${country}'
          and "key" = '${key}') t
      where t.osm_changeset in (select  id
                    from public.hot_changeset )
      group by  t.key, t.country  ,t.by_month)
        select country,
            key,
            by_month,
            total,
            (select sum(total) from acc_hot inner_hot where  inner_hot.by_month <= acc.by_month) as accmulative_total
        from acc_hot acc
        order by 1, 3
        ),
      all_osm as ( with acc_osm as (select t.country, t.key , t.by_month, sum(total_count) total
        from (select country, osm_changeset ,by_month  , "key" , total_count
          from africa.keys_stats
          where country = '${country}'
          and "key" = '${key}') t
        group by  t.key, t.country, t.by_month
        order by 1, 3)
        select country,
            key,
            by_month,
            total,
            (select sum(total) from acc_osm inner_osm where  inner_osm.by_month <= accO.by_month) as accmulative_total
        from acc_osm accO
        order by 1, 3)
      select ah.country,
      ah.key,
      ah.by_month by_month_hot,
      ao.by_month by_month_osm,
      (case when ah.total is null then 0 else ah.total end) hot_mapped,
      ah.accmulative_total  accmulative_total_hot,
      ao.total all_osm_mapped,
      ao.accmulative_total accmulative_total_osm
      from all_hot ah full outer join all_osm ao
      on ao.key = ah.key and ao.by_month = ah.by_month
      order by 4 desc
      `);
        }
        catch (error) {
            throw new Error(error);
        }
    }
    async apCitiesCount() {
        try {
            return await this.queryRepository.execute(`select *
      from public.ap_mach_cities_count`);
        }
        catch (error) {
            throw new Error(error);
        }
    }
    async keyStats(region, country, key) {
        try {
            return await this.queryRepository.execute(`with all_hot as (with acc_hot as (select  t.key, t.country , t.by_month, sum(total_count) total
      from (select country, osm_changeset ,by_month  , "key" , total_count
          from ${region}.keys_stats
          where country = '${country}'
          and "key" = '${key}') t
      where t.osm_changeset in (select  id
                    from public.hot_changeset )
      group by  t.key, t.country  ,t.by_month)
        select country,
            key,
            by_month,
            total,
            (select sum(total) from acc_hot inner_hot where  inner_hot.by_month <= acc.by_month) as accmulative_total
        from acc_hot acc
        order by 1, 3
        ),
      all_osm as ( with acc_osm as (select t.country, t.key , t.by_month, sum(total_count) total
        from (select country, osm_changeset ,by_month  , "key" , total_count
          from ${region}.keys_stats
          where country = '${country}'
          and "key" = '${key}') t
        group by  t.key, t.country, t.by_month
        order by 1, 3)
        select country,
            key,
            by_month,
            total,
            (select sum(total) from acc_osm inner_osm where  inner_osm.by_month <= accO.by_month) as accmulative_total
        from acc_osm accO
        order by 1, 3)
      select ah.country,
      ah.key,
      ah.by_month by_month_hot,
      ao.by_month by_month_osm,
      (case when ah.total is null then 0 else ah.total end) hot_mapped,
      ah.accmulative_total  accmulative_total_hot,
      ao.total all_osm_mapped,
      ao.accmulative_total accmulative_total_osm
      from all_hot ah full outer join all_osm ao
      on ao.key = ah.key and ao.by_month = ah.by_month
      order by 4 desc
      `);
        }
        catch (error) {
            throw new Error(error);
        }
    }
    async buildingStats(country) {
        try {
            const countryBuildingsByMonth = await this.queryRepository.execute(`
      select *
      from public.country_insights ci
      where ci.country = '${country}'
      and by_month < now()
      order by 2
      `);
            const countryValidatedBuildings = await this.queryRepository.execute(`
      select *
        from public.country_insights2
        where country = '${country}'
      `);
            return {
                countryBuildingsByMonth,
                countryValidatedBuildings: countryValidatedBuildings
            };
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
tslib_1.__decorate([
    rest_1.get('/loaded_countries'),
    rest_1.response(200, {
        description: 'Query list of countries in insights ',
        content: { 'application/json': { schema: {} } },
    }),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", Promise)
], ApiController.prototype, "countries", null);
tslib_1.__decorate([
    rest_1.get('/live_events/{startDate}/{endDate}/{projects}/{hashtags}'),
    rest_1.response(200, {
        description: 'Returns live events insights ',
        content: { 'application/json': { schema: {} } },
    }),
    tslib_1.__param(0, rest_1.param.path.string("startDate")),
    tslib_1.__param(1, rest_1.param.path.string("endDate")),
    tslib_1.__param(2, rest_1.param.path.string("projects")),
    tslib_1.__param(3, rest_1.param.path.string("hashtags")),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String, String, String, String]),
    tslib_1.__metadata("design:returntype", Promise)
], ApiController.prototype, "liveEvents", null);
tslib_1.__decorate([
    rest_1.get('/africa/{country}/{key}'),
    rest_1.response(200, {
        description: 'Africa countires statistics for specific tag such as building, highway .. Only keys of the tags are considered and returned data is divided by monthly progress.',
        content: { 'application/json': { schema: {} } },
    }),
    tslib_1.__param(0, rest_1.param.path.string("country")),
    tslib_1.__param(1, rest_1.param.path.string("key")),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String, String]),
    tslib_1.__metadata("design:returntype", Promise)
], ApiController.prototype, "africaKeyStats", null);
tslib_1.__decorate([
    rest_1.get('/ap_mach_cities_count'),
    rest_1.response(200, {
        description: 'Returns the cities count for AP Chat and MAP hout',
        content: { 'application/json': { schema: {} } },
    }),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", Promise)
], ApiController.prototype, "apCitiesCount", null);
tslib_1.__decorate([
    rest_1.get('/key-stats/{region}/{country}/{key}'),
    rest_1.response(200, {
        description: 'region needs to be one of the following, asia, africa, central_america or south_america case sensitive',
        content: { 'application/json': { schema: {} } },
    }),
    tslib_1.__param(0, rest_1.param.path.string("region")),
    tslib_1.__param(1, rest_1.param.path.string("country")),
    tslib_1.__param(2, rest_1.param.path.string("key")),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String, String, String]),
    tslib_1.__metadata("design:returntype", Promise)
], ApiController.prototype, "keyStats", null);
tslib_1.__decorate([
    rest_1.get('/country-insights/{country}'),
    rest_1.response(200, {
        description: 'region needs to be one of the following, asia, africa, central_america or south_america case sensitive',
        content: { 'application/json': { schema: {} } },
    }),
    tslib_1.__param(0, rest_1.param.path.string("country")),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String]),
    tslib_1.__metadata("design:returntype", Promise)
], ApiController.prototype, "buildingStats", null);
ApiController = tslib_1.__decorate([
    tslib_1.__param(0, repository_1.repository(repositories_1.QueryRepository)),
    tslib_1.__metadata("design:paramtypes", [repositories_1.QueryRepository])
], ApiController);
exports.ApiController = ApiController;
//# sourceMappingURL=api.controller.js.map