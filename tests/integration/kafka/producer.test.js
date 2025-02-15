const TestContainers = require('../../setup/testcontainers');
const { Kafka } = require('kafkajs');
const { KafkaProducer } = require('../../../src/services/kafka');

describe('Kafka Producer Integration Tests', () => {
  let containers;
  let kafka;
  let producer;
  let consumer;

  beforeAll(async () => {
    containers = await TestContainers.startKafka();
    
    kafka = new Kafka({
      brokers: [process.env.KAFKA_BROKERS],
      clientId: 'test-client'
    });

    producer = new KafkaProducer();
    consumer = kafka.consumer({ groupId: 'test-group' });
    
    await consumer.connect();
    await consumer.subscribe({ topic: 'product-updates', fromBeginning: true });
  });

  afterAll(async () => {
    await consumer.disconnect();
    if (containers) {
      await containers.stop();
    }
  });

  it('should successfully publish messages to Kafka', async () => {
    const message = {
      type: 'product-created',
      data: {
        id: '123',
        name: 'Test Product'
      }
    };

    await producer.send('product-updates', message);

    // Verify message was received
    const messages = [];
    await new Promise(resolve => {
      consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          messages.push(JSON.parse(message.value.toString()));
          if (messages.length > 0) resolve();
        },
      });
    });

    expect(messages[0]).toMatchObject(message);
  });
});