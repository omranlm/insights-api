import { inject, lifeCycleObserver, LifeCycleObserver } from '@loopback/core';
import { juggler } from '@loopback/repository';

const config = {
  name: 'psql',
  connector: 'postgresql',
  url: '',
  host: process.env.DB_HOST ? process.env.DB_HOST : 'localhost',
  port: process.env.DB_PORT ? process.env.DB_PORT : 5433,
  user: process.env.DB_USER ? process.env.DB_USER : 'postgres',
  password: process.env.DB_PASSWORD ? process.env.DB_PASSWORD : '112112',
  database: process.env.DB_NAME ? process.env.DB_NAME : 'postgres'
};

// Observe application's life cycle to disconnect the datasource when
// application is stopped. This allows the application to be shut down
// gracefully. The `stop()` method is inherited from `juggler.DataSource`.
// Learn more at https://loopback.io/doc/en/lb4/Life-cycle.html
@lifeCycleObserver('datasource')
export class PsqlDataSource extends juggler.DataSource
  implements LifeCycleObserver {
  static dataSourceName = 'psql';
  static readonly defaultConfig = config;

  constructor(
    @inject('datasources.config.psql', { optional: true })
    dsConfig: object = config,
  ) {
    super(dsConfig);
  }
}
