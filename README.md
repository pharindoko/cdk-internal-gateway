# CDK Internal Gateway

This CDK construct provides an internal api-gateway endpoint and restricts access to the internal network of your company.

By default the aws api gateway endpoints are public and accessible from the internet.   
AWS changed this by having the option to set an api gateway to [PRIVATE mode](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-private-apis.html).  
But it is still a lot of effort to configure and implement all aws components in a secure manner.

## Features

- no traffic will be routed over the internet
- access your serverless solution directly from the internal network
- create internal websites and backends using api gateway integrations (see samples folder)
- create and attach custom domains and certificates 

## Requirements

- CDK V2
- VPC
- VPC Endpoint for execute-api

## Installation

```bash
npm i
```

## Architecture

![cdk internal gateway](cdk-internal-gateway.drawio.png )

## How to use it ?

> Using a new generated project "my-project"

Go to bin/my-project.ts

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { MyProjectStack } from '../lib/my-project-stack';
import { InternalServiceStack } from 'cdk-internal-gateway';

const app = new cdk.App();
const serviceStack = new InternalServiceStack(app, 'InternalServiceStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  hostedZoneName: "mydomain.com",
  internalSubnetIds: ["subnet-1234567890", "subnet-0987654321"],
  vpcEndpointId: "vpce-1234567890",
  vpcEndpointIPAddresses: ["192.168.2.1", "192.168.2.2"],
  vpcId: "vpc-1234567890",
  subjectAlternativeNames: ["internal-service.mydomain.net", "int-service.mydomain.com"],
  subDomain: "internal-service"
})

new MyProjectStack(app, 'MyProjectStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  domains: serviceStack.domains,
  stage: "dev",
  vpcEndpointId: serviceStack.vpcEndpointId,
})
```

## Cost

You have to expect basic infra costs for 2 components in this setup:  

| Count |  Type |  Estimated Costs | 
|---|---|---|
|1 x| application load balancer  | 20 $  | 
|2 x| network interfaces for the vpc endpoint  | 16 $  |

A shared vpc can lower the costs as vpc endpoint and their network interfaces can be used together...  




