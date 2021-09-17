import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where,
} from '@loopback/repository';
import {
  post,
  param,
  get,
  getModelSchemaRef,
  patch,
  put,
  del,
  requestBody,
  response,
  HttpErrors,
} from '@loopback/rest';
import { Query } from '../models';
import { QueryRepository } from '../repositories';

export class ApiController {
  constructor(
    @repository(QueryRepository)
    public queryRepository: QueryRepository,
  ) { }


  @get('/changesets/{count}')
  @response(200, {
    description: 'Query model count',
    content: { 'application/json': { schema: CountSchema } },
  })
  async count(
    @param.path.number("count") count: number,
  ) {

    return this.queryRepository.execute(`select * from public.changesets limit ${count}`);
  }

  @get('/status')
  @response(200, {
    description: 'Query Status',
    content: { 'application/json': { schema: {} } },
  })
  async status(
  ) {

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
      }
    } catch (error) {

      throw new Error(error);
    }
  }

  @get('/loaded_countries')
  @response(200, {
    description: 'Query list of countries in insights ',
    content: { 'application/json': { schema: {} } },
  })
  async countries(
  ) {

    try {
      return await this.queryRepository.execute(`
      select b.name_en, priority
      from public.boundaries b
      where b.loaded
      order by 1;
      `);
    } catch (error) {

      throw new Error(error);


    }
  }

  @get('/live_events/{startDate}/{endDate}/{projects}/{hashtags}')
  @response(200, {
    description: 'Returns live events insights ',
    content: { 'application/json': { schema: {} } },
  })
  async liveEvents(@param.path.string("startDate") startDate: string,
    @param.path.string("endDate") endDate: string,
    @param.path.string("projects") projects: string,
    @param.path.string("hashtags") hashtags?: string
  ) {

    try {
      const query = projects.split(',');
      if (query.length === 0)
        throw new HttpErrors.Conflict('At least 1 project is required');
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
      console.log('Final query', sql)
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
      console.log('Final query sqlContributers', sqlContributers)
      const contributersCount = await this.queryRepository.execute(sqlContributers);


      return {
        contributersCount: +contributersCount[0]["total_contributers"],

        mappedFeatures
      }
    } catch (error) {

      throw new HttpErrors.Conflict(error);
    }
  }
  @get('/africa/{country}/{key}')
  @response(200, {
    description: 'Africa countires statistics for specific tag such as building, highway .. Only keys of the tags are considered and returned data is divided by monthly progress.',
    content: { 'application/json': { schema: {} } },
  })
  async africaKeyStats(
    @param.path.string("country") country: string,
    @param.path.string("key") key: string,

  ) {

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
    } catch (error) {

      throw new Error(error);


    }
  }
  @get('/ap_mach_cities_count')
  @response(200, {
    description: 'Returns the cities count for AP Chat and MAP hout',
    content: { 'application/json': { schema: {} } },
  })
  async apCitiesCount(
  ) {

    try {
      return await this.queryRepository.execute(`select *
      from public.ap_mach_cities_count`);
    } catch (error) {

      throw new Error(error);
    }
  }

  @get('/key-stats/{region}/{country}/{key}')
  @response(200, {
    description: 'region needs to be one of the following, asia, africa, central_america or south_america case sensitive',
    content: { 'application/json': { schema: {} } },
  })
  async keyStats(
    @param.path.string("region") region: string,
    @param.path.string("country") country: string,
    @param.path.string("key") key: string,

  ) {

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
    } catch (error) {

      throw new Error(error);


    }
  }
  @get('/country-insights/{country}')
  @response(200, {
    description: 'region needs to be one of the following, asia, africa, central_america or south_america case sensitive',
    content: { 'application/json': { schema: {} } },
  })
  async buildingStats(
    @param.path.string("country") country: string

  ) {
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
      }
    } catch (error) {

      throw new Error(error);


    }
  }
}
