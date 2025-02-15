const { KafkaContainer } = require('@testcontainers/kafka');
const { LocalStackContainer } = require('@testcontainers/localstack');

class TestContainers {
  static async startKafka() {
    const kafkaContainer = await new KafkaContainer()
      .withExposedPorts(9092)
      .start();

    process.env.KAFKA_BROKERS = `${kafkaContainer.getHost()}:${kafkaContainer.getMappedPort(9092)}`;
    return kafkaContainer;
  }

  static async startLocalStack() {
    const localstackContainer = await new LocalStackContainer()
      .withServices(['s3', 'dynamodb'])
      .withExposedPorts(4566)
      .start();

    process.env.AWS_ENDPOINT = `http://${localstackContainer.getHost()}:${localstackContainer.getMappedPort(4566)}`;
    return localstackContainer;
  }

  static async startAll() {
    const kafka = await this.startKafka();
    const localstack = await this.startLocalStack();
    return { kafka, localstack };
  }
}

module.exports = TestContainers;
