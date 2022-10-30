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
    "ExportsOutputRefinternalServiceStackApiGatewayCustomDomainF3D19E8F3CFD2B8B": Object {
      "Export": Object {
        "Name": "internalServiceStack:ExportsOutputRefinternalServiceStackApiGatewayCustomDomainF3D19E8F3CFD2B8B",
      },
      "Value": Object {
        "Ref": "internalServiceStackApiGatewayCustomDomainF3D19E8F",
      },
    },
    "ExportsOutputRefinternalServiceStackdomaininternalservicedevtest2com798F5BAC0D28D4EE": Object {
      "Export": Object {
        "Name": "internalServiceStack:ExportsOutputRefinternalServiceStackdomaininternalservicedevtest2com798F5BAC0D28D4EE",
      },
      "Value": Object {
        "Ref": "internalServiceStackdomaininternalservicedevtest2com798F5BAC",
      },
    },
    "ExportsOutputRefinternalServiceStackdomaininternalservicedevtestcom451134F428688DAD": Object {
      "Export": Object {
        "Name": "internalServiceStack:ExportsOutputRefinternalServiceStackdomaininternalservicedevtestcom451134F428688DAD",
      },
      "Value": Object {
        "Ref": "internalServiceStackdomaininternalservicedevtestcom451134F4",
      },
    },
    "internalServiceStackDomainUrl": Object {
      "Description": "service url",
      "Export": Object {
        "Name": "internalServiceStack-DomainUrl",
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
    "internalServiceStackApiGatewayCustomDomainF3D19E8F": Object {
      "Properties": Object {
        "DomainName": "internalservice-dev.test.aws1234.com",
        "EndpointConfiguration": Object {
          "Types": Array [
            "REGIONAL",
          ],
        },
        "RegionalCertificateArn": Object {
          "Ref": "internalServiceStackSSLCertificate6CFC17B0",
        },
        "SecurityPolicy": "TLS_1_2",
      },
      "Type": "AWS::ApiGateway::DomainName",
    },
    "internalServiceStackApplicationLoadBalancer97B5BBCE": Object {
      "Properties": Object {
        "LoadBalancerAttributes": Array [
          Object {
            "Key": "deletion_protection.enabled",
            "Value": "false",
          },
        ],
        "Name": "internalServiceStack-lb",
        "Scheme": "internal",
        "SecurityGroups": Array [
          Object {
            "Fn::GetAtt": Array [
              "internalServiceStackLoadBalancerSecurityGroup3E17EC9E",
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
    "internalServiceStackApplicationLoadBalancerinternalServiceStackListenerDD6E0A07": Object {
      "Properties": Object {
        "Certificates": Array [
          Object {
            "CertificateArn": Object {
              "Ref": "internalServiceStackSSLCertificate6CFC17B0",
            },
          },
        ],
        "DefaultActions": Array [
          Object {
            "TargetGroupArn": Object {
              "Ref": "internalServiceStackTargetGroup14BD7A30",
            },
            "Type": "forward",
          },
        ],
        "LoadBalancerArn": Object {
          "Ref": "internalServiceStackApplicationLoadBalancer97B5BBCE",
        },
        "Port": 443,
        "Protocol": "HTTPS",
      },
      "Type": "AWS::ElasticLoadBalancingV2::Listener",
    },
    "internalServiceStackLoadBalancerSecurityGroup3E17EC9E": Object {
      "Properties": Object {
        "GroupDescription": "security group for a load balancer",
        "GroupName": "internalServiceStack-lb-sg",
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
    "internalServiceStackRoute53Record2CE2CA62": Object {
      "Properties": Object {
        "AliasTarget": Object {
          "DNSName": Object {
            "Fn::Join": Array [
              "",
              Array [
                "dualstack.",
                Object {
                  "Fn::GetAtt": Array [
                    "internalServiceStackApplicationLoadBalancer97B5BBCE",
                    "DNSName",
                  ],
                },
              ],
            ],
          },
          "HostedZoneId": Object {
            "Fn::GetAtt": Array [
              "internalServiceStackApplicationLoadBalancer97B5BBCE",
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
    "internalServiceStackSSLCertificate6CFC17B0": Object {
      "Properties": Object {
        "DomainName": "internalservice-dev.test.aws1234.com",
        "SubjectAlternativeNames": Array [
          "internalservice-dev.test.com",
          "internalservice-dev.test2.com",
        ],
        "Tags": Array [
          Object {
            "Key": "Name",
            "Value": "internalServiceStack/internalServiceStack-SSLCertificate",
          },
        ],
        "ValidationMethod": "DNS",
      },
      "Type": "AWS::CertificateManager::Certificate",
    },
    "internalServiceStackTargetGroup14BD7A30": Object {
      "Properties": Object {
        "Name": "internalServiceStack-tg",
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
    "internalServiceStackdomaininternalservicedevtest2com798F5BAC": Object {
      "Properties": Object {
        "DomainName": "internalservice-dev.test2.com",
        "EndpointConfiguration": Object {
          "Types": Array [
            "REGIONAL",
          ],
        },
        "RegionalCertificateArn": Object {
          "Ref": "internalServiceStackSSLCertificate6CFC17B0",
        },
        "SecurityPolicy": "TLS_1_2",
      },
      "Type": "AWS::ApiGateway::DomainName",
    },
    "internalServiceStackdomaininternalservicedevtestcom451134F4": Object {
      "Properties": Object {
        "DomainName": "internalservice-dev.test.com",
        "EndpointConfiguration": Object {
          "Types": Array [
            "REGIONAL",
          ],
        },
        "RegionalCertificateArn": Object {
          "Ref": "internalServiceStackSSLCertificate6CFC17B0",
        },
        "SecurityPolicy": "TLS_1_2",
      },
      "Type": "AWS::ApiGateway::DomainName",
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

