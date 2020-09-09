#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { AwsCdkHaArchStack } from '../lib/aws-cdk-ha-arch-stack';

const app = new cdk.App();
new AwsCdkHaArchStack(app, 'AwsCdkHaArchStack');
app.synth();
