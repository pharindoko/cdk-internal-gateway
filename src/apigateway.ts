import {
  aws_apigateway as apigateway,
  aws_iam as iam,
  Names,
} from 'aws-cdk-lib';
import { IInterfaceVpcEndpoint } from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';


/**
 * Properties for ApiGatewayStack
 */
export interface InternalApiGatewayProps {
  /**
   * Stage name  used for all cloudformation resource names and internal aws resource names.
   */
  readonly stage: string;

  /**
   * List of custom domains names to be used for the API Gateway.
   */
  readonly domains: apigateway.IDomainName[];

  /**
   * VPC endpoint id of execute-api vpc endpoint. This endpoint will be used to forward requests from the load balancer`s target group to the api gateway.
   */
  readonly vpcEndpointId: IInterfaceVpcEndpoint;

  /**
   * Path for custom domain base path mapping that will be attached to the api gateway
   */
  readonly apiBasePathMappingPath?: string;
}

export abstract class InternalApiGateway extends Construct {

  /**
   * Internal API Gateway
   * This private api gateway is used to serve internal solutions (websites, apis, applications).
   * Attach your methods to this api gateway.
   * It is not exposed to the internet.
   * It is only accessible from the load balancer`s target group.
   */
  protected readonly internalApiGateway: apigateway.LambdaRestApi;
  constructor(scope: Construct, id: string, props: InternalApiGatewayProps) {
    super(scope, id);
    const uid: string = Names.uniqueId(scope);
    const apiResourcePolicy = new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.DENY,
          principals: [new iam.AnyPrincipal()],
          actions: ['execute-api:Invoke'],
          resources: ['execute-api:/*/*/*'],
          conditions: {
            StringNotEquals: {
              'aws:sourceVpce': props.vpcEndpointId.vpcEndpointId,
            },
          },
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          principals: [new iam.AnyPrincipal()],
          actions: ['execute-api:Invoke'],
          resources: ['execute-api:/*/*/*'],
          conditions: {
            StringEquals: {
              'aws:sourceVpce': props.vpcEndpointId.vpcEndpointId,
            },
          },
        }),
      ],
    });

    this.internalApiGateway = new apigateway.RestApi(
      this,
      `Gateway-${uid}`,
      {
        restApiName: `gateway-${uid}`,
        description: 'This service serves an internal api gateway',
        endpointConfiguration: {
          types: [apigateway.EndpointType.PRIVATE],
          vpcEndpoints: [props.vpcEndpointId],
        },
        policy: apiResourcePolicy,
        deployOptions: {
          stageName: props.stage,
        },
        binaryMediaTypes: ['*/*'],
        minimumCompressionSize: 1000,
      },
    );

    for (const domainItem of props.domains) {
      new apigateway.BasePathMapping(
        this,
        `-${domainItem}`,
        {
          domainName: domainItem,
          restApi: this.internalApiGateway,
          stage: this.internalApiGateway.deploymentStage,
          basePath: props.apiBasePathMappingPath ? props.apiBasePathMappingPath : '',
        },
      );
    }
  }
}
