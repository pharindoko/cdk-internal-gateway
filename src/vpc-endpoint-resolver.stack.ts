import { aws_ec2 as ec2, aws_iam as iam, aws_lambda as lambda, aws_lambda_nodejs as lambdaNodejs, CfnOutput, CustomResource, custom_resources, Duration, Stack, StackProps } from 'aws-cdk-lib';
import { IVpc } from 'aws-cdk-lib/aws-ec2';
import {
  AwsCustomResource,
  PhysicalResourceId
} from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';
import * as path from 'path';


export abstract class VpcEndpointIPResolver extends Stack {
  /**
   * Ip Addresses of the vpc endpoint used to forward requests from the load balancer`s target group to the internal api gateway.
   */
  public vcpEndpointIpAddresses: string[] | undefined;

  setIpAddressesOutput(): void {
    for (let i = 0; i < this.vcpEndpointIpAddresses!.length; i++) {
      new CfnOutput(this, `VPCEndpointIpAddress${i}`, {
        value: this.vcpEndpointIpAddresses![i],
        description: 'VPC Endpoint IP Address ',
      });
    }
  }
}

/**
 * Properties for VpcEndpointResolver
 */
export interface VPCEndpointResolverProps extends StackProps {
  /**
   * Service name  used for all cloudformation resource names and internal aws resource names.
   */
  readonly serviceName: string;

  /**
   * Stage name  used for all cloudformation resource names and internal aws resource names.
   */
  readonly stage: string;

  /**
   * VPC attached to the application load balancer.
   */
  readonly vpcId: IVpc;

  /**
   * Subnet to query the Ip addresses of the vpc endpoint.
   */
  readonly vpcSubnets: ec2.SubnetSelection;
}

/**
 * Properties for NSLookupResolverStack
 */
export interface NSLookupResolverProps extends VPCEndpointResolverProps {
  /**
   * VPC endpoint url of execute-api vpc endpoint. This endpoint will be used to forward requests from the load balancer`s target group to the api gateway.
   */
  readonly vpcEndpointUrl: string;
}

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
 * Stack that resolves the vpc endpoint ip addresses using the dns lookup.
 */
export class NSLookupResolverStack extends VpcEndpointIPResolver {
  constructor(scope: Construct, id: string, props: NSLookupResolverProps) {
    super(scope, id, props);

    // create new nodejs lambdafunction
    const lambdaFunction = new lambdaNodejs.NodejsFunction(scope, 'VpcEndpointResolver', {
      entry: path.join(__dirname, 'vpc-endpoint-resolver.lambda.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_14_X,
      bundling: {
        minify: true,
        sourceMap: true,
      },
      environment: {
        VPC_ENDPOINT_URL: props.vpcEndpointUrl,
      },
    });

    const myProvider = new custom_resources.Provider(scope, 'MyProvider', {
      onEventHandler: lambdaFunction,
      totalTimeout: Duration.minutes(1),
      vpc: props.vpcId,
      vpcSubnets: props.vpcSubnets

    });
    const NsLookupResponse = new CustomResource(scope, 'Resource1', { serviceToken: myProvider.serviceToken });
    this.vcpEndpointIpAddresses = NsLookupResponse.getAttString('IpAddresses').split(',');
    this.setIpAddressesOutput();
  }
}

/**
 * Stack that resolves the vpc endpoint ip addresses using the custom resource queries.
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
      scope,
      'DescribeVPCEndpoints',
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

    const eni = new AwsCustomResource(scope, 'DescribeNetworkInterfaces', {
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





