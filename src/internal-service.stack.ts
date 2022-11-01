import {
  aws_apigateway as apigateway,
  aws_certificatemanager as certificatemanager,
  aws_ec2 as ec2,
  aws_elasticloadbalancingv2 as elb,
  aws_elasticloadbalancingv2_targets as elasticloadbalancingv2targets,
  aws_route53 as route53,
  aws_route53_targets as targets,
  CfnOutput,
  Names,
} from 'aws-cdk-lib';
import { IVpc, SubnetSelection } from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

/**
 * Properties for InternalServiceStack
 */
export interface InternalServiceStackProps {
  /**
   * VPC attached to the application load balancer.
   */
  readonly vpc: IVpc;

  /**
   * Subnets attached to the application load balancer.
   */
  readonly subnetSelection: SubnetSelection;

  /**
   * VPC endpoint id of execute-api vpc endpoint. This endpoint will be used to forward requests from the load balancer`s target group to the api gateway.
   */
  readonly vpcEndpointId: string;

  /**
   * VPC endpoint ip addresses attached to the load balancer`s target group
   */
  readonly vpcEndpointIPAddresses: Array<string>;

  /**
   * List of alternative domains attached to the solution.
   */
  readonly subjectAlternativeNames: string[];

  /**
   * Subdomain attached to hosted zone name.
   */
  readonly subDomain: string;

  /**
   * Name of hosted zone that will be used for the custom domain.
   */
  readonly hostedZoneName: string;
}

export class InternalServiceStack extends Construct {
  /**
   * List of domains created by the internal service stack and shared with the api gateway stack.
   */
  public readonly domains: apigateway.IDomainName[];

  /**
   * VPC Endpoint Id of the execute-api vpc endpoint.
   */
  public readonly vpcEndpointId: ec2.IInterfaceVpcEndpoint;

  constructor(scope: Construct, id: string, props: InternalServiceStackProps) {
    super(scope, id);

    const uid: string = Names.uniqueId(scope);

    this.vpcEndpointId =
      ec2.InterfaceVpcEndpoint.fromInterfaceVpcEndpointAttributes(
        this,
        `VPCEndpoint-${uid}`,
        {
          port: 443,
          vpcEndpointId: props.vpcEndpointId,
        },
      );

    const domainName = `${props.subDomain}.${props.hostedZoneName}`;
    const hostedZone = route53.HostedZone.fromLookup(this, `HostedZone-${uid}`, {
      domainName: `${props.hostedZoneName}`,
      privateZone: true,
      vpcId: props.vpc.vpcId,
    });

    const cert = new certificatemanager.Certificate(this, `SSLCertificate-${uid}`, {
      domainName: domainName,
      subjectAlternativeNames: props.subjectAlternativeNames,
      validation: certificatemanager.CertificateValidation.fromDnsMultiZone({
        domainName: hostedZone,
      }),
    });

    const domain = new apigateway.DomainName(this, `ApiGatewayCustomDomain-${uid}`, {
      domainName: `${props.subDomain}.${props.hostedZoneName}`,
      certificate: cert,
      endpointType: apigateway.EndpointType.REGIONAL,
      securityPolicy: apigateway.SecurityPolicy.TLS_1_2,
    });
    this.domains = [domain];

    for (const domainItem of props.subjectAlternativeNames) {
      const sanDomain = new apigateway.DomainName(
        this,
        `Domain-${domainItem}-${uid}`,
        {
          domainName: domainItem,
          certificate: cert,
          endpointType: apigateway.EndpointType.REGIONAL,
          securityPolicy: apigateway.SecurityPolicy.TLS_1_2,
        },
      );
      this.domains.push(sanDomain);
    }

    const loadBalancerSecurityGroup = new ec2.SecurityGroup(
      this,
      `LoadBalancerSecurityGroup-${uid}`,
      {
        securityGroupName: '-lb-sg',
        vpc: props.vpc,
        allowAllOutbound: true,
        description: 'security group for a load balancer',
      },
    );

    loadBalancerSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'allow HTTPS traffic from anywhere',
    );

    const alb = new elb.ApplicationLoadBalancer(
      this,
      `ApplicationLoadBalancer-${uid}`,
      {
        vpc: props.vpc,
        vpcSubnets: {
          subnets: props.subnetSelection.subnets,
        },
        internetFacing: false,
        securityGroup: loadBalancerSecurityGroup,
        loadBalancerName: `lb-${uid}`,
      },
    );

    new route53.ARecord(this, `Route53Record-${uid}`, {
      zone: hostedZone,
      target: route53.RecordTarget.fromAlias(
        new targets.LoadBalancerTarget(alb),
      ),
      recordName: domainName,
    });

    const targetGroupTargets: elasticloadbalancingv2targets.IpTarget[] = [];

    for (const ip of props.vpcEndpointIPAddresses!) {
      targetGroupTargets.push(new elasticloadbalancingv2targets.IpTarget(ip));
    }

    const targetGroup = new elb.ApplicationTargetGroup(this, `TargetGroup-${uid}`, {
      port: 443,
      vpc: props.vpc,
      protocol: elb.ApplicationProtocol.HTTPS,
      targetType: elb.TargetType.IP,
      targets: targetGroupTargets,
      targetGroupName: `tg-${uid}`,
    });

    const listener = alb.addListener(`Listener-${uid}`, {
      port: 443,
      certificates: [cert],
    });

    listener.addTargetGroups(`TargetGroupAttachment-${uid}`, {
      targetGroups: [targetGroup],
    });

    new CfnOutput(this, `DomainUrl-${uid}`, {
      value: `https://${domainName}`,
      description: 'service url',
      exportName: '-DomainUrl',
    });
  }
}
