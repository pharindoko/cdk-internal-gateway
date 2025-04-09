import {
  aws_apigateway as apigateway,
  aws_certificatemanager as certificatemanager,
  aws_ec2 as ec2,
  aws_elasticloadbalancingv2 as elb,
  aws_elasticloadbalancingv2_targets as elasticloadbalancingv2targets,
  aws_route53 as route53,
  aws_route53_targets as targets,
  aws_s3 as s3,
  CfnOutput,
  RemovalPolicy,
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

  /**
   * Use a custom security group used for the load balancer.
   * By default, a security group will be created with inbound access to the typical private network CIDR ranges 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16 and port 443.
   * Any inbound access (0.0.0.0/0) is blocked by default to follow AWS best practices for security.
   * Outbound traffic is allowed to all destinations.
   */
  readonly loadBalancerSecurityGroup?: ec2.ISecurityGroup;

  /**
   * Enable or disable access logs for the load balancer to follow AWS best practices for security.
   *
   * @default true
   */
  readonly enableLoadBalancerAccessLogs?: boolean;

  /**
   * Add load balancer redirect from port 80 to 443.
   *
   * @default true
   */
  readonly addLoadBalancerRedirect?: boolean;
}

export class InternalService extends Construct {
  /**
   * List of domains created by the internal service stack and shared with the api gateway stack.
   */
  public readonly domains: apigateway.IDomainName[];

  /**
   * The application load balancer created by the internal service stack.
   */
  public readonly applicationLoadBalancer: elb.ApplicationLoadBalancer;

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

    let sgImmutable: ec2.ISecurityGroup;

    if (props.loadBalancerSecurityGroup) {
      sgImmutable = ec2.SecurityGroup.fromSecurityGroupId(
        this,
        "LoadBalancerSecurityGroupImmutable",
        props.loadBalancerSecurityGroup?.securityGroupId,
        { mutable: false }
      );
    } else {
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
        ec2.Peer.ipv4("10.0.0.0/8"),
        ec2.Port.tcp(443),
        "allow HTTPS traffic from private CIDR range"
      );
      loadBalancerSecurityGroup.addIngressRule(
        ec2.Peer.ipv4("172.16.0.0/12"),
        ec2.Port.tcp(443),
        "allow HTTPS traffic from private CIDR range"
      );
      loadBalancerSecurityGroup.addIngressRule(
        ec2.Peer.ipv4("192.168.0.0/16"),
        ec2.Port.tcp(443),
        "allow HTTPS traffic from private CIDR range"
      );

      sgImmutable = ec2.SecurityGroup.fromSecurityGroupId(
        this,
        "LoadBalancerSecurityGroupImmutable",
        loadBalancerSecurityGroup.securityGroupId,
        { mutable: false }
      );
    }

    this.applicationLoadBalancer = new elb.ApplicationLoadBalancer(
      this,
      `ApplicationLoadBalancer-${id}`,
      {
        vpc: props.vpc,
        vpcSubnets: {
          subnets: props.subnetSelection.subnets,
        },
        internetFacing: false,
        securityGroup: sgImmutable,
      }
    );

    const enableLoadBalancerAccessLogs =
      props.enableLoadBalancerAccessLogs ?? true;
    if (enableLoadBalancerAccessLogs) {
      //create a private s3 bucket
      const bucket = new s3.Bucket(this, "ApplicationLoadBalancerLogs-${id}", {
        versioned: true,
        removalPolicy: RemovalPolicy.DESTROY,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        enforceSSL: true,
        encryption: s3.BucketEncryption.S3_MANAGED,
        autoDeleteObjects: true,
      });
      //create access logs for the load balancer
      this.applicationLoadBalancer.logAccessLogs(bucket);
    }
    // Add http-to-https redirect
    const addLoadBalancerRedirect = props.addLoadBalancerRedirect ?? true;
    if (addLoadBalancerRedirect) {
      this.applicationLoadBalancer.addRedirect();
    }

    new route53.ARecord(this, `Route53Record-${id}`, {
      zone: props.hostedZone,
      target: route53.RecordTarget.fromAlias(
        new targets.LoadBalancerTarget(this.applicationLoadBalancer)
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

    const listener = this.applicationLoadBalancer.addListener(`Listener-${id}`, {
      port: 443,
      certificates: [certificate],
      sslPolicy:
        props?.loadBalancerListenerSSLPolicy ??
        elb.SslPolicy.FORWARD_SECRECY_TLS12_RES_GCM,
      open: false,
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
