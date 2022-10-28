import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { LocalNSLookupResolverStack } from '../src';
import { ResourceQueryResolverStack } from '../src/custom-resource-resolver.stack';

test('VPC Endpoint Custom Resource Query Resolver Stack provider', () => {
  const app = new cdk.App();
  const stack = new ResourceQueryResolverStack(app, 'vpcEndpointResolverStack', {
    env: {
      account: '123456789101',
      region: 'eu-central-1',
    },
    serviceName: 'internalservice',
    stage: 'dev',
    vpcEndpointId: 'vpce-1234567890',
  });
  const template = Template.fromStack(stack);
  template.hasResourceProperties('AWS::Lambda::Function', Match.objectLike({
    Timeout: 120,
  }));
});

test('VPC Endpoint Local NS Lookup Query Resolver Stack provider', async () => {
  const app = new cdk.App();
  const stack = new LocalNSLookupResolverStack(app, 'vpcEndpointResolverStack', {
    env: {
      account: '123456789101',
      region: 'eu-central-1',
    },
    serviceName: 'internalservice',
    stage: 'dev',
    vpcEndpointDnsName: 'golem.de',
  });
  Template.fromStack(stack);

});