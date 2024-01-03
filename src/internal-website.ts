import * as path from "path";
import {
  aws_apigateway as apigateway,
  aws_iam as iam,
  aws_s3 as s3,
  aws_s3_deployment as s3deploy,
  RemovalPolicy,
} from "aws-cdk-lib";
import { BlockPublicAccess } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import {
  InternalApiGateway,
  InternalApiGatewayProps,
} from "./internal-apigateway";

/**
 * Properties for InternalService
 */
export interface InternalWebsiteProps extends InternalApiGatewayProps {
  /**
   * Enable/disable bucket deployment of website`s sources
   */
  readonly enableSourceDeployment: boolean;
  
  /**
   * Path of website folder containing the website`s sources
   */
  readonly sourcePath: string;

  /**
   * Name of s3 bucket to use for the website deployment
   */
  readonly bucketName?: string;

  /**
   * Name of html index document used for the website
   *
   * @default index.html
   */
  readonly websiteIndexDocument?: string;
}

export class InternalWebsite extends InternalApiGateway {
  constructor(scope: Construct, id: string, props: InternalWebsiteProps) {
    super(scope, id, props);

    const bucket = new s3.Bucket(this, `WebsiteBucket-${id}`, {
      versioned: true,
      bucketName: props.bucketName || undefined,
      publicReadAccess: false,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      websiteIndexDocument: props.websiteIndexDocument || "index.html",
      autoDeleteObjects: true,
    });

    if( enableSourceDeployment){
      new s3deploy.BucketDeployment(this, `WebsiteDeployment-${id}`, {
        sources: [s3deploy.Source.asset(path.normalize(props.sourcePath))],
        destinationBucket: bucket,
      });
    }

    const role = new iam.Role(this, `ApiGatewayReadOnlyRole-${id}`, {
      assumedBy: new iam.ServicePrincipal("apigateway.amazonaws.com"),
    });

    role.addToPolicy(
      new iam.PolicyStatement({
        resources: [`${bucket.bucketArn}`, `${bucket.bucketArn}/*`],
        actions: ["s3:GetObject", "s3:GetObjectAcl", "s3:ListBucket"],
      })
    );

    const proxyIntegration = new apigateway.AwsIntegration({
      service: "s3",
      integrationHttpMethod: "GET",
      path: `${bucket.bucketName}/{proxy}`,
      options: {
        credentialsRole: role,
        requestParameters: {
          "integration.request.path.proxy": "method.request.path.proxy",
        },
        integrationResponses: [
          {
            statusCode: "200",
            selectionPattern: "2..",
            responseParameters: {
              "method.response.header.Content-Type":
                "integration.response.header.Content-Type",
            },
          },
          {
            statusCode: "403",
            selectionPattern: "4..",
          },
        ],
      },
    });

    const defaultIntegration = new apigateway.AwsIntegration({
      service: "s3",
      integrationHttpMethod: "GET",
      path: `${bucket.bucketName}/${
        props.websiteIndexDocument || "index.html"
      }`,
      options: {
        credentialsRole: role,
        integrationResponses: [
          {
            statusCode: "200",
            selectionPattern: "2..",
            responseParameters: {
              "method.response.header.Content-Type":
                "integration.response.header.Content-Type",
            },
          },
          {
            statusCode: "403",
            selectionPattern: "4..",
          },
        ],
      },
    });

    const proxyMethodOptions = {
      methodResponses: [
        {
          statusCode: "200",
          responseParameters: {
            "method.response.header.Content-Type": true,
          },
        },
      ],
      requestParameters: {
        "method.request.path.proxy": true,
      },
    };

    const proxyResource = this.apiGateway.root.addProxy({
      anyMethod: false,
      defaultIntegration: proxyIntegration,
      defaultMethodOptions: proxyMethodOptions,
    });
    const defaultResource = this.apiGateway.root.resourceForPath("/");

    defaultResource.addMethod("ANY", defaultIntegration, proxyMethodOptions);
    proxyResource.addMethod("ANY", proxyIntegration, proxyMethodOptions);
  }
}
