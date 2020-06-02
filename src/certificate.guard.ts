import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import * as crypto from 'crypto';
import { LogService } from './@shared/log-shared/log.service';

/**
 * Guard to use with certificate cheking. The guard will check the cerificate under the "X-Client-Cert"
 * HTTP header and will challenge it with the private key stored inside the app's configuration.
 * To generate a private key you can use openssl:
 * ```shell
 * openssl genrsa 2048 > certificate.key
 * ```
 * To generate a public certificate with the private key:
 * ```shell
 * openssl req -new -key ~/certificates/certificate.key -x509 \
 * -subj "/C=FR/ST=Paris/L=Paris/O=Cerberus/OU=The First Spine/CN=service.thefirstspine.fr"
 * ```
 */
@Injectable()
export class CertificateGuard implements CanActivate {

  constructor(
    private readonly logService: LogService,
  ) {}

  /**
   * @inheritdoc
   * @param context
   */
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // Check the bearer JSON token
    if (
      !context.switchToHttp().getRequest().headers ||
      !context.switchToHttp().getRequest().headers['x-client-cert']
    ) {
      return false;
    }

    // Get the key pairs
    const publicKeyStr: string = Buffer.from(context.switchToHttp().getRequest().headers['x-client-cert'], 'base64').toString();
    const privateKeyStr: string = process.env.PRIVATE_KEY.replace(/\\n/gm, '\n');

    try {
      // Create the challenge
      const challenge: string = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(10);

      // Encrypt / decrypt the challenge
      const encryptedBuffer: Buffer = crypto.publicEncrypt(publicKeyStr, new Buffer(challenge));
      const decryptedBuffer: Buffer = crypto.privateDecrypt(privateKeyStr, encryptedBuffer);

      // Return challenge result
      return decryptedBuffer.toString() === challenge;
    } catch (exception) {
      this.logService.error(
        `Cannot challenge the public certificate with private key`, {
          message: exception.message,
          name: exception.name,
          stack: exception.stack,
        });
      return false;
    }
  }

}
