import { DynamicModule, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ClientProxyFactory, Transport } from "@nestjs/microservices";
import { MessageBrokerConfig } from "@app/common/message-broker/message-broker-config.interface";

@Module({})
export class MessageBroker {
    static async forRootAsync(options: {
        useFactory: (config: ConfigService) => MessageBrokerConfig;
        inject?: any[];
    }): Promise<DynamicModule> {
        return {
            global: true,
            module: MessageBroker,
            imports: [ConfigModule],
            providers: [
                {
                    provide: "RABBITMQ_CONFIG",
                    useFactory: options.useFactory,
                    inject: options.inject || [ConfigService],
                },
                {
                    provide: "RABBITMQ_SERVICE",
                    useFactory: async (config: MessageBrokerConfig) => {
                        const url = `amqp://${config.RABBITMQ_USER}:${config.RABBITMQ_PASS}@${config.RABBITMQ_HOST}:${config.RABBITMQ_PORT}`;

                        return ClientProxyFactory.create({
                            transport: Transport.RMQ,
                            options: {
                                urls: [url],
                                queue: config.RABBITMQ_QUEUE,
                                queueOptions: {
                                    durable: true,
                                },
                            },
                        });
                    },
                    inject: ["RABBITMQ_CONFIG"],
                },
            ],
            exports: ["RABBITMQ_SERVICE"],
        };
    }
}
