import { QueryRepository } from '../repositories';
export declare class ApiController {
    queryRepository: QueryRepository;
    constructor(queryRepository: QueryRepository);
    count(count: number): Promise<import("@loopback/repository").AnyObject>;
    status(): Promise<{
        changeset: import("@loopback/repository").AnyObject;
        osmh: import("@loopback/repository").AnyObject;
    }>;
    countries(): Promise<import("@loopback/repository").AnyObject>;
    liveEvents(startDate: string, endDate: string, projects: string, hashtags?: string): Promise<{
        contributersCount: number;
        mappedFeatures: import("@loopback/repository").AnyObject;
    }>;
    africaKeyStats(country: string, key: string): Promise<import("@loopback/repository").AnyObject>;
    apCitiesCount(): Promise<import("@loopback/repository").AnyObject>;
    keyStats(region: string, country: string, key: string): Promise<import("@loopback/repository").AnyObject>;
    buildingStats(country: string): Promise<{
        countryBuildingsByMonth: import("@loopback/repository").AnyObject;
        countryValidatedBuildings: import("@loopback/repository").AnyObject;
    }>;
}
