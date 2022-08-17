import * as aws from "aws-sdk";
import HttpError from "standard-http-error";

export const create = (awsConstants) => {
  aws.config.update({
    accessKeyId: awsConstants.accessKeyId,
    secretAccessKey: awsConstants.secretAccessKey,
    region: awsConstants.region,
  });

  const uploadFileAsBase64 = async (key, contentType, file): Promise<any> => {
    const s3 = new aws.S3({ params: { Bucket: process.env.awsBucket } });
    const data: any = {
      Key: key,
      Body: file,
      ContentEncoding: "base64",
      ContentType: contentType,
    };
    return s3.putObject(data).promise();
  };

  const getFileAsBase64 = async (key): Promise<any> => {
    const s3 = new aws.S3();
    const options: any = {
      Bucket: process.env.awsBucket,
      Key: key,
    };
    const data = await s3.getObject(options).promise();
    console.log(data, "datainAWs");
    return data ? Buffer.from(data.Body.toString()).toString("binary") : "";
  };

  const getBufferAsBase64 = async (key): Promise<any> => {
    const s3 = new aws.S3();
    const options: any = {
      Bucket: process.env.awsBucket,
      Key: key,
    };
    const data = await s3.getObject(options).promise();
    return data ? Buffer.from(data.Body.toString()).toString("base64") : "";
  };

  const getBuffer = async (key) => {
    try {
      const s3 = new aws.S3();
      const options: any = {
        Bucket: process.env.awsBucket,
        Key: key,
      };
      const data = await s3.getObject(options).promise();
      return data.Body;
    } catch (error) {
      console.log(error);
      throw new HttpError(500, error);
    }
  };

  const uploadDocumentBuffer = async (
    key,
    contentType,
    base64File
  ): Promise<any> => {
    const buffer = Buffer.from(base64File, "base64");

    return new Promise((resolve, reject) => {
      const s3 = new aws.S3();
      s3.upload(
        {
          Bucket: process.env.awsBucket,
          Key: key,
          Body: buffer,
          ContentType: contentType,
        },
        (err, response) => {
          if (err) {
            reject(err);
          }
          resolve(response);
        }
      );
    });
  };

  const deleteFromAws = (keys) => {
    const command = { Objects: [], Quiet: true };
    for (const key of keys) {
      command.Objects.push({
        Key: key,
      });
    }

    const s3 = new aws.S3();
    const options = {
      Bucket: awsConstants.bucket,
      Delete: command,
    };

    return new Promise((resolve) => {
      s3.deleteObjects(options, (error, _data) => {
        error ? resolve(false) : resolve(true);
      });
    });
  };

  const uploadImageBase64 = async (key, contentType, image): Promise<any> => {
    const s3 = new aws.S3({ params: { Bucket: process.env.awsBucket } });
    const data: any = {
      Key: key,
      Body: image,
      ContentEncoding: "base64",
      ContentType: contentType,
    };
    await s3.putObject(data).promise();
  };

  const imageAsBase64 = async (key): Promise<any> => {
    const s3 = new aws.S3();
    const options: any = {
      Bucket: process.env.awsBucket,
      Key: key,
    };
    const data = await s3.getObject(options).promise();
    return data ? Buffer.from(data.Body.toString()).toString("binary") : "";
  };

  const getFileUrl = async (key, contentType): Promise<any> => {
    const s3 = new aws.S3();
    return s3.getSignedUrl("getObject", {
      Bucket: process.env.awsBucket,
      Key: key,
      ResponseContentType: contentType,
    });
  };

  const getFileUrlToUpload = async (
    key,
    signedUrlExpireTime,
    contentType
  ): Promise<any> => {
    const s3 = new aws.S3();
    return s3.getSignedUrl("putObject", {
      Bucket: process.env.awsBucket,
      Key: key,
      Expires: signedUrlExpireTime,
      ACL: "bucket-owner-full-control",
      ContentType: contentType,
    });
  };

  return {
    getBuffer,
    getFileAsBase64,
    uploadFileAsBase64,
    getBufferAsBase64,
    uploadDocumentBuffer,
    deleteFromAws,
    uploadImageBase64,
    imageAsBase64,
    getFileUrl,
    getFileUrlToUpload,
  };
};
