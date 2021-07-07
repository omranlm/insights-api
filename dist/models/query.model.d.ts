import { Entity } from '@loopback/repository';
export declare class Query extends Entity {
    id?: number;
    name?: string;
    constructor(data?: Partial<Query>);
}
export interface QueryRelations {
}
export declare type QueryWithRelations = Query & QueryRelations;
