import { LifeCycleObserver } from '@loopback/core';
import { juggler } from '@loopback/repository';
export declare class PsqlDataSource extends juggler.DataSource implements LifeCycleObserver {
    static dataSourceName: string;
    static readonly defaultConfig: {
        name: string;
        connector: string;
        url: string;
        host: string;
        port: string | number;
        user: string;
        password: string;
        database: string;
    };
    constructor(dsConfig?: object);
}
