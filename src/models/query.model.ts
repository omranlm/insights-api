import {Entity, model, property} from '@loopback/repository';

@model()
export class Query extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'string',
  })
  name?: string;


  constructor(data?: Partial<Query>) {
    super(data);
  }
}

export interface QueryRelations {
  // describe navigational properties here
}

export type QueryWithRelations = Query & QueryRelations;
