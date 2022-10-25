import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { InternalServiceStack } from '../src';

test('Internal Service provider', () => {


  const app = new cdk.App();;

  const stack = new InternalServiceStack(app, 'internalServiceStack', {
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

  const template = Template.fromStack(stack);
  expect(template).toMatchInlineSnapshot(`
Object {
  "Outputs": Object {
    "DomainUrl": Object {
      "Description": "service url",
      "Export": Object {
        "Name": "internalservice-dev-DomainUrl",
      },
      "Value": "https://internalservice-dev.test.aws1234.com",
    },
    "ExportsOutputRefApiGatewayCustomDomain2BCB9839B486D378": Object {
      "Export": Object {
        "Name": "internalServiceStack:ExportsOutputRefApiGatewayCustomDomain2BCB9839B486D378",
      },
      "Value": Object {
        "Ref": "ApiGatewayCustomDomain2BCB9839",
      },
    },
    "ExportsOutputRefApiGatewayCustomDomainSaninternalservicedevtest2comF8D3AEC589B19ED8": Object {
      "Export": Object {
        "Name": "internalServiceStack:ExportsOutputRefApiGatewayCustomDomainSaninternalservicedevtest2comF8D3AEC589B19ED8",
      },
      "Value": Object {
        "Ref": "ApiGatewayCustomDomainSaninternalservicedevtest2comF8D3AEC5",
      },
    },
    "ExportsOutputRefApiGatewayCustomDomainSaninternalservicedevtestcom82EF4ECAFB0837AE": Object {
      "Export": Object {
        "Name": "internalServiceStack:ExportsOutputRefApiGatewayCustomDomainSaninternalservicedevtestcom82EF4ECAFB0837AE",
      },
      "Value": Object {
        "Ref": "ApiGatewayCustomDomainSaninternalservicedevtestcom82EF4ECA",
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
    "ApiGatewayCustomDomain2BCB9839": Object {
      "Properties": Object {
        "DomainName": "internalservice-dev.test.aws1234.com",
        "EndpointConfiguration": Object {
          "Types": Array [
            "REGIONAL",
          ],
        },
        "RegionalCertificateArn": Object {
          "Ref": "SSLCertificate2E93C565",
        },
        "SecurityPolicy": "TLS_1_2",
      },
      "Type": "AWS::ApiGateway::DomainName",
    },
    "ApiGatewayCustomDomainSaninternalservicedevtest2comF8D3AEC5": Object {
      "Properties": Object {
        "DomainName": "internalservice-dev.test2.com",
        "EndpointConfiguration": Object {
          "Types": Array [
            "REGIONAL",
          ],
        },
        "RegionalCertificateArn": Object {
          "Ref": "SSLCertificate2E93C565",
        },
        "SecurityPolicy": "TLS_1_2",
      },
      "Type": "AWS::ApiGateway::DomainName",
    },
    "ApiGatewayCustomDomainSaninternalservicedevtestcom82EF4ECA": Object {
      "Properties": Object {
        "DomainName": "internalservice-dev.test.com",
        "EndpointConfiguration": Object {
          "Types": Array [
            "REGIONAL",
          ],
        },
        "RegionalCertificateArn": Object {
          "Ref": "SSLCertificate2E93C565",
        },
        "SecurityPolicy": "TLS_1_2",
      },
      "Type": "AWS::ApiGateway::DomainName",
    },
    "ApplicationLoadBalancerFD56DEE1": Object {
      "Properties": Object {
        "LoadBalancerAttributes": Array [
          Object {
            "Key": "deletion_protection.enabled",
            "Value": "false",
          },
        ],
        "Name": "internalservice-dev-lb",
        "Scheme": "internal",
        "SecurityGroups": Array [
          Object {
            "Fn::GetAtt": Array [
              "LoadBalancerSecurityGroup3036A0FC",
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
    "ApplicationLoadBalancerListener6CA03B43": Object {
      "Properties": Object {
        "Certificates": Array [
          Object {
            "CertificateArn": Object {
              "Ref": "SSLCertificate2E93C565",
            },
          },
        ],
        "DefaultActions": Array [
          Object {
            "TargetGroupArn": Object {
              "Ref": "TargetGroup3D7CD9B8",
            },
            "Type": "forward",
          },
        ],
        "LoadBalancerArn": Object {
          "Ref": "ApplicationLoadBalancerFD56DEE1",
        },
        "Port": 443,
        "Protocol": "HTTPS",
      },
      "Type": "AWS::ElasticLoadBalancingV2::Listener",
    },
    "LoadBalancerSecurityGroup3036A0FC": Object {
      "Properties": Object {
        "GroupDescription": "security group for a load balancer",
        "GroupName": "internalservice-dev-lb-sg",
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
    "Route53Record4E35C00F": Object {
      "Properties": Object {
        "AliasTarget": Object {
          "DNSName": Object {
            "Fn::Join": Array [
              "",
              Array [
                "dualstack.",
                Object {
                  "Fn::GetAtt": Array [
                    "ApplicationLoadBalancerFD56DEE1",
                    "DNSName",
                  ],
                },
              ],
            ],
          },
          "HostedZoneId": Object {
            "Fn::GetAtt": Array [
              "ApplicationLoadBalancerFD56DEE1",
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
    "SSLCertificate2E93C565": Object {
      "Properties": Object {
        "DomainName": "internalservice-dev.test.aws1234.com",
        "SubjectAlternativeNames": Array [
          "internalservice-dev.test.com",
          "internalservice-dev.test2.com",
        ],
        "Tags": Array [
          Object {
            "Key": "Name",
            "Value": "internalServiceStack/SSLCertificate",
          },
        ],
        "ValidationMethod": "DNS",
      },
      "Type": "AWS::CertificateManager::Certificate",
    },
    "TargetGroup3D7CD9B8": Object {
      "Properties": Object {
        "Name": "internalservice-dev-tg",
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

