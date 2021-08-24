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
      return await this.queryRepository.execute(`select  max(c.id) max_changeset_id ,max(c.created_at) max_changeset_date
      from public.osm_changeset c;
      `);
    } catch (error) {

      throw new Error(error);


    }
  }
  @get('/countries')
  @response(200, {
    description: 'Query list of countries in insights ',
    content: { 'application/json': { schema: {} } },
  })
  async countries(
  ) {

    try {
      return await this.queryRepository.execute(`
      select name_en, boundary
      from public.boundaries
      `);
    } catch (error) {

      throw new Error(error);


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
}
