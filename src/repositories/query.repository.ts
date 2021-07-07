import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {PsqlDataSource} from '../datasources';
import {Query, QueryRelations} from '../models';

export class QueryRepository extends DefaultCrudRepository<
  Query,
  typeof Query.prototype.id,
  QueryRelations
> {
  constructor(
    @inject('datasources.psql') dataSource: PsqlDataSource,
  ) {
    super(Query, dataSource);
  }
}
