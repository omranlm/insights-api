import { inject, lifeCycleObserver, LifeCycleObserver } from '@loopback/core';
import { juggler } from '@loopback/repository';

const config = {
  name: 'psql',
  connector: 'postgresql',
  url: '',
  host: process.env.HOST ? process.env.HOST : 'localhost',
  port: process.env.PORT ? process.env.PORT : 5432,
  user: process.env.USER ? process.env.USER : 'postgres',
  password: process.env.PASSWORD ? process.env.PASSWORD : '112112',
  database: process.env.DB_NAME ? process.env.DB_NAME : 'osmstats'
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
