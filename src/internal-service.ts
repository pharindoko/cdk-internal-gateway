import {
  aws_apigateway as apigateway,
  aws_certificatemanager as certificatemanager,
  aws_ec2 as ec2,
  aws_elasticloadbalancingv2 as elb,
  aws_elasticloadbalancingv2_targets as elasticloadbalancingv2targets,
  aws_route53 as route53,
  aws_route53_targets as targets,
  CfnOutput,
} from "aws-cdk-lib";
import { IVpc, SubnetSelection } from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";

/**
 * Properties for InternalService
 */
export interface InternalServiceProps {
  /**
   * VPC attached to the application load balancer.
   */
  readonly vpc: IVpc;

  /**
   * Subnets attached to the application load balancer.
   */
  readonly subnetSelection: SubnetSelection;

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
   * Hosted zone that will be used for the custom domain.
   */
  readonly hostedZone: route53.IHostedZone;

  /**
   * SSLPolicy attached to the load balancer listener.
   *
   * @default elb.SslPolicy.FORWARD_SECRECY_TLS12_RES_GCM
   */
  readonly loadBalancerListenerSSLPolicy?: elb.SslPolicy;

  /**
   * SSLPolicy attached to the apigateway custom domain.
   *
   * @default apigateway.SslPolicy.TLS_1_2
   */
  readonly customDomainSSLPolicy?: apigateway.SecurityPolicy;
}

export class InternalService extends Construct {
  /**
   * List of domains created by the internal service stack and shared with the api gateway stack.
   */
  public readonly domains: apigateway.IDomainName[];

  constructor(scope: Construct, id: string, props: InternalServiceProps) {
    super(scope, id);

    const domainName = `${props.subDomain}.${props.hostedZone.zoneName}`;

    const certificate = new certificatemanager.Certificate(
      this,
      `SSLCertificate-${id}`,
      {
        domainName: domainName,
        subjectAlternativeNames: props.subjectAlternativeNames,
        validation: certificatemanager.CertificateValidation.fromDnsMultiZone({
          domainName: props.hostedZone,
        }),
      }
    );

    const domain = new apigateway.DomainName(
      this,
      `ApiGatewayCustomDomain-${id}`,
      {
        domainName: `${props.subDomain}.${props.hostedZone.zoneName}`,
        certificate: certificate,
        endpointType: apigateway.EndpointType.REGIONAL,
        securityPolicy:
          props?.customDomainSSLPolicy ?? apigateway.SecurityPolicy.TLS_1_2,
      }
    );

    this.domains = [domain];

    for (const domainItem of props.subjectAlternativeNames) {
      const sanDomain = new apigateway.DomainName(
        this,
        `Domain-${domainItem}-${id}`,
        {
          domainName: domainItem,
          certificate: certificate,
          endpointType: apigateway.EndpointType.REGIONAL,
          securityPolicy: apigateway.SecurityPolicy.TLS_1_2,
        }
      );
      this.domains.push(sanDomain);
    }

    const loadBalancerSecurityGroup = new ec2.SecurityGroup(
      this,
      `LoadBalancerSecurityGroup-${id}`,
      {
        vpc: props.vpc,
        allowAllOutbound: true,
        description: "security group for a load balancer",
      }
    );

    loadBalancerSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      "allow HTTPS traffic from anywhere"
    );

    const applicationLoadBalancer = new elb.ApplicationLoadBalancer(
      this,
      `ApplicationLoadBalancer-${id}`,
      {
        vpc: props.vpc,
        vpcSubnets: {
          subnets: props.subnetSelection.subnets,
        },
        internetFacing: false,
        securityGroup: loadBalancerSecurityGroup,
      }
    );

    // Add http-to-https redirect
    applicationLoadBalancer.addRedirect();

    new route53.ARecord(this, `Route53Record-${id}`, {
      zone: props.hostedZone,
      target: route53.RecordTarget.fromAlias(
        new targets.LoadBalancerTarget(applicationLoadBalancer)
      ),
      recordName: domainName,
    });

    const targetGroupTargets: elasticloadbalancingv2targets.IpTarget[] = [];

    for (const ip of props.vpcEndpointIPAddresses!) {
      targetGroupTargets.push(new elasticloadbalancingv2targets.IpTarget(ip));
    }

    const targetGroup = new elb.ApplicationTargetGroup(
      this,
      `TargetGroup-${id}`,
      {
        port: 443,
        vpc: props.vpc,
        protocol: elb.ApplicationProtocol.HTTPS,
        targetType: elb.TargetType.IP,
        targets: targetGroupTargets,
      }
    );

    const listener = applicationLoadBalancer.addListener(`Listener-${id}`, {
      port: 443,
      certificates: [certificate],
      sslPolicy:
        props?.loadBalancerListenerSSLPolicy ??
        elb.SslPolicy.FORWARD_SECRECY_TLS12_RES_GCM,
    });

    listener.addTargetGroups(`TargetGroupAttachment-${id}`, {
      targetGroups: [targetGroup],
    });

    new CfnOutput(this, `DomainUrl-${id}`, {
      value: `https://${domainName}`,
      description: "service url",
    });
  }
}
