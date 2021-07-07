import { DefaultCrudRepository } from '@loopback/repository';
import { PsqlDataSource } from '../datasources';
import { Query, QueryRelations } from '../models';
export declare class QueryRepository extends DefaultCrudRepository<Query, typeof Query.prototype.id, QueryRelations> {
    constructor(dataSource: PsqlDataSource);
}
