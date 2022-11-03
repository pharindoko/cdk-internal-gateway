import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { InternalService } from '../src';

test('Internal Service provider', () => {
  const app = new cdk.App();;
  const stack = new cdk.Stack(app, 'test', {
    env: {
      account: '123456789012',
      region: 'us-east-1',
    },
  });
  const vpc = cdk.aws_ec2.Vpc.fromLookup(stack, 'vpc', { vpcId: 'vpc-1234567' });
  const internalSubnetIds = ['subnet-1234567890', 'subnet-1234567890'];
  new InternalService(stack, 'internalServiceStack', {
    vpc: vpc,
    subnetSelection: {
      subnets: internalSubnetIds.map((ip, index) =>
        cdk.aws_ec2.Subnet.fromSubnetId(stack, `Subnet${index}`, ip),
      ),
    },
    vpcEndpointIPAddresses: ['192.168.2.1', '192.168.2.2'],
    subjectAlternativeNames: ['internalservice-dev.test.com', 'internalservice-dev.test2.com'],
    hostedZoneName: 'test.aws1234.com',
    subDomain: 'internalservice-dev',
  });

  const template = Template.fromStack(stack);
  expect(template).toMatchInlineSnapshot(`
Object {
  "Outputs": Object {
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
    "internalServiceStackApplicationLoadBalancertestRedirect80To443AC430414": Object {
      "Properties": Object {
        "DefaultActions": Array [
          Object {
            "RedirectConfig": Object {
              "Port": "443",
              "Protocol": "HTTPS",
              "StatusCode": "HTTP_301",
            },
            "Type": "redirect",
          },
        ],
        "LoadBalancerArn": Object {
          "Ref": "internalServiceStackApplicationLoadBalancertestF81D1559",
        },
        "Port": 80,
        "Protocol": "HTTP",
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
          Object {
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow from anyone on port 80",
            "FromPort": 80,
            "IpProtocol": "tcp",
            "ToPort": 80,
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

