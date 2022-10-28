import { aws_iam as iam } from 'aws-cdk-lib';
import {
  AwsCustomResource,
  PhysicalResourceId,
} from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';
import { VpcEndpointIPResolver, VPCEndpointResolverProps } from './vpc-endpoint-ip-resolver';

/**
 * Properties for ResourceQueryResolverStack
 */
export interface ResourceQueryResolverProps extends VPCEndpointResolverProps {
  /**
   * VPC endpoint id of execute-api vpc endpoint. This endpoint will be used to forward requests from the load balancer`s target group to the api gateway.
   */
  readonly vpcEndpointId: string;
}

/**
 * Stack that resolves the vpc endpoint ip addresses executing the custom resource queries.
 */
export class ResourceQueryResolverStack extends VpcEndpointIPResolver {
  constructor(scope: Construct, id: string, props: ResourceQueryResolverProps) {
    super(scope, id, props);

    const vpcEndpointDescriptionCall = {
      service: 'EC2',
      action: 'describeVpcEndpoints',
      parameters: {
        VpcEndpointIds: [props.vpcEndpointId],
      },
      physicalResourceId: PhysicalResourceId.of(Date.now().toString()),
    };

    const describeVPCEndpoint = new AwsCustomResource(
      this,
      `${this.stackName}-DescribeVPCEndpoints`,
      {
        onCreate: vpcEndpointDescriptionCall,
        onUpdate: vpcEndpointDescriptionCall,
        policy: {
          statements: [
            new iam.PolicyStatement({
              actions: ['ec2:DescribeVPCEndpoints'],
              resources: ['*'],
            }),
          ],
        },
      },
    );

    const networkInterfaces0 = describeVPCEndpoint.getResponseField(
      'VpcEndpoints.0.NetworkInterfaceIds.0',
    );
    const networkInterfaces1 = describeVPCEndpoint.getResponseField(
      'VpcEndpoints.0.NetworkInterfaceIds.1',
    );

    const eni = new AwsCustomResource(this, `${this.stackName}-DescribeNetworkInterfaces`, {
      onCreate: {
        service: 'EC2',
        action: 'describeNetworkInterfaces',
        parameters: {
          NetworkInterfaceIds: [networkInterfaces0, networkInterfaces1],
        },
        physicalResourceId: PhysicalResourceId.of(Date.now().toString()),
      },
      onUpdate: {
        service: 'EC2',
        action: 'describeNetworkInterfaces',
        parameters: {
          NetworkInterfaceIds: [networkInterfaces0, networkInterfaces1],
        },
        physicalResourceId: PhysicalResourceId.of(Date.now().toString()),
      },
      policy: {
        statements: [
          new iam.PolicyStatement({
            actions: ['ec2:DescribeNetworkInterfaces'],
            resources: ['*'],
          }),
        ],
      },
    });

    const vpcEndpointIp1 = eni.getResponseField(
      'NetworkInterfaces.0.PrivateIpAddress',
    );
    const vpcEndpointIp2 = eni.getResponseField(
      'NetworkInterfaces.1.PrivateIpAddress',
    );
    this.vcpEndpointIpAddresses = [vpcEndpointIp1, vpcEndpointIp2];
    this.setIpAddressesOutput();
  }
}