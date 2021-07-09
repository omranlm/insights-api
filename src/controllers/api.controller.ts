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
}
