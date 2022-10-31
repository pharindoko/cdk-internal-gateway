# CDK Internal Gateway

Use this CDK construct to create internal tools or websites based on serverless aws components.  

This construct provides an internal api-gateway endpoint and restricts access to the internal network of your company.

## Features

- no traffic has to be routed via the internet
- access your aws solutions directly from the internal network
- custom domains and certificates will be directly generated

## Requirements

- CDK V2
- VPC
- VPC Endpoint for execute-api

## Installation

```bash
npm i
```

## How to use it ?

## Architecture

![cdk internal gateway](cdk-internal-gateway.drawio.png )

## Cost

You have to expect costs for 2 components in this setup:  

|  Type |  Estimated Costs | 
|---|---|
| application load balancer  | 20 $  | 
| network interfaces for the vpc endpoint  | 16$ (2 x eni)  |

A shared vpc can lower the costs as vpc endpoint and their network interfaces can be used together...  




