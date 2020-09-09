import * as cdk from "@aws-cdk/core";
import * as ec2 from "@aws-cdk/aws-ec2";
import * as autoscaling from "@aws-cdk/aws-autoscaling";
import * as elbv2 from "@aws-cdk/aws-elasticloadbalancingv2";

export class AwsCdkHaArchStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create new VPC
    const vpc = new ec2.Vpc(this, 'VPC', {
      cidr: "10.0.0.0/16",
      maxAzs: 2,
      subnetConfiguration: [
        {
          name: 'pub-one',
          cidrMask: 24,
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          name: 'priv-one',
          cidrMask: 24,
          subnetType: ec2.SubnetType.PRIVATE,
        }
      ]
    });

    const mySecurityGroup = new ec2.SecurityGroup(this, 'SecurityGroup', {
      vpc,
      securityGroupName: "my-test-sg",
      description: 'test SG',
      allowAllOutbound: true,
     });

     mySecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'port 80')
     mySecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'port 443')

     // Auto Scaling Group
     const asg = new autoscaling.AutoScalingGroup(this, 'ASG', {
      vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.NANO),
      machineImage: new ec2.AmazonLinuxImage({ generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2 }),
      securityGroup: mySecurityGroup,
      minCapacity: 2,
      desiredCapacity: 2,
      maxCapacity: 4
    });

    // Add User data
    asg.userData.addCommands(
     ` #!/bin/bash`,
      `yum install httpd -y`,
      `curl http://169.254.169.254/latest/meta-data/instance-id/ >> /var/www/html/index.html`,
      `service httpd start`,
      `chkconfig httpd on`
    )

    // Create Load Balancer
    const lb = new elbv2.ApplicationLoadBalancer(this, 'LB', {
      vpc,
      internetFacing: true
    });

    const listener = lb.addListener('Listener', {
      port: 80,
    });

    listener.addTargets('Target', {
      port: 80,
      targets: [asg]
    });

    listener.connections.allowDefaultPortFromAnyIpv4('Open to the world');

  }
}
