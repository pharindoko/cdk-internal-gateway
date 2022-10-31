import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { Construct } from 'constructs';
import { ApiGatewayStack, ApiGatewayStackProps, InternalServiceStack } from '../src';


export class ApiGatewayStackTest extends ApiGatewayStack {
  constructor(scope: Construct, id: string, props: ApiGatewayStackProps) {
    super(scope, id, props);
    this.internalApiGateway.root.addMethod('GET', undefined);
  }
}

let app = new cdk.App();
let internalServiceStack: InternalServiceStack;

beforeAll(() => {
  internalServiceStack = new InternalServiceStack(app, 'internalServiceStack', {
    env: {
      account: '123456789101',
      region: 'eu-central-1',
    },
    vpcId: 'vpc-1234567890',
    internalSubnetIds: ['subnet-1234567890', 'subnet-1234567890'],
    vpcEndpointId: 'vpce-1234567890',
    vpcEndpointIPAddresses: ['192.168.2.1', '192.168.2.2'],
    subjectAlternativeNames: ['internalservice-dev.test.com', 'internalservice-dev.test2.com'],
    hostedZoneName: 'test.aws1234.com',
    subDomain: 'internalservice-dev',
  });
});



test('Api Gateway Stack provider', () => {
  const stack = new ApiGatewayStackTest(app, 'apiGatewayStack', {
    env: {
      account: '123456789101',
      region: 'eu-central-1',
    },
    stage: 'dev',
    domains: internalServiceStack.domains,
    vpcEndpointId: internalServiceStack.vpcEndpointId,
  });


  const template = Template.fromStack(stack);
  template.hasResourceProperties('AWS::ApiGateway::RestApi', Match.objectLike({
    "EndpointConfiguration": {
      "Types": [
        "PRIVATE"
      ],
    }
  }
  ));
  template.hasResourceProperties('AWS::ApiGateway::RestApi', Match.objectLike({
    "Policy": {
      "Statement": [
        {
          "Action": "execute-api:Invoke",
          "Condition": {
            "StringNotEquals": {
              "aws:sourceVpce": internalServiceStack.vpcEndpointId.vpcEndpointId,
            },
          },
          "Effect": "Deny",
          "Principal": {
            "AWS": "*",
          },
          "Resource": "execute-api:/*/*/*",
        },
        {
          "Action": "execute-api:Invoke",
          "Condition": {
            "StringEquals": {
              "aws:sourceVpce": internalServiceStack.vpcEndpointId.vpcEndpointId,
            },
          },
          "Effect": "Allow",
          "Principal": {
            "AWS": "*",
          },
          "Resource": "execute-api:/*/*/*",
        },
      ],
      "Version": "2012-10-17",
    },
  }
  ));

  expect(template).toMatchInlineSnapshot(`
Object {
  "Outputs": Object {
    "apiGatewayStackgatewayEndpoint8F2FE31A": Object {
      "Value": Object {
        "Fn::Join": Array [
          "",
          Array [
            "https://",
            Object {
              "Ref": "apiGatewayStackgatewayD04F9A2A",
            },
            ".execute-api.eu-central-1.",
            Object {
              "Ref": "AWS::URLSuffix",
            },
            "/",
            Object {
              "Ref": "apiGatewayStackgatewayDeploymentStagedevE6F48FB8",
            },
            "/",
          ],
        ],
      },
    },
  },
  "Parameters": Object {
    "BootstrapVersion": Object {
      "Default": "/cdk-bootstrap/hnb659fds/version",
      "Description": "Version of the CDK Bootstrap resources in this environment, automatically retrieved from SSM Parameter Store. [cdk:skip]",
      "Type": "AWS::SSM::Parameter::Value<String>",
    },
  },
  "Resources": Object {
    "apiGatewayStackgatewayAccount8A2D24FA": Object {
      "DeletionPolicy": "Retain",
      "DependsOn": Array [
        "apiGatewayStackgatewayD04F9A2A",
      ],
      "Properties": Object {
        "CloudWatchRoleArn": Object {
          "Fn::GetAtt": Array [
            "apiGatewayStackgatewayCloudWatchRole690D2586",
            "Arn",
          ],
        },
      },
      "Type": "AWS::ApiGateway::Account",
      "UpdateReplacePolicy": "Retain",
    },
    "apiGatewayStackgatewayCloudWatchRole690D2586": Object {
      "DeletionPolicy": "Retain",
      "Properties": Object {
        "AssumeRolePolicyDocument": Object {
          "Statement": Array [
            Object {
              "Action": "sts:AssumeRole",
              "Effect": "Allow",
              "Principal": Object {
                "Service": "apigateway.amazonaws.com",
              },
            },
          ],
          "Version": "2012-10-17",
        },
        "ManagedPolicyArns": Array [
          Object {
            "Fn::Join": Array [
              "",
              Array [
                "arn:",
                Object {
                  "Ref": "AWS::Partition",
                },
                ":iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs",
              ],
            ],
          },
        ],
      },
      "Type": "AWS::IAM::Role",
      "UpdateReplacePolicy": "Retain",
    },
    "apiGatewayStackgatewayD04F9A2A": Object {
      "Properties": Object {
        "BinaryMediaTypes": Array [
          "*/*",
        ],
        "Description": "This service serves apiGatewayStacks.",
        "EndpointConfiguration": Object {
          "Types": Array [
            "PRIVATE",
          ],
          "VpcEndpointIds": Array [
            "vpce-1234567890",
          ],
        },
        "MinimumCompressionSize": 1000,
        "Name": "apiGatewayStack-gateway",
        "Policy": Object {
          "Statement": Array [
            Object {
              "Action": "execute-api:Invoke",
              "Condition": Object {
                "StringNotEquals": Object {
                  "aws:sourceVpce": "vpce-1234567890",
                },
              },
              "Effect": "Deny",
              "Principal": Object {
                "AWS": "*",
              },
              "Resource": "execute-api:/*/*/*",
            },
            Object {
              "Action": "execute-api:Invoke",
              "Condition": Object {
                "StringEquals": Object {
                  "aws:sourceVpce": "vpce-1234567890",
                },
              },
              "Effect": "Allow",
              "Principal": Object {
                "AWS": "*",
              },
              "Resource": "execute-api:/*/*/*",
            },
          ],
          "Version": "2012-10-17",
        },
      },
      "Type": "AWS::ApiGateway::RestApi",
    },
    "apiGatewayStackgatewayDeployment92249B739a243da14bdc566ace7eda6e5a36b6be": Object {
      "DependsOn": Array [
        "apiGatewayStackgatewayGET2DDA0E8F",
      ],
      "Properties": Object {
        "Description": "This service serves apiGatewayStacks.",
        "RestApiId": Object {
          "Ref": "apiGatewayStackgatewayD04F9A2A",
        },
      },
      "Type": "AWS::ApiGateway::Deployment",
    },
    "apiGatewayStackgatewayDeploymentStagedevE6F48FB8": Object {
      "DependsOn": Array [
        "apiGatewayStackgatewayAccount8A2D24FA",
      ],
      "Properties": Object {
        "DeploymentId": Object {
          "Ref": "apiGatewayStackgatewayDeployment92249B739a243da14bdc566ace7eda6e5a36b6be",
        },
        "RestApiId": Object {
          "Ref": "apiGatewayStackgatewayD04F9A2A",
        },
        "StageName": "dev",
      },
      "Type": "AWS::ApiGateway::Stage",
    },
    "apiGatewayStackgatewayGET2DDA0E8F": Object {
      "Properties": Object {
        "AuthorizationType": "NONE",
        "HttpMethod": "GET",
        "Integration": Object {
          "Type": "MOCK",
        },
        "ResourceId": Object {
          "Fn::GetAtt": Array [
            "apiGatewayStackgatewayD04F9A2A",
            "RootResourceId",
          ],
        },
        "RestApiId": Object {
          "Ref": "apiGatewayStackgatewayD04F9A2A",
        },
      },
      "Type": "AWS::ApiGateway::Method",
    },
    "apiGatewayStackinternalServiceStackinternalServiceStackApiGatewayCustomDomainF8681355": Object {
      "Properties": Object {
        "BasePath": "",
        "DomainName": Object {
          "Fn::ImportValue": "internalServiceStack:ExportsOutputRefinternalServiceStackApiGatewayCustomDomainF3D19E8F3CFD2B8B",
        },
        "RestApiId": Object {
          "Ref": "apiGatewayStackgatewayD04F9A2A",
        },
        "Stage": Object {
          "Ref": "apiGatewayStackgatewayDeploymentStagedevE6F48FB8",
        },
      },
      "Type": "AWS::ApiGateway::BasePathMapping",
    },
    "apiGatewayStackinternalServiceStackinternalServiceStackdomaininternalservicedevtest2com6A175E79": Object {
      "Properties": Object {
        "BasePath": "",
        "DomainName": Object {
          "Fn::ImportValue": "internalServiceStack:ExportsOutputRefinternalServiceStackdomaininternalservicedevtest2com798F5BAC0D28D4EE",
        },
        "RestApiId": Object {
          "Ref": "apiGatewayStackgatewayD04F9A2A",
        },
        "Stage": Object {
          "Ref": "apiGatewayStackgatewayDeploymentStagedevE6F48FB8",
        },
      },
      "Type": "AWS::ApiGateway::BasePathMapping",
    },
    "apiGatewayStackinternalServiceStackinternalServiceStackdomaininternalservicedevtestcomAE5A88B0": Object {
      "Properties": Object {
        "BasePath": "",
        "DomainName": Object {
          "Fn::ImportValue": "internalServiceStack:ExportsOutputRefinternalServiceStackdomaininternalservicedevtestcom451134F428688DAD",
        },
        "RestApiId": Object {
          "Ref": "apiGatewayStackgatewayD04F9A2A",
        },
        "Stage": Object {
          "Ref": "apiGatewayStackgatewayDeploymentStagedevE6F48FB8",
        },
      },
      "Type": "AWS::ApiGateway::BasePathMapping",
    },
  },
  "Rules": Object {
    "CheckBootstrapVersion": Object {
      "Assertions": Array [
        Object {
          "Assert": Object {
            "Fn::Not": Array [
              Object {
                "Fn::Contains": Array [
                  Array [
                    "1",
                    "2",
                    "3",
                    "4",
                    "5",
                  ],
                  Object {
                    "Ref": "BootstrapVersion",
                  },
                ],
              },
            ],
          },
          "AssertDescription": "CDK bootstrap stack version 6 required. Please run 'cdk bootstrap' with a recent version of the CDK CLI.",
        },
      ],
    },
  },
}
`);
});

