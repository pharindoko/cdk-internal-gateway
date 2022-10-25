import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { VPCEndpointResolverStack } from '../src';

test('VPC Endpoint Stack provider', () => {
  const app = new cdk.App();
  const stack = new VPCEndpointResolverStack(app, 'vpcEndpointResolverStack', {
    env: {
      account: '123456789101',
      region: 'eu-central-1',
    },
    serviceName: 'internalservice',
    stage: 'dev',
    vpcId: 'vpc-1234567890',
    vpcEndpointId: 'vpce-1234567890',
  });
  const template = Template.fromStack(stack);
  expect(template).toMatchInlineSnapshot(`
Object {
  "Outputs": Object {
    "VPCEndpointIpAddress0": Object {
      "Description": "VPC Endpoint IP Address ",
      "Value": Object {
        "Fn::GetAtt": Array [
          "DescribeNetworkInterfaces622753B7",
          "NetworkInterfaces.0.PrivateIpAddress",
        ],
      },
    },
    "VPCEndpointIpAddress1": Object {
      "Description": "VPC Endpoint IP Address ",
      "Value": Object {
        "Fn::GetAtt": Array [
          "DescribeNetworkInterfaces622753B7",
          "NetworkInterfaces.1.PrivateIpAddress",
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
    "AWS679f53fac002430cb0da5b7982bd22872D164C4C": Object {
      "DependsOn": Array [
        "AWS679f53fac002430cb0da5b7982bd2287ServiceRoleC1EA0FF2",
      ],
      "Properties": Object {
        "Code": Object {
          "S3Bucket": Object {
            "Fn::Sub": "cdk-hnb659fds-assets-\${AWS::AccountId}-\${AWS::Region}",
          },
          "S3Key": "e845402ce43b66fc6f20df4a239f20f8662eb6c7f920b94cf6542dd0e64ce0f7.zip",
        },
        "Handler": "index.handler",
        "Role": Object {
          "Fn::GetAtt": Array [
            "AWS679f53fac002430cb0da5b7982bd2287ServiceRoleC1EA0FF2",
            "Arn",
          ],
        },
        "Runtime": "nodejs14.x",
        "Timeout": 120,
      },
      "Type": "AWS::Lambda::Function",
    },
    "AWS679f53fac002430cb0da5b7982bd2287ServiceRoleC1EA0FF2": Object {
      "Properties": Object {
        "AssumeRolePolicyDocument": Object {
          "Statement": Array [
            Object {
              "Action": "sts:AssumeRole",
              "Effect": "Allow",
              "Principal": Object {
                "Service": "lambda.amazonaws.com",
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
                ":iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
              ],
            ],
          },
        ],
      },
      "Type": "AWS::IAM::Role",
    },
    "DescribeNetworkInterfaces622753B7": Object {
      "DeletionPolicy": "Delete",
      "DependsOn": Array [
        "DescribeNetworkInterfacesCustomResourcePolicy0D555CBA",
      ],
      "Properties": Object {
        "Create": Object {
          "Fn::Join": Array [
            "",
            Array [
              "{\\"service\\":\\"EC2\\",\\"action\\":\\"describeNetworkInterfaces\\",\\"parameters\\":{\\"NetworkInterfaceIds\\":[\\"",
              Object {
                "Fn::GetAtt": Array [
                  "DescribeVPCEndpoints567058F0",
                  "VpcEndpoints.0.NetworkInterfaceIds.0",
                ],
              },
              "\\",\\"",
              Object {
                "Fn::GetAtt": Array [
                  "DescribeVPCEndpoints567058F0",
                  "VpcEndpoints.0.NetworkInterfaceIds.1",
                ],
              },
              "\\"]},\\"physicalResourceId\\":{\\"id\\":\\"1666560944388\\"}}",
            ],
          ],
        },
        "InstallLatestAwsSdk": true,
        "ServiceToken": Object {
          "Fn::GetAtt": Array [
            "AWS679f53fac002430cb0da5b7982bd22872D164C4C",
            "Arn",
          ],
        },
        "Update": Object {
          "Fn::Join": Array [
            "",
            Array [
              "{\\"service\\":\\"EC2\\",\\"action\\":\\"describeNetworkInterfaces\\",\\"parameters\\":{\\"NetworkInterfaceIds\\":[\\"",
              Object {
                "Fn::GetAtt": Array [
                  "DescribeVPCEndpoints567058F0",
                  "VpcEndpoints.0.NetworkInterfaceIds.0",
                ],
              },
              "\\",\\"",
              Object {
                "Fn::GetAtt": Array [
                  "DescribeVPCEndpoints567058F0",
                  "VpcEndpoints.0.NetworkInterfaceIds.1",
                ],
              },
              "\\"]},\\"physicalResourceId\\":{\\"id\\":\\"1666560944388\\"}}",
            ],
          ],
        },
      },
      "Type": "Custom::AWS",
      "UpdateReplacePolicy": "Delete",
    },
    "DescribeNetworkInterfacesCustomResourcePolicy0D555CBA": Object {
      "Properties": Object {
        "PolicyDocument": Object {
          "Statement": Array [
            Object {
              "Action": "ec2:DescribeNetworkInterfaces",
              "Effect": "Allow",
              "Resource": "*",
            },
          ],
          "Version": "2012-10-17",
        },
        "PolicyName": "DescribeNetworkInterfacesCustomResourcePolicy0D555CBA",
        "Roles": Array [
          Object {
            "Ref": "AWS679f53fac002430cb0da5b7982bd2287ServiceRoleC1EA0FF2",
          },
        ],
      },
      "Type": "AWS::IAM::Policy",
    },
    "DescribeVPCEndpoints567058F0": Object {
      "DeletionPolicy": "Delete",
      "DependsOn": Array [
        "DescribeVPCEndpointsCustomResourcePolicy6ACDD1F9",
      ],
      "Properties": Object {
        "Create": "{\\"service\\":\\"EC2\\",\\"action\\":\\"describeVpcEndpoints\\",\\"parameters\\":{\\"VpcEndpointIds\\":[\\"vpce-1234567890\\"]},\\"physicalResourceId\\":{\\"id\\":\\"1666560944375\\"}}",
        "InstallLatestAwsSdk": true,
        "ServiceToken": Object {
          "Fn::GetAtt": Array [
            "AWS679f53fac002430cb0da5b7982bd22872D164C4C",
            "Arn",
          ],
        },
        "Update": "{\\"service\\":\\"EC2\\",\\"action\\":\\"describeVpcEndpoints\\",\\"parameters\\":{\\"VpcEndpointIds\\":[\\"vpce-1234567890\\"]},\\"physicalResourceId\\":{\\"id\\":\\"1666560944375\\"}}",
      },
      "Type": "Custom::AWS",
      "UpdateReplacePolicy": "Delete",
    },
    "DescribeVPCEndpointsCustomResourcePolicy6ACDD1F9": Object {
      "Properties": Object {
        "PolicyDocument": Object {
          "Statement": Array [
            Object {
              "Action": "ec2:DescribeVPCEndpoints",
              "Effect": "Allow",
              "Resource": "*",
            },
          ],
          "Version": "2012-10-17",
        },
        "PolicyName": "DescribeVPCEndpointsCustomResourcePolicy6ACDD1F9",
        "Roles": Array [
          Object {
            "Ref": "AWS679f53fac002430cb0da5b7982bd2287ServiceRoleC1EA0FF2",
          },
        ],
      },
      "Type": "AWS::IAM::Policy",
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

