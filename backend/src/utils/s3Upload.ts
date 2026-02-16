// import { PutObjectCommand } from "@aws-sdk/client-s3";
// import { s3 } from "../config/s3";
// import fs from "fs";

// export const uploadToS3 = async (
//   filePath: string,
//   key: string,
//   contentType: string
// ) => {
//   const fileStream = fs.createReadStream(filePath);

//   const command = new PutObjectCommand({
//     Bucket: process.env.AWS_S3_BUCKET_NAME!,
//     Key: key,
//     Body: fileStream,
//     ContentType: contentType,
//   });

//   await s3.send(command);

//   return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
// };