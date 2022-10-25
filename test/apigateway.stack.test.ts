import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
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
    serviceName: 'internalservice',
    stage: 'dev',
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
    serviceName: 'internalservice',
    stage: 'dev',
    domains: internalServiceStack.domains,
    vpcEndpointId: internalServiceStack.vpcEndpointId,
  });


  const template = Template.fromStack(stack);
  expect(template).toMatchInlineSnapshot(`
Object {
  "Outputs": Object {
    "ApiGatewayApiGatewayStackTestEndpointB2F94B58": Object {
      "Value": Object {
        "Fn::Join": Array [
          "",
          Array [
            "https://",
            Object {
              "Ref": "ApiGatewayApiGatewayStackTest446B3FCA",
            },
            ".execute-api.eu-central-1.",
            Object {
              "Ref": "AWS::URLSuffix",
            },
            "/",
            Object {
              "Ref": "ApiGatewayApiGatewayStackTestDeploymentStagedev4ACD7265",
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
    "ApiBasePathMappingSaninternalServiceStackApiGatewayCustomDomain672539FB": Object {
      "Properties": Object {
        "BasePath": "",
        "DomainName": Object {
          "Fn::ImportValue": "internalServiceStack:ExportsOutputRefApiGatewayCustomDomain2BCB9839B486D378",
        },
        "RestApiId": Object {
          "Ref": "ApiGatewayApiGatewayStackTest446B3FCA",
        },
        "Stage": Object {
          "Ref": "ApiGatewayApiGatewayStackTestDeploymentStagedev4ACD7265",
        },
      },
      "Type": "AWS::ApiGateway::BasePathMapping",
    },
    "ApiBasePathMappingSaninternalServiceStackApiGatewayCustomDomainSaninternalservicedevtest2comF93DEDFB": Object {
      "Properties": Object {
        "BasePath": "",
        "DomainName": Object {
          "Fn::ImportValue": "internalServiceStack:ExportsOutputRefApiGatewayCustomDomainSaninternalservicedevtest2comF8D3AEC589B19ED8",
        },
        "RestApiId": Object {
          "Ref": "ApiGatewayApiGatewayStackTest446B3FCA",
        },
        "Stage": Object {
          "Ref": "ApiGatewayApiGatewayStackTestDeploymentStagedev4ACD7265",
        },
      },
      "Type": "AWS::ApiGateway::BasePathMapping",
    },
    "ApiBasePathMappingSaninternalServiceStackApiGatewayCustomDomainSaninternalservicedevtestcom95853F1A": Object {
      "Properties": Object {
        "BasePath": "",
        "DomainName": Object {
          "Fn::ImportValue": "internalServiceStack:ExportsOutputRefApiGatewayCustomDomainSaninternalservicedevtestcom82EF4ECAFB0837AE",
        },
        "RestApiId": Object {
          "Ref": "ApiGatewayApiGatewayStackTest446B3FCA",
        },
        "Stage": Object {
          "Ref": "ApiGatewayApiGatewayStackTestDeploymentStagedev4ACD7265",
        },
      },
      "Type": "AWS::ApiGateway::BasePathMapping",
    },
    "ApiGatewayApiGatewayStackTest446B3FCA": Object {
      "Properties": Object {
        "BinaryMediaTypes": Array [
          "*/*",
        ],
        "Description": "This service serves internalservices.",
        "EndpointConfiguration": Object {
          "Types": Array [
            "PRIVATE",
          ],
          "VpcEndpointIds": Array [
            "vpce-1234567890",
          ],
        },
        "MinimumCompressionSize": 1000,
        "Name": "internalservice-dev-ApiGatewayStackTest",
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
    "ApiGatewayApiGatewayStackTestAccount52151DB3": Object {
      "DeletionPolicy": "Retain",
      "DependsOn": Array [
        "ApiGatewayApiGatewayStackTest446B3FCA",
      ],
      "Properties": Object {
        "CloudWatchRoleArn": Object {
          "Fn::GetAtt": Array [
            "ApiGatewayApiGatewayStackTestCloudWatchRole36D77C61",
            "Arn",
          ],
        },
      },
      "Type": "AWS::ApiGateway::Account",
      "UpdateReplacePolicy": "Retain",
    },
    "ApiGatewayApiGatewayStackTestCloudWatchRole36D77C61": Object {
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
    "ApiGatewayApiGatewayStackTestDeployment1E5FBFA1d3d687064a4ac9f88aba749ef99ab20a": Object {
      "DependsOn": Array [
        "ApiGatewayApiGatewayStackTestGET2780DC65",
      ],
      "Properties": Object {
        "Description": "This service serves internalservices.",
        "RestApiId": Object {
          "Ref": "ApiGatewayApiGatewayStackTest446B3FCA",
        },
      },
      "Type": "AWS::ApiGateway::Deployment",
    },
    "ApiGatewayApiGatewayStackTestDeploymentStagedev4ACD7265": Object {
      "DependsOn": Array [
        "ApiGatewayApiGatewayStackTestAccount52151DB3",
      ],
      "Properties": Object {
        "DeploymentId": Object {
          "Ref": "ApiGatewayApiGatewayStackTestDeployment1E5FBFA1d3d687064a4ac9f88aba749ef99ab20a",
        },
        "RestApiId": Object {
          "Ref": "ApiGatewayApiGatewayStackTest446B3FCA",
        },
        "StageName": "dev",
      },
      "Type": "AWS::ApiGateway::Stage",
    },
    "ApiGatewayApiGatewayStackTestGET2780DC65": Object {
      "Properties": Object {
        "AuthorizationType": "NONE",
        "HttpMethod": "GET",
        "Integration": Object {
          "Type": "MOCK",
        },
        "ResourceId": Object {
          "Fn::GetAtt": Array [
            "ApiGatewayApiGatewayStackTest446B3FCA",
            "RootResourceId",
          ],
        },
        "RestApiId": Object {
          "Ref": "ApiGatewayApiGatewayStackTest446B3FCA",
        },
      },
      "Type": "AWS::ApiGateway::Method",
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

