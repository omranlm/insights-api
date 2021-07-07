import { QueryRepository } from '../repositories';
export declare class ApiController {
    queryRepository: QueryRepository;
    constructor(queryRepository: QueryRepository);
    count(count: number): Promise<import("@loopback/repository").AnyObject>;
    status(): Promise<import("@loopback/repository").AnyObject>;
}
