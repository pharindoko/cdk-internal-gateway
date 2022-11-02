import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { Construct } from 'constructs';
import { InternalApiGateway, InternalApiGatewayProps, InternalService } from '../src';


export class ApiGatewayStackTest extends InternalApiGateway {
  internalApiGateway: any;
  constructor(scope: Construct, id: string, props: InternalApiGatewayProps) {
    super(scope, id, props);
    this.internalApiGateway.root.addMethod('GET', undefined);
  }
}

let app = new cdk.App();
let internalServiceStack: InternalService;
const stack = new cdk.Stack(app, 'test', {
  env: {
    account: '123456789012',
    region: 'us-east-1',
  },
});

beforeAll(() => {

  const vpc = cdk.aws_ec2.Vpc.fromLookup(stack, 'vpc', { vpcId: 'vpc-1234567' });
  const internalSubnetIds = ['subnet-1234567890', 'subnet-1234567890'];
  internalServiceStack = new InternalService(stack, 'internalServiceStack', {
    vpc: vpc,
    subnetSelection: {
      subnets: internalSubnetIds.map((ip, index) =>
        cdk.aws_ec2.Subnet.fromSubnetId(stack, `Subnet${index}`, ip),
      ),
    },
    vpcEndpointId: 'vpce-1234567890',
    vpcEndpointIPAddresses: ['192.168.2.1', '192.168.2.2'],
    subjectAlternativeNames: ['internalservice-dev.test.com', 'internalservice-dev.test2.com'],
    hostedZoneName: 'test.aws1234.com',
    subDomain: 'internalservice-dev',
  });
});


test('Api Gateway Stack provider', () => {

  new ApiGatewayStackTest(stack, 'apiGatewayStack', {
    stage: 'dev',
    domains: internalServiceStack.domains,
    vpcEndpointId: internalServiceStack.vpcEndpointId,
  });


  const template = Template.fromStack(stack);
  template.hasResourceProperties('AWS::ApiGateway::RestApi', Match.objectLike({
    EndpointConfiguration: {
      Types: [
        'PRIVATE',
      ],
    },
  },
  ));
  template.hasResourceProperties('AWS::ApiGateway::RestApi', Match.objectLike({
    Policy: {
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Condition: {
            StringNotEquals: {
              'aws:sourceVpce': internalServiceStack.vpcEndpointId.vpcEndpointId,
            },
          },
          Effect: 'Deny',
          Principal: {
            AWS: '*',
          },
          Resource: 'execute-api:/*/*/*',
        },
        {
          Action: 'execute-api:Invoke',
          Condition: {
            StringEquals: {
              'aws:sourceVpce': internalServiceStack.vpcEndpointId.vpcEndpointId,
            },
          },
          Effect: 'Allow',
          Principal: {
            AWS: '*',
          },
          Resource: 'execute-api:/*/*/*',
        },
      ],
      Version: '2012-10-17',
    },
  },
  ));

  expect(template).toMatchInlineSnapshot(`
Object {
  "Outputs": Object {
    "apiGatewayStackGatewaytestEndpointDBCBAA9A": Object {
      "Value": Object {
        "Fn::Join": Array [
          "",
          Array [
            "https://",
            Object {
              "Ref": "apiGatewayStackGatewaytestB21206F6",
            },
            ".execute-api.us-east-1.",
            Object {
              "Ref": "AWS::URLSuffix",
            },
            "/",
            Object {
              "Ref": "apiGatewayStackGatewaytestDeploymentStagedev417B627A",
            },
            "/",
          ],
        ],
      },
    },
    "internalServiceStackDomainUrltest2935E3B3": Object {
      "Description": "service url",
      "Export": Object {
        "Name": "-DomainUrl",
      },
      "Value": "https://internalservice-dev.test.aws1234.com",
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
    "apiGatewayStackGatewaytestAccount62BFF2F7": Object {
      "DeletionPolicy": "Retain",
      "DependsOn": Array [
        "apiGatewayStackGatewaytestB21206F6",
      ],
      "Properties": Object {
        "CloudWatchRoleArn": Object {
          "Fn::GetAtt": Array [
            "apiGatewayStackGatewaytestCloudWatchRoleA79896DE",
            "Arn",
          ],
        },
      },
      "Type": "AWS::ApiGateway::Account",
      "UpdateReplacePolicy": "Retain",
    },
    "apiGatewayStackGatewaytestB21206F6": Object {
      "Properties": Object {
        "BinaryMediaTypes": Array [
          "*/*",
        ],
        "Description": "This service serves an internal api gateway",
        "EndpointConfiguration": Object {
          "Types": Array [
            "PRIVATE",
          ],
          "VpcEndpointIds": Array [
            "vpce-1234567890",
          ],
        },
        "MinimumCompressionSize": 1000,
        "Name": "gateway-test",
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
    "apiGatewayStackGatewaytestCloudWatchRoleA79896DE": Object {
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
    "apiGatewayStackGatewaytestDeployment476DB131a3c4cb9f65381809a154d2f99199ffde": Object {
      "DependsOn": Array [
        "apiGatewayStackGatewaytestGET54FBF6E8",
      ],
      "Properties": Object {
        "Description": "This service serves an internal api gateway",
        "RestApiId": Object {
          "Ref": "apiGatewayStackGatewaytestB21206F6",
        },
      },
      "Type": "AWS::ApiGateway::Deployment",
    },
    "apiGatewayStackGatewaytestDeploymentStagedev417B627A": Object {
      "DependsOn": Array [
        "apiGatewayStackGatewaytestAccount62BFF2F7",
      ],
      "Properties": Object {
        "DeploymentId": Object {
          "Ref": "apiGatewayStackGatewaytestDeployment476DB131a3c4cb9f65381809a154d2f99199ffde",
        },
        "RestApiId": Object {
          "Ref": "apiGatewayStackGatewaytestB21206F6",
        },
        "StageName": "dev",
      },
      "Type": "AWS::ApiGateway::Stage",
    },
    "apiGatewayStackGatewaytestGET54FBF6E8": Object {
      "Properties": Object {
        "AuthorizationType": "NONE",
        "HttpMethod": "GET",
        "Integration": Object {
          "Type": "MOCK",
        },
        "ResourceId": Object {
          "Fn::GetAtt": Array [
            "apiGatewayStackGatewaytestB21206F6",
            "RootResourceId",
          ],
        },
        "RestApiId": Object {
          "Ref": "apiGatewayStackGatewaytestB21206F6",
        },
      },
      "Type": "AWS::ApiGateway::Method",
    },
    "apiGatewayStacktestinternalServiceStackApiGatewayCustomDomaintest5FD0C666": Object {
      "Properties": Object {
        "BasePath": "",
        "DomainName": Object {
          "Ref": "internalServiceStackApiGatewayCustomDomaintest813BB8C2",
        },
        "RestApiId": Object {
          "Ref": "apiGatewayStackGatewaytestB21206F6",
        },
        "Stage": Object {
          "Ref": "apiGatewayStackGatewaytestDeploymentStagedev417B627A",
        },
      },
      "Type": "AWS::ApiGateway::BasePathMapping",
    },
    "apiGatewayStacktestinternalServiceStackDomaininternalservicedevtest2comtest2D55BBDF": Object {
      "Properties": Object {
        "BasePath": "",
        "DomainName": Object {
          "Ref": "internalServiceStackDomaininternalservicedevtest2comtestCB38E02B",
        },
        "RestApiId": Object {
          "Ref": "apiGatewayStackGatewaytestB21206F6",
        },
        "Stage": Object {
          "Ref": "apiGatewayStackGatewaytestDeploymentStagedev417B627A",
        },
      },
      "Type": "AWS::ApiGateway::BasePathMapping",
    },
    "apiGatewayStacktestinternalServiceStackDomaininternalservicedevtestcomtestD3261655": Object {
      "Properties": Object {
        "BasePath": "",
        "DomainName": Object {
          "Ref": "internalServiceStackDomaininternalservicedevtestcomtest2CE9FA76",
        },
        "RestApiId": Object {
          "Ref": "apiGatewayStackGatewaytestB21206F6",
        },
        "Stage": Object {
          "Ref": "apiGatewayStackGatewaytestDeploymentStagedev417B627A",
        },
      },
      "Type": "AWS::ApiGateway::BasePathMapping",
    },
    "internalServiceStackApiGatewayCustomDomaintest813BB8C2": Object {
      "Properties": Object {
        "DomainName": "internalservice-dev.test.aws1234.com",
        "EndpointConfiguration": Object {
          "Types": Array [
            "REGIONAL",
          ],
        },
        "RegionalCertificateArn": Object {
          "Ref": "internalServiceStackSSLCertificatetest1C36642E",
        },
        "SecurityPolicy": "TLS_1_2",
      },
      "Type": "AWS::ApiGateway::DomainName",
    },
    "internalServiceStackApplicationLoadBalancertestF81D1559": Object {
      "Properties": Object {
        "LoadBalancerAttributes": Array [
          Object {
            "Key": "deletion_protection.enabled",
            "Value": "false",
          },
        ],
        "Name": "lb-test",
        "Scheme": "internal",
        "SecurityGroups": Array [
          Object {
            "Fn::GetAtt": Array [
              "internalServiceStackLoadBalancerSecurityGrouptestC15E9D39",
              "GroupId",
            ],
          },
        ],
        "Subnets": Array [
          "subnet-1234567890",
          "subnet-1234567890",
        ],
        "Type": "application",
      },
      "Type": "AWS::ElasticLoadBalancingV2::LoadBalancer",
    },
    "internalServiceStackApplicationLoadBalancertestListenertestAB9280FB": Object {
      "Properties": Object {
        "Certificates": Array [
          Object {
            "CertificateArn": Object {
              "Ref": "internalServiceStackSSLCertificatetest1C36642E",
            },
          },
        ],
        "DefaultActions": Array [
          Object {
            "TargetGroupArn": Object {
              "Ref": "internalServiceStackTargetGrouptestB800F1B7",
            },
            "Type": "forward",
          },
        ],
        "LoadBalancerArn": Object {
          "Ref": "internalServiceStackApplicationLoadBalancertestF81D1559",
        },
        "Port": 443,
        "Protocol": "HTTPS",
      },
      "Type": "AWS::ElasticLoadBalancingV2::Listener",
    },
    "internalServiceStackDomaininternalservicedevtest2comtestCB38E02B": Object {
      "Properties": Object {
        "DomainName": "internalservice-dev.test2.com",
        "EndpointConfiguration": Object {
          "Types": Array [
            "REGIONAL",
          ],
        },
        "RegionalCertificateArn": Object {
          "Ref": "internalServiceStackSSLCertificatetest1C36642E",
        },
        "SecurityPolicy": "TLS_1_2",
      },
      "Type": "AWS::ApiGateway::DomainName",
    },
    "internalServiceStackDomaininternalservicedevtestcomtest2CE9FA76": Object {
      "Properties": Object {
        "DomainName": "internalservice-dev.test.com",
        "EndpointConfiguration": Object {
          "Types": Array [
            "REGIONAL",
          ],
        },
        "RegionalCertificateArn": Object {
          "Ref": "internalServiceStackSSLCertificatetest1C36642E",
        },
        "SecurityPolicy": "TLS_1_2",
      },
      "Type": "AWS::ApiGateway::DomainName",
    },
    "internalServiceStackLoadBalancerSecurityGrouptestC15E9D39": Object {
      "Properties": Object {
        "GroupDescription": "security group for a load balancer",
        "GroupName": "-lb-sg",
        "SecurityGroupEgress": Array [
          Object {
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow all outbound traffic by default",
            "IpProtocol": "-1",
          },
        ],
        "SecurityGroupIngress": Array [
          Object {
            "CidrIp": "0.0.0.0/0",
            "Description": "allow HTTPS traffic from anywhere",
            "FromPort": 443,
            "IpProtocol": "tcp",
            "ToPort": 443,
          },
        ],
        "VpcId": "vpc-12345",
      },
      "Type": "AWS::EC2::SecurityGroup",
    },
    "internalServiceStackRoute53Recordtest42769C99": Object {
      "Properties": Object {
        "AliasTarget": Object {
          "DNSName": Object {
            "Fn::Join": Array [
              "",
              Array [
                "dualstack.",
                Object {
                  "Fn::GetAtt": Array [
                    "internalServiceStackApplicationLoadBalancertestF81D1559",
                    "DNSName",
                  ],
                },
              ],
            ],
          },
          "HostedZoneId": Object {
            "Fn::GetAtt": Array [
              "internalServiceStackApplicationLoadBalancertestF81D1559",
              "CanonicalHostedZoneID",
            ],
          },
        },
        "HostedZoneId": "DUMMY",
        "Name": "internalservice-dev.test.aws1234.com.",
        "Type": "A",
      },
      "Type": "AWS::Route53::RecordSet",
    },
    "internalServiceStackSSLCertificatetest1C36642E": Object {
      "Properties": Object {
        "DomainName": "internalservice-dev.test.aws1234.com",
        "SubjectAlternativeNames": Array [
          "internalservice-dev.test.com",
          "internalservice-dev.test2.com",
        ],
        "Tags": Array [
          Object {
            "Key": "Name",
            "Value": "test/internalServiceStack/SSLCertificate-test",
          },
        ],
        "ValidationMethod": "DNS",
      },
      "Type": "AWS::CertificateManager::Certificate",
    },
    "internalServiceStackTargetGrouptestB800F1B7": Object {
      "Properties": Object {
        "Name": "tg-test",
        "Port": 443,
        "Protocol": "HTTPS",
        "TargetGroupAttributes": Array [
          Object {
            "Key": "stickiness.enabled",
            "Value": "false",
          },
        ],
        "TargetType": "ip",
        "Targets": Array [
          Object {
            "Id": "192.168.2.1",
          },
          Object {
            "Id": "192.168.2.2",
          },
        ],
        "VpcId": "vpc-12345",
      },
      "Type": "AWS::ElasticLoadBalancingV2::TargetGroup",
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

